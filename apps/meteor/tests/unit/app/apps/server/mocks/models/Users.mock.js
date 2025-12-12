import { BaseModelMock } from './BaseModel.mock';

export class UsersMock extends BaseModelMock {
	data = {
		'docubutler': {
			_id: 'docubutler',
			createdAt: new Date('2019-03-27T20:51:36.821Z'),
			avatarOrigin: 'local',
			name: 'docubutler',
			username: 'docubutler',
			status: 'online',
			statusDefault: 'online',
			utcOffset: 0,
			active: true,
			type: 'bot',
			_updatedAt: new Date('2019-03-30T01:11:50.496Z'),
			roles: ['bot'],
		},
	};

	static convertedData = {
		'docubutler': {
			id: 'docubutler',
			username: 'docubutler',
			emails: [
				{
					address: 'rocketcat@rocket.chat',
					verified: true,
				},
			],
			type: 'bot',
			isEnabled: true,
			name: 'docubutler',
			roles: ['bot'],
			status: 'online',
			statusConnection: 'online',
			utcOffset: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLoginAt: undefined,
		},
	};
}
