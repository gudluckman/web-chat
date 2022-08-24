import request from "sync-request";
import { requestAuthRegisterV2 } from "./auth.help";
import { requestChannelInviteV2, requestChannelMessagesV2, requestChannelJoinV2 } from "./channel.help";
import { requestChannelsCreateV2 } from "./channels.help";
import { loremIpsum } from "lorem-ipsum";
import { message, getData, clearData } from '../dataStore';
import { requestMessageShareV1, requestMessageUnpinV1, requestMessagePinV1, requestMessageUnreactV1, requestMessageReactV1, requestMessageSendV1, requestMessageEditV1, requestMessageRemoveV1, requestMessageSendDmV1, requestMessageSendLaterV1, requestMessageSendLaterDmV1 } from './message.help';
import { requestDmCreateV1, requestDmMessagesV1 } from './dm.help';
import { OK, SERVER_URL, AUTH_ERROR, INPUT_ERROR } from "../config/server.config";

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('message/send/v1 tests', () => {
  describe('Error testing', () => {
    test('Invalid channelId, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      expect(requestMessageSendV1(token, channelId + 1, 'This should be error', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid token, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      expect(requestMessageSendV1(token + 'ohoh', channelId + 1, 'This should be error', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Message length is less than 1 character, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

     
      expect(requestMessageSendV1(token, channelId, '', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Message length is more than 1000 characters, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      expect(requestMessageSendV1(token, channelId, 'LLorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. N', 1))
      .toStrictEqual(INPUT_ERROR);
    });

    test('channelId is valid, but the user is not in the channel, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user = requestAuthRegisterV2('johnsmith2@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

  
      expect(requestMessageSendV1(user.token, channelId, 'Hello', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('Returns messageId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      expect(requestMessageSendV1(token, channelId, 'hello world')).toStrictEqual({ messageId: expect.any(Number) });
      expect(requestMessageSendV1(token, channelId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of messageId in the same channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channelId, 'hello world2');

      expect(messageId1).not.toStrictEqual(messageId2);
      expect(requestMessageSendV1(token, channelId, 'hello world1', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of messageId in a different channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel = requestChannelsCreateV2(token, 'channel2', true);

      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel.channelId, 'hello world2');
      
      expect(messageId1).not.toStrictEqual(messageId2);
      expect(requestMessageSendV1(token, channelId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Message gets updated in channel/messages/v2', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'hello World1');
      const { messages } = requestChannelMessagesV2(token, channelId, 0);

      expect(messages).toStrictEqual([
        {
          messageId,
          uId: authUserId,
          message: 'hello World1',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageSendV1(token, channelId, 'hello world', 1)).toStrictEqual(OK);
    });
  });
});

describe('message/edit/v1 tests - channel', () => {
  describe('Error testing', () => {
    test('Invalid TOKEN, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
     
      expect(requestMessageEditV1(token + 'a', messageId, 'This should be error', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid messageId, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
 
      expect(requestMessageEditV1(token, messageId + 1, 'This should be error', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Edited message length is more than 1000 characters, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const dummy = loremIpsum({ count: 1002, units: 'words' });
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
   
      expect(requestMessageEditV1(token, messageId, dummy, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User of the token does not have either channel permission nor global owner permission, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');

      expect(requestMessageEditV1(user2.token, messageId, 'just to see how it goes', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Channel user who does not have owner permission trying to edit the message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      requestChannelJoinV2(user2.token, channelId);
      const message2 = requestMessageSendV1(user2.token, channelId, 'this will not work');
   
      expect(requestMessageEditV1(user2.token, message2.messageId, 'just to see how it goes', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('user who has channel owner permission trying to edit other user message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      requestChannelJoinV2(user2.token, channelId);
      const message2 = requestMessageSendV1(user2.token, channelId, 'this will not work');
    
      expect(requestMessageEditV1(token, message2.messageId, 'just to see how it goes', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('Returns edited message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
      expect(requestMessageEditV1(token, messageId, 'hello world')).toStrictEqual({});
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: messageId,
          uId: expect.any(Number),
          message: 'hello world',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('channel owner(non-global owner) editing message', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { token } = requestAuthRegisterV2('z1234567@gmail.com', 'qwerty123', 'allen', 'lockyer');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
      expect(requestMessageEditV1(token, messageId, 'hello world')).toStrictEqual({});
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: messageId,
          uId: expect.any(Number),
          message: 'hello world',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of edited messageId in the same channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channelId, 'hello world2');
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages).toEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of edited messageId in a different channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel = requestChannelsCreateV2(token, 'channel2', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel.channelId, 'hello world2');
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const messages2 = requestChannelMessagesV2(token, channel.channelId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: '2521 is hard',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(messages2.messages).toStrictEqual([
        {
          messageId: messageId2.messageId,
          uId: expect.any(Number),
          message: 'i hate covid',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard', 1)).toStrictEqual(OK);
    });

    test('Empty new message - delete the message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      expect(requestMessageEditV1(token, messageId1.messageId, '', 1)).toStrictEqual(OK);
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      expect(messages1.messages).toStrictEqual([]);
    });

    test('Multiple users and messages in different channels and multiple editings', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(token, 'channel2', true);
      requestChannelJoinV2(user2.token, channel2.channelId);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel2.channelId, 'hello world2');
      requestMessageSendV1(user2.token, channel2.channelId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});

      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const { messages } = requestChannelMessagesV2(token, channel2.channelId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid', 1)).toStrictEqual(OK);
    });
  });
});

describe('message/edit/v1 tests - dm', () => {
  describe('Error testing', () => {
    test('Invalid TOKEN, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
    
      expect(requestMessageEditV1(token + 'a', messageId, 'This should be error', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid messageId, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
      expect(requestMessageEditV1(token, messageId + 1, 'This should be error', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Edited message length is more than 1000 characters, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const dummy = loremIpsum({ count: 1002, units: 'words' });
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
     
      expect(requestMessageEditV1(token, messageId, dummy, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User of the token does not have either channel permission nor global owner permission, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const user3 = requestAuthRegisterV2('z5555558@gmail.com', 'password1234!', 'sony', 'ning');
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');

      expect(requestMessageEditV1(user2.token, messageId, 'just to see how it goes', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Channel user who does not have owner permission trying to edit the message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const message2 = requestMessageSendDmV1(user2.token, dmId, 'this will not work');
   
      expect(requestMessageEditV1(user2.token, message2.messageId, 'just to see how it goes', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('user who has channel owner permission trying to edit other user message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const message2 = requestMessageSendDmV1(user2.token, dmId, 'this will not work');
     
      expect(requestMessageEditV1(token, message2.messageId, 'just to see how it goes', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('Returns edited message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
      expect(requestMessageEditV1(token, messageId, 'hello world')).toStrictEqual({});
      const { messages } = requestDmMessagesV1(token, dmId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: messageId,
          uId: expect.any(Number),
          message: 'hello world',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('dm owner(non-global owner) editing message', () => {
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const { messageId } = requestMessageSendDmV1(user2.token, dmId, 'just saying hi');
      expect(requestMessageEditV1(user2.token, messageId, 'hello world')).toStrictEqual({});
      const { messages } = requestDmMessagesV1(user2.token, dmId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: messageId,
          uId: expect.any(Number),
          message: 'hello world',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(user2.token, messageId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of edited messageId in the same dm', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dmId, 'hello world2');
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      const { messages } = requestDmMessagesV1(token, dmId, 0);

      expect(messages.sort((a: message, b: message) => a.timeSent - b.timeSent)).toEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of edited messageId in a different dm', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const user3 = requestAuthRegisterV2('z9999999@gmail.com', 'password1234!', 'phillip', 'King');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const dm2 = requestDmCreateV1(user2.token, [user3.authUserId])
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(user2.token, dm2.dmId, 'hello world2');
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard')).toStrictEqual({});
      expect(requestMessageEditV1(user2.token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      const messages1 = requestDmMessagesV1(token, dmId, 0);
      const messages2 = requestDmMessagesV1(user2.token, dm2.dmId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: '2521 is hard',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(messages2.messages).toStrictEqual([
        {
          messageId: messageId2.messageId,
          uId: expect.any(Number),
          message: 'i hate covid',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard', 1)).toStrictEqual(OK);
    });

    test('Empty new message - delete the message', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      expect(requestMessageEditV1(token, messageId1.messageId, '', 1)).toStrictEqual(OK);
      const messages1 = requestDmMessagesV1(token, dmId, 0);
      expect(messages1.messages).toStrictEqual([]);
    });

    test('Multiple users and messages in different dm and multiple editings', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const user3 = requestAuthRegisterV2('gogo1234@gmail.com', 'passffrd', 'josh', 'Smith');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dm2.dmId, 'hello world2');
      requestMessageSendDmV1(user3.token, dm2.dmId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});

      const messages1 = requestDmMessagesV1(token, dmId, 0);
      const { messages } = requestDmMessagesV1(token, dm2.dmId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);

      expect(messages.sort((a: message, b: message) => a.timeSent - b.timeSent)).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid', 1)).toStrictEqual(OK);
    });
  });
});

describe('message/remove/v1 tests - channel', () => {
  describe('Error testing', () => {
    test('Invalid TOKEN, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');

      expect(requestMessageRemoveV1(token + 'a', messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid messageId, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
   
      expect(requestMessageRemoveV1(token, messageId + 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User of the token does not have either channel permission nor global owner permission, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
      
      expect(requestMessageRemoveV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Channel user who does not have owner permission trying to remove the message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      requestChannelJoinV2(user2.token, channelId);
      const message2 = requestMessageSendV1(user2.token, channelId, 'this will not work');
    
      expect(requestMessageRemoveV1(user2.token, message2.messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('user who has channel owner permission trying to remove other user message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      requestChannelJoinV2(user2.token, channelId);
      const message2 = requestMessageSendV1(user2.token, channelId, 'this will not work');

      expect(requestMessageRemoveV1(token, message2.messageId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('Removing a message from channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
      expect(requestMessageRemoveV1(token, messageId, 1)).toStrictEqual(OK);
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages).toStrictEqual([]);
    });

    test('channel owner(non-global owner) removing message', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { token } = requestAuthRegisterV2('z1234567@gmail.com', 'qwerty123', 'allen', 'lockyer');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'just saying hi');
      expect(requestMessageRemoveV1(token, messageId, 1)).toStrictEqual(OK);
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages).toStrictEqual([]);
    });

    test('Removing a message among multiple messages in the same channel', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channelId, 'hello world2');
      expect(requestMessageRemoveV1(token, messageId1.messageId, 1)).toStrictEqual(OK);
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages).toEqual([
        {
          messageId: messageId2.messageId,
          uId: authUserId,
          message: 'hello world2',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
    });

    test('Removing all messages in the same channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channelId, 'hello world2');
      expect(requestMessageRemoveV1(token, messageId1.messageId)).toStrictEqual({});
      expect(requestMessageRemoveV1(token, messageId2.messageId, 1)).toStrictEqual(OK);
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages).toEqual([]);
    });

    test('removing messages in a different channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel = requestChannelsCreateV2(token, 'channel2', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel.channelId, 'hello world2');
      expect(requestMessageRemoveV1(token, messageId1.messageId)).toStrictEqual({});
      expect(requestMessageRemoveV1(token, messageId2.messageId, 1)).toStrictEqual(OK);
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const messages2 = requestChannelMessagesV2(token, channel.channelId, 0);
      expect(messages1.messages).toStrictEqual([]);
      expect(messages2.messages).toStrictEqual([]);
    });

    test('Multiple users/messages in different channels and multiple removing', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(token, 'channel2', true);
      requestChannelJoinV2(user2.token, channel2.channelId);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel2.channelId, 'hello world2');
      const messageId3 = requestMessageSendV1(user2.token, channel2.channelId, 'hello world3');
      expect(requestMessageRemoveV1(token, messageId2.messageId)).toStrictEqual({});
      expect(requestMessageRemoveV1(token, messageId1.messageId, 1)).toStrictEqual(OK);
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const { messages } = requestChannelMessagesV2(token, channel2.channelId, 0);
      expect(messages1.messages).toStrictEqual([]);
      expect(messages).toStrictEqual([
        {
          messageId: messageId3.messageId,
          uId: expect.any(Number),
          message: 'hello world3',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/remove/v1 tests - dm', () => {
  describe('Error testing', () => {
    test('Invalid TOKEN, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
    
      expect(requestMessageRemoveV1(token + 'a', messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid messageId, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
  
      expect(requestMessageRemoveV1(token, messageId + 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User of the token does not have either dm owner permission or global owner permission, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
     
      expect(requestMessageRemoveV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('dm user who does not have owner permission trying to remove the message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const message2 = requestMessageSendDmV1(user2.token, dmId, 'this will not work');

      expect(requestMessageRemoveV1(user2.token, message2.messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('user who has owner permission trying to remove other user message, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const message2 = requestMessageSendDmV1(user2.token, dmId, 'this will not work');

      expect(requestMessageRemoveV1(token, message2.messageId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('Removing a message from Dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'just saying hi');
      expect(requestMessageRemoveV1(token, messageId, 1)).toStrictEqual(OK);
      const { messages } = requestDmMessagesV1(token, dmId, 0);
      expect(messages).toStrictEqual([]);
    });

    test('DM owner(non-global owner) removing message', () => {
      const user1 = requestAuthRegisterV2('z1234567@gmail.com', 'qwerty123', 'allen', 'lockyer');
      const user2 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(user2.token, [user1.authUserId]);
      const { messageId } = requestMessageSendDmV1(user2.token, dmId, 'just saying hi');
      expect(requestMessageRemoveV1(user2.token, messageId, 1)).toStrictEqual(OK);
      const { messages } = requestDmMessagesV1(user2.token, dmId, 0);
      expect(messages).toStrictEqual([]);
    });

    test('Removing a message among multiple messages in the same dm', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dmId, 'hello world2');
      expect(requestMessageRemoveV1(token, messageId1.messageId, 1)).toStrictEqual(OK);
      const { messages } = requestDmMessagesV1(token, dmId, 0);
      expect(messages).toEqual([
        {
          messageId: messageId2.messageId,
          uId: authUserId,
          message: 'hello world2',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
    });

    test('Removing all messages in the same dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('z12345678@gmail.com', 'password1234!', 'tony', 'King');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dmId, 'hello world2');
      expect(requestMessageRemoveV1(token, messageId1.messageId)).toStrictEqual({});
      expect(requestMessageRemoveV1(token, messageId2.messageId, 1)).toStrictEqual(OK);
      const { messages } = requestDmMessagesV1(token, dmId, 0);
      expect(messages).toEqual([]);
    });

    test('multiple users removing messages in different dm', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tony123@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('z987654@gmail.com', 'password', 'tony', 'Smith');
      const user4 = requestAuthRegisterV2('a123456@gmail.com', 'password', 'kevin', 'Smith');
      const { dmId } = requestDmCreateV1(user1.token, [user2.authUserId, user3.authUserId]);
      const dm2 = requestDmCreateV1(user2.token, [user1.authUserId, user3.authUserId, user4.authUserId]);
      const messageId1 = requestMessageSendDmV1(user1.token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(user2.token, dm2.dmId, 'hello world2');
      const messageId3 = requestMessageSendDmV1(user3.token, dmId, 'hello world3');
      const messageId4 = requestMessageSendDmV1(user4.token, dm2.dmId, 'hello world4');
      expect(requestMessageRemoveV1(user1.token, messageId1.messageId)).toStrictEqual({});
      expect(requestMessageRemoveV1(user2.token, messageId2.messageId, 1)).toStrictEqual(OK);
      const { messages } = requestDmMessagesV1(user1.token, dmId, 0);
      const messages2 = requestDmMessagesV1(user2.token, dm2.dmId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: messageId3.messageId,
          uId: user3.authUserId,
          message: 'hello world3',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(messages2.messages).toStrictEqual([
        {
          messageId: messageId4.messageId,
          uId: user4.authUserId,
          message: 'hello world4',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/senddm/v1 tests', () => {
  describe('Error testing', () => {
    test('Invalid token, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
   
      expect(requestMessageSendDmV1(token + 'ohoh', dmId, 'This should be error', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid dmId, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
   
      expect(requestMessageSendDmV1(token, dmId + 1, 'This should be error', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Message length is less than 1 character, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
  
      expect(requestMessageSendDmV1(token, dmId, '', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Message length is more than 1000 characters, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

   
      expect(requestMessageSendDmV1(token, dmId, 'LLorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. N', 1))
      .toStrictEqual(INPUT_ERROR);
    });

    test('dmId is valid, but the user is not in the dm, expect return error', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('tonmyui123@gmail.com', 'password', 'tony', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendDmV1(user3.token, dmId, 'Hello', 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  
  describe('Success cases', () => {
    test('Returns messageId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendDmV1(token, dmId, 'hello world')).toStrictEqual({ messageId: expect.any(Number) });
      expect(requestMessageSendDmV1(token, dmId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of messageId in the same dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dmId, 'hello world2');

      expect(messageId1).not.toStrictEqual(messageId2);
      expect(requestMessageSendDmV1(token, dmId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Uniqueness of messageId in a different dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('tonmyui123@gmail.com', 'password', 'tony', 'Smith');
      const dm1 = requestDmCreateV1(token, [user3.authUserId]);
      const dm2 = requestDmCreateV1(user2.token, [user3.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dm1.dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(user2.token, dm2.dmId, 'hello world2');
  
      expect(messageId1).not.toStrictEqual(messageId2);
      expect(requestMessageSendDmV1(token, dm1.dmId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Message gets updated in dm/messages/v1', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world1');
      const { messages } = requestDmMessagesV1(token, dmId, 0);
      
      expect(messages).toStrictEqual([
        {
          messageId,
          uId: authUserId,
          message: 'hello world1',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(requestMessageSendDmV1(token, dmId, 'hello world', 1)).toStrictEqual(OK);
    });
  });
});

describe('message/sendlater/v1 tests', () => {
  describe('error return type', () => {
    test('invalid token', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessageSendLaterV1(token + 'ab', channelId, 'Hello!', (Date.now() / 1000) + 86400, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('invalid channelId', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessageSendLaterV1(token, channelId - 999, 'Hello!', (Date.now() / 1000) + 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('message length less than 1 character', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessageSendLaterV1(token, channelId, '', (Date.now() / 1000) + 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('message length greater than 1000 characters', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessageSendLaterV1(token, channelId, 'LLorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. N', 
      (Date.now() / 1000) + 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('time sent is in the past', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessageSendLaterV1(token, channelId, 'Hello!', (Date.now() / 1000) - 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('authorised user is not member of channel', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      expect(requestMessageSendLaterV1(user2.token, channelId, 'Hello!', (Date.now() / 1000) + 86400, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  describe('correct return type', () => {
    test('user sets message to be sent in one second', async () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);

      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessageSendLaterV1(token, channelId, 'Hello!', (Date.now() / 1000) + 1)).toStrictEqual({ messageId: expect.any(Number) });

      await new Promise((r) => setTimeout(r, 1000));
      const { messages } = requestChannelMessagesV2(token, channelId, 0);
      expect(messages[0].message).toStrictEqual('Hello!');
    });
  });
});
describe('message/react/v1 - channel', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageReactV1('gdgfdgdf', messageId, 1, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the channel', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageReactV1(user2.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid messageId', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageReactV1(user1.token, 2, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid reactId', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageReactV1(user1.token, messageId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ReactId already in the message', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageReactV1(user1.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageReactV1(user1.token, messageId, 1, 1)).toStrictEqual(OK);
    });

    test('Return correct type 2 ', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageReactV1(user1.token, messageId, 1, 1)).toStrictEqual(OK);
    });

    test('Multiple users and messages in different channels and multiple editings', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(token, 'channel2', true);
      requestChannelJoinV2(user2.token, channel2.channelId);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel2.channelId, 'hello world2');
      const messageId3 = requestMessageSendV1(user2.token, channel2.channelId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId3.messageId, 1, 1)).toStrictEqual(OK);
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const { messages } = requestChannelMessagesV2(token, channel2.channelId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/react/v1 - dm', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageReactV1(token + 'fsdfds', messageId, 1, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the DM', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('pppsd1234@gmail.com', 'password1234', 'phillip', 'bran');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageReactV1(user3.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid messageId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageReactV1(token, messageId + 1, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid reactId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageReactV1(token, messageId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ReactId already in the message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      requestMessageReactV1(token, messageId, 1);
      expect(requestMessageReactV1(token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageReactV1(token, messageId, 1, 1)).toStrictEqual(OK);
    });

    
    test('Multiple users and messages in different dm and multiple editings', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const user3 = requestAuthRegisterV2('gogo1234@gmail.com', 'passffrd', 'josh', 'Smith');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dm2.dmId, 'hello world2');
      const messageId3 = requestMessageSendDmV1(user3.token, dm2.dmId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId1.messageId, 1, 1)).toStrictEqual(OK);
      const messages1 = requestDmMessagesV1(token, dmId, 0);
      const { messages } = requestDmMessagesV1(token, dm2.dmId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
    });
  });
});


describe('message/unreact/v1 - channel', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageUnreactV1(user1.token + '23d', messageId, 1, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the channel', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageUnreactV1(user2.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid messageId', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageUnreactV1(user1.token, messageId + 1, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid reactId', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageUnreactV1(user1.token, messageId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ReactId from user not in the message', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageUnreactV1(user1.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ReactId from user not in the message - 2', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('yello123@gmail.com', 'password', 'yello', 'martin');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestChannelJoinV2(user2.token, channelId);
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageUnreactV1(user2.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ReactId from user not in the message - 3', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('yello123@gmail.com', 'password', 'yello', 'martin');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageUnreactV1(user2.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestMessageReactV1(user1.token, messageId, 1);
      expect(requestMessageUnreactV1(user1.token, messageId, 1, 1)).toStrictEqual(OK);
    });

    test('Multiple users and messages in different channels and multiple editings', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(token, 'channel2', true);
      requestChannelJoinV2(user2.token, channel2.channelId);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel2.channelId, 'hello world2');
      const messageId3 = requestMessageSendV1(user2.token, channel2.channelId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId3.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessageUnreactV1(token, messageId1.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessageUnreactV1(user2.token, messageId3.messageId, 1, 1)).toStrictEqual(OK);
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const { messages } = requestChannelMessagesV2(token, channel2.channelId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/sendlaterdm/v1 tests', () => {
  describe('error return type', () => {
    test('invalid token', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendLaterDmV1(token + 'ab', dmId, 'Hello!', (Date.now() / 1000) + 86400, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('invalid dmId', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendLaterDmV1(token, dmId - 999, 'Hello!', (Date.now() / 1000) + 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('message length less than 1 character', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendLaterDmV1(token, dmId, '', (Date.now() / 1000) + 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('message length greater than 1000 characters', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendLaterDmV1(token, dmId, 'LLorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. N', 
      (Date.now() / 1000) + 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('time sent is in the past', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendLaterDmV1(token, dmId, 'Hello!', (Date.now() / 1000) - 86400, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('authorised user is not member of dm', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const user3 = requestAuthRegisterV2('z9999999@gmail.com', 'password1234!', 'phillip', 'King');

      expect(requestMessageSendLaterDmV1(user3.token, dmId, 'Hello!', (Date.now() / 1000) + 86400, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  describe('correct return type', () => {
    test('user sets message to be sent in one second', async () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);

      expect(requestMessageSendLaterDmV1(token, dmId, 'Hello!', (Date.now() / 1000) + 1)).toStrictEqual({ messageId: expect.any(Number) });

      await new Promise((r) => setTimeout(r, 1000));
      const { messages } = requestDmMessagesV1(token, dmId, 0);
      expect(messages[0].message).toStrictEqual('Hello!');
    });
  });
});

describe('message/unreact/v1 - dm', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      requestMessageReactV1(token, messageId, 1);
      expect(requestMessageUnreactV1(token + 'fsdfds', messageId, 1, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the DM', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('pppsd1234@gmail.com', 'password1234', 'phillip', 'bran');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      requestMessageReactV1(token, messageId, 1);
      expect(requestMessageUnreactV1(user3.token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid messageId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      requestMessageReactV1(token, messageId, 1);
      expect(requestMessageUnreactV1(token, messageId + 1, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid reactId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      requestMessageReactV1(token, messageId, 1);
      expect(requestMessageUnreactV1(token, messageId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ReactId from user not in the message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageUnreactV1(token, messageId, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ReactId from user not in the message - 3', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      requestMessageReactV1(user2.token, messageId, 1);
      expect(requestMessageUnreactV1(user2.token, messageId, 3, 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      requestMessageReactV1(token, messageId, 1);
      expect(requestMessageUnreactV1(token, messageId, 1, 1)).toStrictEqual(OK);
    });

    
    test('Multiple users and messages in different dm and multiple editings', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const user3 = requestAuthRegisterV2('gogo1234@gmail.com', 'passffrd', 'josh', 'Smith');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dm2.dmId, 'hello world2');
      const messageId3 = requestMessageSendDmV1(user3.token, dm2.dmId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId1.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessageUnreactV1(token, messageId1.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessageUnreactV1(token, messageId3.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      const messages1 = requestDmMessagesV1(token, dmId, 0);
      const { messages } = requestDmMessagesV1(token, dm2.dmId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [2], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/pin/v1 - channel', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1('gdgfdgdf', messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the channel', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1(user2.token, messageId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Non-owner user trying to pin the message', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessagePinV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid messageId', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('message already pinned', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, messageId));
      expect(requestMessagePinV1(user1.token, messageId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User does not have the owner permission', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessagePinV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, messageId, 1)).toStrictEqual(OK);
    });

    test('Return correct type', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const message2 = requestMessageSendV1(user1.token, channel2.channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(user2.token, message2.messageId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Multiple users and messages in different channels and multiple editings', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(token, 'channel2', true);
      requestChannelJoinV2(user2.token, channel2.channelId);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel2.channelId, 'hello world2');
      const messageId3 = requestMessageSendV1(user2.token, channel2.channelId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId3.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId1.messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId2.messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId3.messageId, 1)).toStrictEqual(OK);
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const { messages } = requestChannelMessagesV2(token, channel2.channelId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: true
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: true
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: true
        }
      ]);
    });
  });
});

describe('message/pin/v1 - dm', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(token + 'fsdfds', messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the DM', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('pppsd1234@gmail.com', 'password1234', 'phillip', 'bran');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(user3.token, messageId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid messageId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(token, messageId + 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Non-owner trying to pin message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(token, messageId, 1)).toStrictEqual(OK);
    });

    test('Multiple users and messages in different dm and multiple editings', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const user3 = requestAuthRegisterV2('gogo1234@gmail.com', 'passffrd', 'josh', 'Smith');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dm2.dmId, 'hello world2');
      const messageId3 = requestMessageSendDmV1(user3.token, dm2.dmId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId1.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(user2.token, messageId1.messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId2.messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId3.messageId, 1)).toStrictEqual(OK);
      const messages1 = requestDmMessagesV1(token, dmId, 0);
      const { messages } = requestDmMessagesV1(token, dm2.dmId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: true
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: true
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: true
        }
      ]);
    });
  });
});

describe('message/unpin/v1 - channel', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageUnpinV1('gdgfdgdf', messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the channel', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(user2.token, messageId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Non-owner user trying to unpin the message', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessagePinV1(user1.token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid messageId', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageUnpinV1(user1.token, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('message already unpinned', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, messageId));
      expect(requestMessageUnpinV1(user1.token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(user1.token, messageId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User does not have the owner permission', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      requestChannelJoinV2(user2.token, channelId);
      expect(requestMessagePinV1(user1.token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, messageId)).toStrictEqual({});
      expect(requestMessageUnpinV1(user1.token, messageId)).toStrictEqual({});
    });

    test('Return correct type', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const message2 = requestMessageSendV1(user1.token, channel2.channelId, 'hello world');
      expect(requestMessagePinV1(user1.token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(user2.token, message2.messageId, 1)).toStrictEqual(INPUT_ERROR);
      expect(requestMessageUnpinV1(user1.token, messageId, 1)).toStrictEqual(OK);
    });

    test('Multiple users and messages in different channels and multiple editings', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(token, 'channel2', true);
      requestChannelJoinV2(user2.token, channel2.channelId);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channel2.channelId, 'hello world2');
      const messageId3 = requestMessageSendV1(user2.token, channel2.channelId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId3.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessageReactV1(user2.token, messageId2.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId1.messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId3.messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(token, messageId1.messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(token, messageId3.messageId, 1)).toStrictEqual(OK);
      const messages1 = requestChannelMessagesV2(token, channelId, 0);
      const { messages } = requestChannelMessagesV2(token, channel2.channelId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/unpin/v1 - dm', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageUnpinV1(token + 'fsdfds', messageId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('User not in the DM', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('pppsd1234@gmail.com', 'password1234', 'phillip', 'bran');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(user3.token, messageId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid messageId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(token, messageId + 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Non-owner trying to unpin message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(user2.token, messageId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessagePinV1(token, messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(token, messageId, 1)).toStrictEqual(OK);
    });

    test('Multiple users and messages in different dm and multiple editings', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const user3 = requestAuthRegisterV2('gogo1234@gmail.com', 'passffrd', 'josh', 'Smith');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      const messageId2 = requestMessageSendDmV1(token, dm2.dmId, 'hello world2');
      const messageId3 = requestMessageSendDmV1(user3.token, dm2.dmId, 'hello world3');

      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId1.messageId, 'go qlder')).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId1.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId2.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(token, messageId3.messageId, 1)).toStrictEqual({});
      expect(requestMessageReactV1(user2.token, messageId1.messageId, 1, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(user2.token, messageId1.messageId, 1)).toStrictEqual(OK);
      expect(requestMessagePinV1(token, messageId3.messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(token, messageId1.messageId, 1)).toStrictEqual(OK);
      expect(requestMessageUnpinV1(token, messageId3.messageId, 1)).toStrictEqual(OK);
      const messages1 = requestDmMessagesV1(token, dmId, 0);
      const { messages } = requestDmMessagesV1(token, dm2.dmId, 0);
      expect(messages1.messages).toStrictEqual([
        {
          messageId: messageId1.messageId,
          uId: expect.any(Number),
          message: 'go qlder',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1, 2], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [1], isThisUserReacted: true }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/share/v1 - channel', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(user1.token, 'channel2', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1('gdgfdgdf', messageId, '', channel2.channelId, -1, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('both channel and dm -1', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, '', -1, -1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('neither channel or dm are -1', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, '', 1, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ogMessageId not valid', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      requestChannelsCreateV2(user1.token, 'channel2', true);
      requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user1.token, 10, '', 1, -1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('lenth over 1000 characters', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(user1.token, 'channel2', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const dummy = loremIpsum({ count: 1002, units: 'words' });
      expect(requestMessageShareV1(user1.token, messageId, dummy, channel2.channelId, -1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Non-owner user trying to share the message', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const channel2 = requestChannelsCreateV2(user2.token, 'channel2', true);
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, '', channel2.channelId, -1, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Non-member user trying to share the message', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const user3 = requestAuthRegisterV2('yumi123@gmail.com', 'password', 'yumi', 'hase');
      const channel2 = requestChannelsCreateV2(user2.token, 'channel2', true);
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user3.token, messageId, '', channel2.channelId, -1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Return correct type - from channel to dm error', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const user3 = requestAuthRegisterV2('nonog2@gmail.com', 'password', 'tddy', 'moio');
      const channel2 = requestChannelsCreateV2(user2.token, 'channel2', true);
      requestChannelJoinV2(user1.token, channel2.channelId);
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const dm2 = requestDmCreateV1(user1.token, [user2.authUserId]);
      expect(requestMessageShareV1(user3.token, messageId, 'this is cool', -1, dm2.dmId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Return correct type - from channel to dm error2', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const user3 = requestAuthRegisterV2('nonog2@gmail.com', 'password', 'tddy', 'moio');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      requestChannelJoinV2(user3.token, channelId);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const dm2 = requestDmCreateV1(user1.token, [user2.authUserId]);
      expect(requestMessageShareV1(user3.token, messageId, 'this is cool', -1, dm2.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type - No new msg', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const channel2 = requestChannelsCreateV2(user2.token, 'channel2', true);
      requestChannelJoinV2(user1.token, channel2.channelId);
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, '', channel2.channelId, -1, 1)).toStrictEqual(OK);
    });

    test('Return correct type - new msg', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const channel2 = requestChannelsCreateV2(user2.token, 'channel2', true);
      requestChannelJoinV2(user1.token, channel2.channelId);
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, 'this is cool', channel2.channelId, -1, 1)).toStrictEqual(OK);
    });

    test('Return correct type - from channel to dm error', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const user3 = requestAuthRegisterV2('nonog2@gmail.com', 'password', 'tddy', 'moio');
      const channel2 = requestChannelsCreateV2(user2.token, 'channel2', true);
      requestChannelJoinV2(user1.token, channel2.channelId);
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const dm2 = requestDmCreateV1(user1.token, [user2.authUserId]);
      expect(requestMessageShareV1(user3.token, messageId, 'this is cool', -1, dm2.dmId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Return correct type - new msg and check with channelmessage function', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const channel2 = requestChannelsCreateV2(user2.token, 'channel2', true);
      requestChannelJoinV2(user1.token, channel2.channelId);
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, 'this is cool', channel2.channelId, -1, 1)).toStrictEqual(OK);
      const { messages } = requestChannelMessagesV2(user1.token, channel2.channelId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: user1.authUserId,
          message: 'hello world: this is cool',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }]);
    });

    test('Multiple users and messages in different channels and multiple editings', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const channel2 = requestChannelsCreateV2(token, 'channel2', true);
      requestChannelJoinV2(user2.token, channel2.channelId);
      const { messageId } = requestMessageSendV1(token, channelId, 'hello world1');
      requestMessageSendV1(token, channel2.channelId, 'hello world2');
      requestMessageSendV1(user2.token, channel2.channelId, 'hello world3');
      expect(requestMessageShareV1(token, messageId, '', channel2.channelId, -1, 1)).toStrictEqual(OK);
      const { messages } = requestChannelMessagesV2(token, channel2.channelId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
    });
  });
});

describe('message/share/v1 - dm', () => {
  describe('Error testing', () => {
    test('Invalid Token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageShareV1('gdgfdgdf', messageId, '', -1, dm2.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('both channel and dm -1', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageShareV1(token, messageId, '', -1, -1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('neither channel or dm are -1', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageShareV1(token, messageId, '', dmId, dm2.dmId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('ogMessageId not valid', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId]);
      requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageShareV1(token, 10, '', -1, dm2.dmId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('lenth over 1000 characters', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      const dummy = loremIpsum({ count: 1002, units: 'words' });
      expect(requestMessageShareV1(token, messageId, dummy, -1, dm2.dmId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Non-owner user trying to share the message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('zdddddd123@gmail.com', 'password1', 'tony', 'king');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageShareV1(user3.token, messageId, '', -1, dm2.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('Non-member user trying to share the message', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('zdddddd123@gmail.com', 'password1', 'tony', 'king');
      const user4 = requestAuthRegisterV2('yyumi123@gmail.com', 'password12', 'yumi', 'hase');
      const { dmId } = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hello world');
      expect(requestMessageShareV1(user4.token, messageId, '', -1, dm2.dmId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Return correct type - share from dm to channel error', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const user3 = requestAuthRegisterV2('fff124@gmail.com', 'password', 'aflen', 'Smifh');
      const { dmId } = requestDmCreateV1(user1.token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(user1.token, dmId, 'hello world');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      expect(requestMessageShareV1(user3.token, messageId, 'this is cool', channelId, -1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Return correct type - share from dm to channel error2', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(user1.token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(user1.token, dmId, 'hello world');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      expect(requestMessageShareV1(user2.token, messageId, 'this is cool', channelId, -1, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Return correct type - No new msg', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(user1.token, [user2.authUserId]);
      const dm2 = requestDmCreateV1(user1.token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(user1.token, dmId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, '', -1, dm2.dmId, 1)).toStrictEqual(OK);
      const { messages } = requestDmMessagesV1(user1.token, dm2.dmId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: user1.authUserId,
          message: 'hello world',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }]);
    });

    test('Return correct type - new msg - check with dmMessage function', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(user1.token, [user2.authUserId]);
      const dm2 = requestDmCreateV1(user1.token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(user1.token, dmId, 'hello world');
      expect(requestMessageShareV1(user1.token, messageId, 'this is cool', -1, dm2.dmId)).toStrictEqual({ sharedMessageId: expect.any(Number) });
      const { messages } = requestDmMessagesV1(user1.token, dm2.dmId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: user1.authUserId,
          message: 'hello world: this is cool',
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }]);
    });

    test('getData', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      getData();
      const data = getData();
      clearData();
    });

    test('Return correct type - from channel to dm', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const user3 = requestAuthRegisterV2('nonog2@gmail.com', 'password', 'tddy', 'moio');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      requestChannelJoinV2(user3.token, channelId);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const dm2 = requestDmCreateV1(user1.token, [user2.authUserId]);
      expect(requestMessageShareV1(user1.token, messageId, 'this is cool', -1, dm2.dmId, 1)).toStrictEqual(OK);
    });

    test('Return correct type - from channel to dm error2', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('tonyliao@gmail.com', 'password', 'tony', 'liao');
      const user3 = requestAuthRegisterV2('nonog2@gmail.com', 'password', 'tddy', 'moio');
      const user4 = requestAuthRegisterV2('shark123@gmail.com', 'password', 'gura', 'mfio');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      requestChannelJoinV2(user3.token, channelId);
      requestChannelJoinV2(user4.token, channelId);
      expect(requestChannelJoinV2(user3.token, channelId, 1)).toStrictEqual(INPUT_ERROR);
      expect(requestChannelInviteV2(user1.token, channelId, user4.authUserId, 1)).toStrictEqual(AUTH_ERROR);
      const { messageId } = requestMessageSendV1(user1.token, channelId, 'hello world');
      const dm2 = requestDmCreateV1(user1.token, [user2.authUserId]);
      expect(requestMessageShareV1(user3.token, messageId, 'this is cool', -1, dm2.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Return correct type - share from dm to channel ', () => {
      const user1 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('asdfg1234@gmail.com', 'password', 'allen', 'Smith');
      const { dmId } = requestDmCreateV1(user1.token, [user2.authUserId]);
      const { messageId } = requestMessageSendDmV1(user1.token, dmId, 'hello world');
      const { channelId } = requestChannelsCreateV2(user1.token, 'channel1', true);
      expect(requestMessageShareV1(user1.token, messageId, 'this is cool', channelId, -1, 1)).toStrictEqual(OK);
    });

    test('Multiple users and messages in different channels and multiple editings', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('j1234456@gmail.com', 'passffrd', 'damien', 'Smith');
      const user3 = requestAuthRegisterV2('gogo1234@gmail.com', 'passffrd', 'josh', 'Smith');
      const { dmId } = requestDmCreateV1(user2.token, [authUserId]);
      const dm2 = requestDmCreateV1(token, [user2.authUserId, user3.authUserId]);
      const messageId1 = requestMessageSendDmV1(token, dmId, 'hello world1');
      requestMessageSendDmV1(token, dm2.dmId, 'hello world2');
      requestMessageSendDmV1(user3.token, dm2.dmId, 'hello world3');
      expect(requestMessageShareV1(token, messageId1.messageId, 'this is cool', -1, dm2.dmId, 1)).toStrictEqual(OK);
      const { messages } = requestDmMessagesV1(token, dm2.dmId, 0);
      expect(messages).toStrictEqual([
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        },
        {
          messageId: expect.any(Number),
          uId: expect.any(Number),
          message: expect.any(String),
          timeSent: expect.any(Number),
          reacts: [{ reactId: 1, uIds: [], isThisUserReacted: false }],
          isPinned: false
        }
      ]);
    });
  });
});
