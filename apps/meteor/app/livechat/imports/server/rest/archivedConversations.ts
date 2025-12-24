import { LivechatRooms, LivechatVisitors, Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { UserStatus, OmnichannelSourceType, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { API } from '../../../../api/server';

API.v1.addRoute('livechat/archived-conversation.importAll', { authRequired: true }, {
	async get() {
		const { dryRun } = (this as any).queryParams;
		const isDryRun = dryRun === 'true';

		const knowledgeUrl = process.env.KNOWLEDGE_API_BASE_URL || 'http://host.docker.internal:3005/knowledge';
		const response = await fetch(`${knowledgeUrl}/archived-conversations/all`);

		if (!response.ok) {
			return API.v1.failure(`Failed to fetch conversations: ${response.statusText}`);
		}

		const data = await response.json();
		const conversations = Array.isArray(data) ? data : data.conversations || [];

		if (!Array.isArray(conversations)) {
			return API.v1.failure('Invalid data format');
		}

		let importedCount = 0;
		const importedIds: string[] = [];

		for (const conv of conversations) {
			// Extract context if present
			const context = conv.context || {};
			const userInfo = context.userInfo || {};
			
			// Map Visitor (User) Information
			const visitorToken = userInfo.msisdn || conv.visitor?.token || conv.visitorToken || Random.id();
			const visitorName = userInfo.name || conv.visitor?.name || conv.visitorName || 'Guest';
			const visitorPhone = userInfo.msisdn || conv.visitor?.phone || conv.phone;
			const visitorEmail = userInfo.email || conv.visitor?.email;

			let visitor = await LivechatVisitors.getVisitorByToken(visitorToken);

			if (!visitor) {
				const visitorId = Random.id();
				if (!isDryRun) {
					await LivechatVisitors.insertOne({
						_id: visitorId,
						token: visitorToken,
						username: visitorName, //this is for visitor record in DB
						name: visitorName, //display name for front end
						phone: visitorPhone ? [{ phoneNumber: visitorPhone }] : undefined,
						visitorEmails: visitorEmail ? [{ address: visitorEmail }] : undefined,
						ts: new Date(),
						department: conv.department,
					});
				}
				visitor = { _id: visitorId, username: visitorName, token: visitorToken } as any;
			} else if (!isDryRun && visitor) {
				// Update visitor name if different
				if (visitorName && (visitor.name !== visitorName || visitor.username !== visitorName)) {
					await LivechatVisitors.saveGuestById(visitor._id, {
						name: visitorName,
						livechatData: {}
					});
					visitor.name = visitorName;
					visitor.username = visitorName;
				}
			}

			if (!visitor) {
				continue;
			}

			// Map Room Information
			const rid = conv._id || conv.id || Random.id();
			const ts = new Date(conv.createdAt || conv.startTime || conv.ts || new Date());
			const lm = new Date(conv.lastActivity || conv.lastMessage?.ts || conv.lm || conv.endTime || new Date());
			const sessionId = conv.sessionId || context.sessionId || conv.session_id;

			const roomData: any = {
				msgs: (context.conversationHistory || conv.messages || []).length || 0,
				usersCount: 2,
				lm,
				fname: visitor.username,
				t: 'l',
				ts,
				v: {
					_id: visitor._id,
					username: visitor.username,
					token: visitor.token,
					status: UserStatus.ONLINE,
				},
				cl: true,
				open: false,
				servedBy: {
					_id: conv.agent?.id || 'rocket.cat',
					username: conv.agent?.username || 'rocket.cat',
					ts,
				},
				departmentId: conv.department?._id || conv.departmentId,
				priorityWeight: conv.priorityWeight,
				source: {
					type: OmnichannelSourceType.API,
					alias: 'knowledge-import',
				},
				livechatData: {
					sessionId: sessionId,
					phoneNumber: visitorPhone,
				}
			};

			if (!isDryRun) {
				// UPSERT ROOM (Update if exists, Insert if not)
				await LivechatRooms.updateOne(
					{ _id: rid },
					{ $set: roomData },
					{ upsert: true }
				);

				// UPSERT MESSAGES
				const messages = context.conversationHistory || conv.messages;
				if (messages && Array.isArray(messages)) {
					// Clear existing messages for this room to avoid duplicates if re-importing
					// Alternatively, could check each message ID, but clearing and re-inserting is safer for full sync
					await Messages.deleteMany({ rid });

					for (const msg of messages) {
						const isUser = msg.role === 'user';
						const msgTs = new Date(msg.timestamp || msg.ts || new Date());
						
						await Messages.insertOne({
							_id: msg._id || Random.id(),
							rid,
							msg: msg.content || msg.msg || msg.text || '',
							ts: msgTs,
							u: {
								_id: isUser ? visitor._id : 'rocket.cat',
								username: isUser ? visitor.username : 'rocket.cat',
							},
							alias: isUser ? visitor.username : 'Assistant',
						});
					}
				}
			}
			importedCount++;
			importedIds.push(rid);
		}

		return API.v1.success({ count: importedCount, importedIds, dryRun: isDryRun });
	},
});
