import type { ILivechatContact, IOmnichannelRoom, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { FindPaginated } from '@rocket.chat/model-typings';
import { LivechatContacts, LivechatDepartment, LivechatRooms } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';
import type { PaginatedResult, VisitorSearchChatsResult } from '@rocket.chat/rest-typings';
import type { FindOptions, Sort, FindCursor } from 'mongodb';

export type GetContactHistoryParams = {
	contactId: string;
	source?: string;
	count: number;
	offset: number;
	sort: Sort;
};

export const fetchContactHistory = makeFunction(
	async ({
		contactId,
		options,
	}: {
		contactId: string;
		options?: FindOptions<IOmnichannelRoom>;
		extraParams?: Record<string, any>;
	}): Promise<FindPaginated<FindCursor<IOmnichannelRoom>>> =>
		LivechatRooms.findClosedRoomsByContactPaginated({
			contactId,
			options,
		}),
);

export const getContactHistory = makeFunction(
	async (params: GetContactHistoryParams): Promise<PaginatedResult<{ history: VisitorSearchChatsResult[] }>> => {
		const { contactId, count, offset, sort } = params;

		const contact = await LivechatContacts.findOneEnabledById<Pick<ILivechatContact, '_id'>>(contactId, { projection: { _id: 1 } });

		if (!contact) {
			throw new Error('error-contact-not-found');
		}

		const options: FindOptions<IOmnichannelRoom> = {
			sort: sort || { closedAt: -1 },
			skip: offset,
			limit: count,
			projection: {
				fname: 1,
				ts: 1,
				v: 1,
				msgs: 1,
				servedBy: 1,
				closedAt: 1,
				closedBy: 1,
				closer: 1,
				tags: 1,
				source: 1,
				lastMessage: 1,
				closingMessage: 1,
				verified: 1,
				departmentId: 1,
				priorityWeight: 1,
				lm: 1,
				open: 1,
				onHold: 1,
				sessionId: 1,
				livechatData: 1,
			},
		};

		const { totalCount, cursor } = await fetchContactHistory({
			contactId: contact._id,
			options,
			extraParams: params,
		});

		const [total, history] = await Promise.all([totalCount, cursor.toArray()]);

		const departments = (
			await LivechatDepartment.find(
				{
					_id: { $in: history.map((room) => room.departmentId).filter(Boolean) as string[] },
				},
				{ projection: { name: 1 } },
			).toArray()
		).reduce((acc, dep) => {
			acc[dep._id] = dep;
			return acc;
		}, {} as Record<string, ILivechatDepartment>);

		return {
			history: history.map((room) => {
				if (room.departmentId) {
					return {
						...room,
						department: departments[room.departmentId],
					};
				}
				return room;
			}),
			count: history.length,
			offset,
			total,
		};
	},
);
