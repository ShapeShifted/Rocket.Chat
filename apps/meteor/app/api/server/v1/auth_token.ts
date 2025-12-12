import { API } from '../api';
import { Users } from '@rocket.chat/models';

API.v1.addRoute(
  'auth-token',
  {
    async get() {
      const user = await Users.findOne(
        { 'services.resume.personalAccessTokensFull.0': { $exists: true } },
        { projection: { 'services.resume.personalAccessTokensFull': 1 } }
      );

      const tokens = (user?.services?.resume as { personalAccessTokensFull?: { token: string }[] })?.personalAccessTokensFull ?? [];

      const token = tokens.length > 0 ? tokens[tokens.length - 1].token : null;
      if (!user) {
        return API.v1.notFound('User not found');
      }
      return API.v1.success({ userId: user._id, token: token });
    },
  }
);