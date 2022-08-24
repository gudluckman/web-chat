import request from 'sync-request';
import { OK, SERVER_URL, AUTH_ERROR, INPUT_ERROR } from '../config/server.config';
import { requestAuthRegisterV2 } from './auth.help';
import { requestChannelsCreateV2, requestChannelsListV2, requestChannelsListAllV2 } from "./channels.help";

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('/channels/create/v2 http tests', () => {
  describe('Error testing', () => {
    test('Test for invalid userId', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
  
      expect(requestChannelsCreateV2(token + 'asd', 'CS club', true, 1)).toEqual(AUTH_ERROR);
    });
  
    test('Testing if channel name is less than 1 character', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
  
      expect(requestChannelsCreateV2(token, '', true, 1)).toStrictEqual(INPUT_ERROR);
    });
  
    test('Testing if channel name exceeds 20 characters', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');

      expect(requestChannelsCreateV2(token, 'asdfghjklqwertyuiopzxcvbnm', true, 1)).toStrictEqual(INPUT_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('Testing if channel name between 1 and 20 characters', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
  
      expect(requestChannelsCreateV2(token, 'Math Club', true)).toStrictEqual(
        { channelId: expect.any(Number) }
      );
      expect(requestChannelsCreateV2(token, 'Math Club', true, 1)).toStrictEqual(OK);
    });
  
    test('Testing if channel name has exactly 1 character', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
  
      expect(requestChannelsCreateV2(token, 'Z', true)).toStrictEqual(
        { channelId: expect.any(Number) }
      );
      expect(requestChannelsCreateV2(token, 'Z', true, 1)).toStrictEqual(OK);
    });
  
    test('Testing channel name has exactly 20 characters', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
  
      expect(requestChannelsCreateV2(token, 'asdfghjklqwertyuiopz', true)).toStrictEqual(
        { channelId: expect.any(Number) }
      );
      expect(requestChannelsCreateV2(token, 'asdfghjklqwertyuiopz', true, 1)).toStrictEqual(OK);
    });
  });
});

describe('channels/list/v2 http tests)', () => {
  describe('Error testing', () => {
    test('test 1.1 - Invalid (Non existent ID)', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      requestChannelsCreateV2(token, 'CS club', true);
  
      expect(requestChannelsListV2('31232131', 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('test 1.2 - Invalid (No ID registered) ', () => {
 
      expect(requestChannelsListV2('31232131', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Returning Correct Type', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const { channelId } = requestChannelsCreateV2(token, 'CS club', true);
      const channel = requestChannelsListV2(token);
      expect(channel).toStrictEqual({
        channels: [
          {
            channelId: channelId,
            name: 'CS club',
          },
        ]
      });
      expect(requestChannelsListV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Multiple channels created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const { channelId } = requestChannelsCreateV2(token, 'CS club', true);
      const channelId2 = requestChannelsCreateV2(token, 'sad', true);
      const channel = requestChannelsListV2(token);
      expect(channel).toStrictEqual({
        channels: [
          {
            channelId: channelId,
            name: 'CS club',
          },
          {
            channelId: channelId2.channelId,
            name: 'sad',
          },
        ]
      });
      expect(requestChannelsListV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Private channel created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const { channelId } = requestChannelsCreateV2(token, 'CS club', false);
      const channel = requestChannelsListV2(token);
      expect(channel).toStrictEqual({
        channels: [
          {
            channelId: channelId,
            name: 'CS club',
          },
        ]
      });
      expect(requestChannelsListV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Multiple private channels created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const { channelId } = requestChannelsCreateV2(token, 'CS club', false);
      const channelId2 = requestChannelsCreateV2(token, 'sad', false);
      const channel = requestChannelsListV2(token);
      expect(channel).toStrictEqual({
        channels: [
          {
            channelId: channelId,
            name: 'CS club',
          },
          {
            channelId: channelId2.channelId,
            name: 'sad',
          },
        ]
      });
      expect(requestChannelsListV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Mix of public and private channels created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const { channelId } = requestChannelsCreateV2(token, 'CS club', true);
      const channelId2 = requestChannelsCreateV2(token, 'sad', false);
      const channel = requestChannelsListV2(token);
      expect(channel).toStrictEqual({
        channels: [
          {
            channelId: channelId,
            name: 'CS club',
          },
          {
            channelId: channelId2.channelId,
            name: 'sad',
          },
        ]
      });
      expect(requestChannelsListV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Complex mix of public and private channels created', () => {
      const user1 = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      requestAuthRegisterV2('phillip1234@gmail.com', 'youNeveresa!', 'Phillip', 'Wang');
      const channel = requestChannelsCreateV2(user1.token, 'topgun', false);
      const channel3 = requestChannelsListV2(user1.token);
      expect(channel3).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'topgun',
          },
        ]
      });
      expect(requestChannelsListV2(user1.token, 1)).toStrictEqual(OK);
    });
  
    test('Complex mix of public and private channels created - v2', () => {
      const user1 = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const user2 = requestAuthRegisterV2('phillip1234@gmail.com', 'youNeveresa!', 'Phillip', 'Wang');
      const channel = requestChannelsCreateV2(user1.token, 'topgun', false);
      const channel2 = requestChannelsCreateV2(user1.token, 'cs club', false);
      const channel3 = requestChannelsCreateV2(user2.token, 'math1231', false);
      const channelList = requestChannelsListV2(user1.token);
      const channelList2 = requestChannelsListV2(user2.token);
      expect(channelList).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'topgun',
          },
          {
            channelId: channel2.channelId,
            name: 'cs club',
          },
        ]
      });
      expect(requestChannelsListV2(user1.token, 1)).toStrictEqual(OK);
      expect(channelList2).toStrictEqual({
        channels: [
          {
            channelId: channel3.channelId,
            name: 'math1231',
          },
        ]
      });
      expect(requestChannelsListV2(user2.token, 1)).toStrictEqual(OK);
    });
  });
});

describe('/channel/listall/v2', () => {
  describe('Error testing', () => {
    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      requestChannelsCreateV2(token, 'CS club', true);
  
      expect(requestChannelsListAllV2('500', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Registered but no channel created) ', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const list = requestChannelsListAllV2(token);
      expect(list).toStrictEqual({ channels: [] });
      expect(requestChannelsListAllV2(token, 1)).toStrictEqual(OK);
    });

    test('Returning Correct Type', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(token, 'CS club', true);
      const list = requestChannelsListAllV2(token);
  
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'CS club',
          },
        ]
      });
      expect(requestChannelsListAllV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Multiple channels created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(token, 'CS club', true);
      const channel2 = requestChannelsCreateV2(token, 'sad', true);
      const list = requestChannelsListAllV2(token);
  
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'CS club',
          },
          {
            channelId: channel2.channelId,
            name: 'sad',
          },
        ]
      });
      expect(requestChannelsListAllV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Private channel created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(token, 'CS club', false);
      const list = requestChannelsListAllV2(token);
  
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'CS club',
          },
        ]
      });
      expect(requestChannelsListAllV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Multiple private channels created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(token, 'CS club', false)
      const channel2 = requestChannelsCreateV2(token, 'sad', false)
      const list = requestChannelsListAllV2(token);
  
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'CS club',
          },
          {
            channelId: channel2.channelId,
            name: 'sad',
          },
        ]
      });
      expect(requestChannelsListAllV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Mix of public and private channels created', () => {
      const { token } = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(token, 'CS club', true);
      const channel2 = requestChannelsCreateV2(token, 'sad', false);
      const list = requestChannelsListAllV2(token);
  
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'CS club',
          },
          {
            channelId: channel2.channelId,
            name: 'sad',
          },
        ]
      });
      expect(requestChannelsListAllV2(token, 1)).toStrictEqual(OK);
    });
  
    test('Multiple users & mutliple channels created', () => {
      const user1 = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const user2 = requestAuthRegisterV2('z12345678@unsw.edu.au', 'atar99', 'hayden', 'smith');
  
      const channel = requestChannelsCreateV2(user1.token, 'hello', true);
      const channel2 = requestChannelsCreateV2(user1.token, 'sad', false);
      const channel3 = requestChannelsCreateV2(user2.token, '1531_forever', true);
      const channel4 = requestChannelsCreateV2(user2.token, '6080_forever', false);
  
      const list = requestChannelsListAllV2(user1.token);
      const list2 = requestChannelsListAllV2(user2.token);
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'hello',
          },
          {
            channelId: channel2.channelId,
            name: 'sad',
          },
          {
            channelId: channel3.channelId,
            name: '1531_forever',
          },
          {
            channelId: channel4.channelId,
            name: '6080_forever',
          },
        ]
      });
      expect(requestChannelsListAllV2(user1.token, 1)).toStrictEqual(OK);
      expect(list2).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'hello',
          },
          {
            channelId: channel2.channelId,
            name: 'sad',
          },
          {
            channelId: channel3.channelId,
            name: '1531_forever',
          },
          {
            channelId: channel4.channelId,
            name: '6080_forever',
          },
        ]
      });
      expect(requestChannelsListAllV2(user2.token, 1)).toStrictEqual(OK);
    });
  });
});
