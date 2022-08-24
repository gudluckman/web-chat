import request from 'sync-request';
import { OK, SERVER_URL, AUTH_ERROR, INPUT_ERROR } from '../config/server.config';
import { requestAuthRegisterV2 } from './auth.help';
import { requestSearchV1 } from "./search.help";
import { requestChannelsCreateV2 } from "./channels.help";
import { requestMessageSendV1, requestMessageEditV1, requestMessageRemoveV1, requestMessageSendDmV1 } from './message.help';
import { requestDmCreateV1 } from './dm.help';

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('search/v1 tests', () => {
  describe('Error Testing', () => {
    test('Token is invalid', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      requestChannelsCreateV2(token, 'first', true);

      expect(requestSearchV1(token + 'a', 'think', 1)).toStrictEqual(AUTH_ERROR);
    })

    test('queryStr is less than 0 character', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      requestChannelsCreateV2(token, 'first', true);

      expect(requestSearchV1(token, '', 1)).toStrictEqual(INPUT_ERROR);
    })

    test('queryStr over than 1000 characters', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      requestChannelsCreateV2(token, 'first', true);

      expect(requestSearchV1(token,'onethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexampleonethousandcharactersexample', 1)).toStrictEqual(INPUT_ERROR);
    })
  })

  describe('Success cases', () => {
    test('Returns edited message from channel', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const { messageId } = requestMessageSendV1(token, channelId, 'hi i thought this test was failling');
      
      expect(requestSearchV1(token, 'hi', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, 'hi')).toStrictEqual({ messages: [
          {
            messageId: messageId,
            uId: authUserId,
            message: 'hi i thought this test was failling',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          }
      ]});
  
      expect(requestMessageEditV1(token, messageId, 'hello world', 1)).toStrictEqual(OK);
    });

    test('Returns edited message from dm', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const { dmId } = requestDmCreateV1(token, [authUser.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hi i thought this test was failling');
      
      expect(requestSearchV1(token, 'hi', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, 'hi')).toStrictEqual({ messages: [
          {
            messageId: messageId,
            uId: authUserId,
            message: 'hi i thought this test was failling',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          }
      ]});
    });

    test('Returns empty array of message because message is removed', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const { dmId } = requestDmCreateV1(token, [authUser.authUserId]);
      const { messageId } = requestMessageSendDmV1(token, dmId, 'hi i thought this test was failling');
      
      requestMessageRemoveV1(token, messageId);
      expect(requestSearchV1(token, 'hi', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, 'hi')).toStrictEqual({ messages: []});
    });

    test('Search message that has been edited multiple times', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
      const messageId2 = requestMessageSendV1(token, channelId, 'hello world2');
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard')).toStrictEqual({});
      expect(requestMessageEditV1(token, messageId2.messageId, 'i hate covid')).toStrictEqual({});
      
      expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, '2521', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, '2521')).toStrictEqual({
        messages: [
          {
            messageId: messageId1.messageId,
            uId: authUserId,
            message: '2521 is hard',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          }
        ]
      });
    });

    test('Searches multiple message in different channel', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'my name is Jose Mourinho');
      const messageId2 = requestMessageSendV1(token, channelId, '2521 is hard');
    
      expect(requestMessageEditV1(token, messageId2.messageId, 'A day may come when i start my assignments. But it is not this day', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, 'my', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, 'my')).toStrictEqual({
        messages: [
          {
            messageId: messageId1.messageId,
            uId: authUserId,
            message: 'my name is Jose Mourinho',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          },
          {
            messageId: messageId2.messageId,
            uId: authUserId,
            message: 'A day may come when i start my assignments. But it is not this day',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          }
        ]
      });
    });

    test('Searches for substring within messages + message react', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
      const messageId1 = requestMessageSendV1(token, channelId, 'I was thinking of that');
      const messageId2 = requestMessageSendV1(token, channelId, 'this is too thin');
      const messageId3 = requestMessageSendV1(token, channelId, 'What do you think of this?');
    
      expect(requestSearchV1(token, 'thin', 1)).toStrictEqual(OK);
      expect(requestSearchV1(token, 'thin')).toStrictEqual({
        messages: [
          {
            messageId: messageId1.messageId,
            uId: authUserId,
            message: 'I was thinking of that',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          },
          {
            messageId: messageId2.messageId,
            uId: authUserId,
            message: 'this is too thin',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          },
          {
            messageId: messageId3.messageId,
            uId: authUserId,
            message: 'What do you think of this?',
            timeSent: expect.any(Number),
            reacts: [
              {
                reactId: 1,
                uIds: [],
                isThisUserReacted: false
              }
            ],
            isPinned: false
          }
        ]
      });
    });
  });

  test('Search is showing multiple exact matches message', () => {
    const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
    const { channelId } = requestChannelsCreateV2(token, 'channel1', true);
    const channel = requestChannelsCreateV2(token, 'channel2', true);
    const messageId1 = requestMessageSendV1(token, channelId, 'hello world1');
    const messageId2 = requestMessageSendV1(token, channel.channelId, 'hello world2');
    expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard')).toStrictEqual({});
    
    for (let i = 0; i < 19; i++) {
      requestMessageEditV1(token, messageId2.messageId, 'i hate covid');
    }
    
    expect(requestMessageEditV1(token, messageId1.messageId, '2521 is hard', 1)).toStrictEqual(OK);
    expect(requestSearchV1(token, 'covid', 1)).toStrictEqual(OK);
    expect(requestSearchV1(token, 'covid')).toStrictEqual({
      messages: [
        {
          messageId: messageId2.messageId,
          uId: authUserId,
          message: 'i hate covid',
          timeSent: expect.any(Number),
          reacts: [
            {
              reactId: 1,
              uIds: [],
              isThisUserReacted: false
            }
          ],
          isPinned: false
        }
      ]
    });
  });
});
