import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';


import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { saveDepartment } from '../lib/departmentsLib';
import { LivechatDepartment } from '@rocket.chat/models';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveDepartment': (
			_id: string | null,
			departmentData: {
				enabled: boolean;
				name: string;
				description?: string;
				showOnRegistration: boolean;
				email: string;
				showOnOfflineForm: boolean;
				requestTagBeforeClosingChat?: boolean;
				chatClosingTags?: string[];
				fallbackForwardDepartment?: string;
				departmentsAllowedToForward?: string[];
				allowReceiveForwardOffline?: boolean;
				enableAgentDepartment?: boolean;
			},
			departmentAgents?:
				| {
						agentId: string;
						count?: number | undefined;
						order?: number | undefined;
				  }[]
				| undefined,
			departmentUnit?: { _id?: string },
		) => ILivechatDepartment;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveDepartment'(_id, departmentData, departmentAgents, departmentUnit) {
		methodDeprecationLogger.method('livechat:saveDepartment', '8.0.0', '/v1/livechat/department');

		const uid = Meteor.userId();

		if (!uid || !(await hasPermissionAsync(uid, 'manage-livechat-departments'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartment',
			});
		}

		// Call saveDepartment and map DB duplicate-key errors (race conditions) into a friendly Meteor.Error
		try {
			const result = await saveDepartment(uid, _id, departmentData, { upsert: departmentAgents }, departmentUnit);
			return result;
		} catch (err: any) {
			// Log full error object at debug level and a short message at warn/error
			const msg = err?.message ?? err?.errmsg ?? String(err);

			const isDup =
				err?.code === 11000 ||
				err?.codeName === 'DuplicateKey' ||
				(typeof msg === 'string' &&
					(msg.includes('E11000') ||
						msg.toLowerCase().includes('duplicate key') ||
						msg.includes('unique_enableAgentDepartment_enabled_true') ||
						msg.includes('enableAgentDepartment')));

			if (isDup) {
				throw new Meteor.Error('error-enable-agent-department-exists', 'Only one Human Agent Department can be enabled at a time');
			}

			throw err;
		}
	},
});