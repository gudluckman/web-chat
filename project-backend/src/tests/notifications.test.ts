import request from "sync-request";
import { SERVER_URL, OK, AUTH_ERROR } from "../config/server.config";
import { requestAuthRegisterV2 } from "./auth.help";
import { requestChannelInviteV2, requestChannelJoinV2, requestChannelLeaveV1 } from "./channel.help";
import { requestChannelsCreateV2 } from "./channels.help";
import { requestDmCreateV1, requestDmLeaveV1 } from "./dm.help";
import { requestMessageEditV1, requestMessageReactV1, requestMessageRemoveV1, requestMessageSendDmV1, requestMessageSendV1, requestMessageShareV1, requestMessageUnreactV1 } from "./message.help";
import { requestNotificationsV1 } from "./notifications.help";

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});
  
afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

// No error cases other than invalid token
describe('notifications/get/v1 tests', () => {
  describe('Error case', () => {
    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');

      expect(requestNotificationsV1(token + 'a', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Sucess cases', () => {
    test('User is added to a channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First channel', true);

      requestChannelInviteV2(token, channelId, user.authUserId);
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(token)).toStrictEqual({ notifications: [] });
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: 'johnsmith added you to First channel'
          }
        ]
      });
    });

    test('User is added to a dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user.authUserId]);

      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(token)).toStrictEqual({ notifications: [] });
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith added you to johnsmith, johnsmith0'
          }
        ]
      });
    });

    test('User is tagged in a channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);

      requestChannelJoinV2(user.token, channelId);
      requestMessageSendV1(token, channelId, '@johnsmith0 hello');

      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: @johnsmith0 hello'
          }
        ]
      });
    });

    test('User is tagged in a dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user.authUserId]);

      requestMessageSendDmV1(token, dmId, '@johnsmith0 hello');
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith added you to johnsmith, johnsmith0'
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith tagged you in johnsmith, johnsmith0: @johnsmith0 hello'
          }
        ]
      });
    });

    test('User reacted in a dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user.authUserId]);

      const { messageId } = requestMessageSendDmV1(user.token, dmId, 'hello world');
      requestMessageReactV1(token, messageId, 1)
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith added you to johnsmith, johnsmith0'
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith reacted to your message in johnsmith, johnsmith0'
          }
        ]
      });
    });

    test('User reacted in a channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);

      requestChannelJoinV2(user.token, channelId);
      const { messageId } = requestMessageSendV1(user.token, channelId, 'hellow world');
      requestMessageReactV1(token, messageId, 1);

      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: 'johnsmith reacted to your message in First'
          }
        ]
      });
    });

    test('User unreacted a message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);

      requestChannelJoinV2(user.token, channelId);
      const { messageId } = requestMessageSendV1(user.token, channelId, 'hellow world');
      requestMessageReactV1(token, messageId, 1);
      requestMessageUnreactV1(token, messageId, 1);

      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: channelId,
            dmId: -1,
            notificationMessage: 'johnsmith reacted to your message in First'
          }
        ]
      });
    });

    test('tagged message has been edited', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user.authUserId]);

      const { messageId } = requestMessageSendDmV1(token, dmId, '@johnsmith0 hello');
      requestMessageEditV1(token, messageId, 'Hello World');
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith added you to johnsmith, johnsmith0'
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith tagged you in johnsmith, johnsmith0: @johnsmith0 hello'
          }
        ]
      });
    });

    test('tagged message has been removed', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user.authUserId]);

      const { messageId } = requestMessageSendDmV1(token, dmId, '@johnsmith0 hello');
      requestMessageRemoveV1(token, messageId);
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith added you to johnsmith, johnsmith0'
          },
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith tagged you in johnsmith, johnsmith0: @johnsmith0 hello'
          }
        ]
      });
    });

    test('reacted to a message in a channel that the user is no longer in', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);

      requestChannelJoinV2(user.token, channelId);
      const { messageId } = requestMessageSendV1(user.token, channelId, 'hellow world');
      requestChannelLeaveV1(user.token, channelId);
      requestMessageReactV1(token, messageId, 1);

      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({ notifications: [] });
    });

    test('reacted to a message in a dm that the user is no longer in', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user.authUserId]);

      const { messageId } = requestMessageSendDmV1(user.token, dmId, 'hello world');
      requestDmLeaveV1(user.token, dmId);
      requestMessageReactV1(token, messageId, 1);

      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId: -1,
            dmId: dmId,
            notificationMessage: 'johnsmith added you to johnsmith, johnsmith0'
          }
        ]
      });
    });

    test('no spaces in tag', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);
      requestChannelJoinV2(user.token, channelId);

      requestMessageSendV1(token, channelId, 'hi@johnsmith0');
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0'
          }
        ]
      });
    });

    test('Two tags in a row', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);
      requestChannelJoinV2(user.token, channelId);

      requestMessageSendV1(token, channelId, 'hi@johnsmith0@johnsmith hello!');
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0@johnsm'
          }
        ]
      });

      expect(requestNotificationsV1(token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0@johnsm'
          }
        ]
      });
    });

    test('Edit message to contain the same tag + another tag', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);
      requestChannelJoinV2(user.token, channelId);

      const { messageId } = requestMessageSendV1(token, channelId, 'hi@johnsmith0 hello!');
      requestMessageEditV1(token, messageId, 'hi @johnsmith0 @johnsmith hello!');
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0 hello!'
          }
        ]
      });

      expect(requestNotificationsV1(token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi @johnsmith0 @john'
          }
        ]
      });
    });

    test('message share tag', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);
      requestChannelJoinV2(user.token, channelId);

      const { messageId } = requestMessageSendV1(token, channelId, 'hi@johnsmith0 hello!');
      requestMessageShareV1(token, messageId, '', channelId, -1, 1);
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0 hello!'
          },
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0 hello!'
          }
        ]
      });
    });

    test('Tags in both optional and original message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'First', true);
      requestChannelJoinV2(user.token, channelId);

      const { messageId } = requestMessageSendV1(token, channelId, 'hi@johnsmith0 hello!');
      requestMessageShareV1(token, messageId, '@johnsmith', channelId, -1, 1);
      expect(requestNotificationsV1(user.token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(user.token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0 hello!'
          },
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0 hello!'
          }
        ]
      });

      expect(requestNotificationsV1(token, 1)).toStrictEqual(OK);
      expect(requestNotificationsV1(token)).toStrictEqual({
        notifications: [
          {
            channelId,
            dmId: -1,
            notificationMessage: 'johnsmith tagged you in First: hi@johnsmith0 hello!'
          }
        ]
      });
    });
  });
});
