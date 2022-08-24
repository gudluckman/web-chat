import request from 'sync-request';
import { requestChannelsCreateV2, requestChannelsListV2 } from './channels.help';
import { requestAuthRegisterV2 } from './auth.help';
import { requestMessageSendV1 } from './message.help';
import { requestChannelLeaveV1, requestChannelRemoveOwnerV1, requestChannelMessagesV2, requestChannelJoinV2, requestChannelDetailsV2, requestChannelInviteV2, requestChannelAddOwnerV1 } from "./channel.help";
import { OK, SERVER_URL, AUTH_ERROR, INPUT_ERROR } from '../config/server.config';

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('channel/messages/v3 tests', () => {
  describe('Error Testing', () => {
    test('Invalid channelId', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestChannelMessagesV2(token, channelId - 1, 0, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestChannelMessagesV2(token + 'a', channelId, 0, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Start is greater than the total number of messages', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestChannelMessagesV2(token, channelId, 10, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Valid channel, but user is not a member in the channel', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);
      const user2 = requestAuthRegisterV2('example@gmail.com', 'password', 'Will', 'Smith');

      expect(requestChannelMessagesV2(user2.token, channelId, 0, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('End is equal to -1 for 0 messages', () => {
      const { token } = requestAuthRegisterV2('example@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'fifth', true);
      
      const start = 0;
      
      expect(requestChannelMessagesV2(token, channelId, start)).toStrictEqual({ messages: [], start, end: -1});
      expect(requestChannelMessagesV2(token, channelId, start, 1)).toStrictEqual(OK);
    });

    test('End is equal to start + 50 for more than 50 messages', () => {
      const { token } = requestAuthRegisterV2('valid@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      for (let i = 0; i < 101; i++) {
        requestMessageSendV1(token, channelId, 'Hello');
      }
      
      let start = 0;
      let { end } = requestChannelMessagesV2(token, channelId, start);
      expect(requestChannelMessagesV2(token, channelId, start, 1)).toStrictEqual(OK);
      expect(end).toStrictEqual(start + 50);
      start = end;
      end = requestChannelMessagesV2(token, channelId, start).end;
      expect(end).toStrictEqual(start + 50);
      start = end;
      end = requestChannelMessagesV2(token, channelId, start).end;
      expect(end).toStrictEqual(-1);

    });
  });
});

describe('channel/join/v3 http tests', () => {
  describe('Error testing', () => {
    test('Testing token that is invalid', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
      const { channelId } = requestChannelsCreateV2(authUser.token, 'Hello', true);
  
      expect(requestChannelJoinV2(authUser.token + 'z', channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
    
    test('Testing channelId is invalid', () => {
      const authUser1 = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
      const authUser2 = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'Jo', 'Hn');
      const { channelId } = requestChannelsCreateV2(authUser1.token, 'Hello', true);
      
      expect(requestChannelJoinV2(authUser2.token, channelId - 150, 1)).toStrictEqual(INPUT_ERROR);
    });
    
    test('Testing if user is already member of channel', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
      const channelId = requestChannelsCreateV2(authUser.token, 'Hello', true);
  
      expect(requestChannelJoinV2(authUser.token, channelId, 1)).toStrictEqual(INPUT_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('Testing for multiple users in channel', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser1.token,'unswGroup', true);
      
      expect(requestChannelJoinV2(authUser2.token, channelId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId)).toStrictEqual({
        name: 'unswGroup',
        isPublic: true,
        ownerMembers: [
          {
            uId: authUser1.authUserId,
            email: 'johndoe@gmail.com',
            nameFirst: 'John',
            nameLast: 'Doe',
            handleStr: 'johndoe',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
        allMembers: [
          {
            uId: authUser1.authUserId,
            email: 'johndoe@gmail.com',
            nameFirst: 'John',
            nameLast: 'Doe',
            handleStr: 'johndoe',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          },
          {
            uId: authUser2.authUserId,
            email: 'johnsmall@gmail.com',
            nameFirst: 'John',
            nameLast: 'Small',
            handleStr: 'johnsmall',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
      });
    });
  
    test('Multiple Users in channel but owner is not global owner', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'unswGroup', true);
  
      expect(requestChannelJoinV2(authUser1.token, channelId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId)).toStrictEqual({
        name: 'unswGroup',
        isPublic: true,
        ownerMembers: [
          {
            uId: authUser2.authUserId,
            email: 'johnsmall@gmail.com',
            nameFirst: 'John',
            nameLast: 'Small',
            handleStr: 'johnsmall',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
        allMembers: [
          {
            uId: authUser2.authUserId,
            email: 'johnsmall@gmail.com',
            nameFirst: 'John',
            nameLast: 'Small',
            handleStr: 'johnsmall',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          },
          {
            uId: authUser1.authUserId,
            email: 'johndoe@gmail.com',
            nameFirst: 'John',
            nameLast: 'Doe',
            handleStr: 'johndoe',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
      });
    });
  
    test('Verifying that Owner can join Private group', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token,'uSydGroup', false);
  
      expect(requestChannelJoinV2(authUser1.token, channelId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser1.token, channelId)).toStrictEqual({
        name: 'uSydGroup',
        isPublic: false,
        ownerMembers: [
          {
            uId: authUser2.authUserId,
            email: 'johnsmall@gmail.com',
            nameFirst: 'John',
            nameLast: 'Small',
            handleStr: 'johnsmall',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
        allMembers: [
          {
            uId: authUser2.authUserId,
            email: 'johnsmall@gmail.com',
            nameFirst: 'John',
            nameLast: 'Small',
            handleStr: 'johnsmall',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          },
          {
            uId: authUser1.authUserId,
            email: 'johndoe@gmail.com',
            nameFirst: 'John',
            nameLast: 'Doe',
            handleStr: 'johndoe',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
      });
    });
  
    test('Verifying that Member cannot join Private group', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser1.token,'uSydGroup', false);
  
      expect(requestChannelJoinV2(authUser2.token, channelId, 1)).toStrictEqual(AUTH_ERROR);
      expect(requestChannelDetailsV2(authUser1.token, channelId)).toStrictEqual({
        name: 'uSydGroup',
        isPublic: false,
        ownerMembers: [
          {
            uId: authUser1.authUserId,
            email: 'johndoe@gmail.com',
            nameFirst: 'John',
            nameLast: 'Doe',
            handleStr: 'johndoe',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
        allMembers: [
          {
            uId: authUser1.authUserId,
            email: 'johndoe@gmail.com',
            nameFirst: 'John',
            nameLast: 'Doe',
            handleStr: 'johndoe',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
      });
    });
    
    test('Joins public channel', () => {
      const authUser1 = requestAuthRegisterV2('john@gmail.com', '1234567', 'Jo', 'Hn');
      const authUser2 = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'Jo', 'Hn');
      const { channelId } = requestChannelsCreateV2(authUser1.token, 'Hello', true);
      
      expect(requestChannelJoinV2(authUser2.token, channelId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId).allMembers)
      .toStrictEqual(expect.arrayContaining([expect.objectContaining({
        uId: authUser2.authUserId,
        email: 'johnsmith@gmail.com',
        nameFirst: 'Jo',
        nameLast: 'Hn',
        handleStr: 'john0',
        profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
      })]));
    });
  });
});

describe('channel/details/v3 http tests', () => {
  describe('Error testing', () => {
    test('Testing details from non channel member', () => {
      const authUser1 = requestAuthRegisterV2('buzz.lightyear@andysroom.com', 'toinfinityandbeyond3000', 'buzz', 'lightyear');
      const authUser2 = requestAuthRegisterV2('sheriff.woody@andysroom.com', '4NJwi3caci', 'sheriff', 'woody');
      const { channelId } = requestChannelsCreateV2(authUser1.token,'ToyStory5', false);
      
      expect(requestChannelDetailsV2(authUser2.token, channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('Testing invalid token', () => {
      const { token } = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(token, 'unswHangout', true);
       
      expect(requestChannelDetailsV2(token + 'ab', channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('Testing invalid channelId', () => {
      const { token } = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId }= requestChannelsCreateV2(token, 'mathsocServer', false);
      
      expect(requestChannelDetailsV2(token, channelId - 10, 1)).toStrictEqual(INPUT_ERROR);
    });
  
    test('Testing valid channelId, but unauthorised token', () => {
      const { token } = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId }= requestChannelsCreateV2(token,'csesocClub', false);
      const unauthUser = requestAuthRegisterV2('karensmith@gmail.com', 'password', 'Karen', 'Smith');
      expect(requestChannelDetailsV2(unauthUser.token, channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('Correct return type', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(authUser.token, 'Hello', true);
  
      expect(requestChannelDetailsV2(authUser.token, channelId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser.token, channelId)).toStrictEqual({
        name: 'Hello',
        isPublic: true,
        ownerMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }],
        allMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }]
      });
    });
  });
});

describe('channel/invite/v3 http tests', () => {
  describe('Error testing', () => {
    test('Testing invalid token', () => {
      const authUser = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(authUser.token, 'hello', true);
      const authUser2 = requestAuthRegisterV2('z12344@unsw.edu.au', 'eggforever', 'Hayden', 'Smith');
  
      expect(requestChannelInviteV2(authUser.token + 'a', channel.channelId, authUser2.authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('Testing invalid uId', () => {
      const authUser = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(authUser.token, 'hello', true);
  
      expect(requestChannelInviteV2(authUser.token, channel.channelId, 10, 1)).toStrictEqual(INPUT_ERROR);
    });
  
    test('Testing Invalid channelId', () => {
      const authUser = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const authUser2 = requestAuthRegisterV2('z12344@unsw.edu.au', 'eggforever', 'Hayden', 'Smith');
      const { channelId } = requestChannelsCreateV2(authUser.token, 'hello', true);

      expect(requestChannelInviteV2(authUser.token, channelId + 1, authUser2.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Correct return type', () => {
      const authUser = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      const channel = requestChannelsCreateV2(authUser.token, 'hello', true);
      const authUser2 = requestAuthRegisterV2('z12344@unsw.edu.au', 'eggforever', 'Hayden', 'Smith');
  
      expect(requestChannelInviteV2(authUser.token, channel.channelId, authUser2.authUserId, 1)).toStrictEqual(OK);
      const list = requestChannelsListV2(authUser2.token);
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel.channelId,
            name: 'hello',
          },
        ]
      });
    });

    test('Testing multiple channels', () => {
      const authUser = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      requestChannelsCreateV2(authUser.token, 'hello', true);
      const channel2 = requestChannelsCreateV2(authUser.token, 'sad', true);
      requestChannelsCreateV2(authUser.token, 'god', true);
      const authUser2 = requestAuthRegisterV2('z12344@unsw.edu.au', 'eggforever', 'Hayden', 'Smith');
  
      expect(requestChannelInviteV2(authUser.token, channel2.channelId, authUser2.authUserId, 1)).toStrictEqual(OK);

      const list = requestChannelsListV2(authUser2.token);
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel2.channelId,
            name: 'sad',
          },
        ]
      });
    });
    
    test('Testing multiple registers', () => {
      const authUser = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      requestChannelsCreateV2(authUser.token, 'hello', true);
      const authUser2 = requestAuthRegisterV2('z12344@unsw.edu.au', 'eggforever', 'Hayden', 'Smith');
      const authUser3 = requestAuthRegisterV2('z9999@unsw.edu.au', 'tired1234', 'double', 'bay');
      const authUser4 = requestAuthRegisterV2('z45644@unsw.edu.au', 'gogogo', 'tony', 'morrison');
      requestChannelsCreateV2(authUser2.token, '2521_hell', false);
      const channel3 = requestChannelsCreateV2(authUser3.token, '2511_future', true);
  
      expect(requestChannelInviteV2(authUser3.token, channel3.channelId, authUser4.authUserId, 1)).toStrictEqual(OK);

      const list = requestChannelsListV2(authUser4.token);
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel3.channelId,
            name: '2511_future',
          },
        ]
      });
    });
  
    test('Testing multiple registers & multiple channels', () => {
      const authUser = requestAuthRegisterV2('z3393576@unsw.edu.au', 'youNeverknow', 'Allen', 'Yeh');
      requestChannelsCreateV2(authUser.token, 'hello', true);
      const authUser2 = requestAuthRegisterV2('z12344@unsw.edu.au', 'eggforever', 'Hayden', 'Smith');
      requestAuthRegisterV2('z9999@unsw.edu.au', 'tired1234', 'double', 'bay');
      const channel2 = requestChannelsCreateV2(authUser.token, '2521_hell', false);
  
      expect(requestChannelInviteV2(authUser.token, channel2.channelId, authUser2.authUserId, 1)).toStrictEqual(OK);

      const list = requestChannelsListV2(authUser2.token);
      expect(list).toStrictEqual({
        channels: [
          {
            channelId: channel2.channelId,
            name: '2521_hell',
          },
        ]
      });
    });
  });
});

describe('channel/leave/v2 http tests', () => {
  describe('Error testing', () => {
    test('Testing details from non channel member', () => {
      const authUser1 = requestAuthRegisterV2('buzz.lightyear@andysroom.com', 'toinfinityandbeyond3000', 'buzz', 'lightyear');
      const authUser2 = requestAuthRegisterV2('sheriff.woody@andysroom.com', '4NJwi3caci', 'sheriff', 'woody');
      const { channelId } = requestChannelsCreateV2(authUser1.token,'ToyStory5', false);
      
      expect(requestChannelLeaveV1(authUser2.token, channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('Testing invalid token', () => {
      const { token } = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(token, 'unswHangout', true);
       
      expect(requestChannelLeaveV1(token + 'ab', channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('Testing invalid channelId', () => {
      const { token } = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(token, 'mathsocServer', false);
      
      expect(requestChannelLeaveV1(token, channelId - 10, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Testing valid channelId, but unauthorised token', () => {
      const { token } = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(token, 'csesocClub', false);
      const unauthUser = requestAuthRegisterV2('karensmith@gmail.com', 'password', 'Karen', 'Smith');
      
      expect(requestChannelLeaveV1(unauthUser.token, channelId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Multi members and all members left', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('aqwert1234@gmail.com', '123password', 'tony', 'Smith');
      const { channelId } = requestChannelsCreateV2(authUser.token, 'Hello', true);
      requestChannelJoinV2(authUser2.token, channelId);
      requestChannelLeaveV1(authUser2.token, channelId);
      requestChannelLeaveV1(authUser.token, channelId);
      
      expect(requestChannelLeaveV1(authUser.token, channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('Correct return type', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(authUser.token, 'Hello', true);
      let channel = requestChannelDetailsV2(authUser.token, channelId);
      expect(channel).toStrictEqual({
        name: 'Hello',
        isPublic: true,
        ownerMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }],
        allMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        ]
      });

      expect(requestChannelLeaveV1(authUser.token, channelId, 1)).toStrictEqual(OK);
      const authUser2 = requestAuthRegisterV2('phillip@gmail.com', '123453367', 'abc', 'zfe');
      requestChannelJoinV2(authUser2.token, channelId);
      channel = requestChannelDetailsV2(authUser2.token, channelId);
      expect(channel).toStrictEqual({
        name: 'Hello',
        isPublic: true,
        ownerMembers: [],
        allMembers: [{
          uId: authUser2.authUserId,
          email: 'phillip@gmail.com',
          nameFirst: 'abc',
          nameLast: 'zfe',
          handleStr: 'abczfe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }]
      });
    });
  
    test('Multi members and 1 member left', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('aqwert1234@gmail.com', '123password', 'tony', 'Smith');
      const { channelId } = requestChannelsCreateV2(authUser.token, 'Hello', true);
      requestChannelJoinV2(authUser2.token, channelId);
      expect(requestChannelDetailsV2(authUser.token, channelId)).toStrictEqual({
        name: 'Hello',
        isPublic: true,
        ownerMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }],
        allMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser2.authUserId,
          email: 'aqwert1234@gmail.com',
          nameFirst: 'tony',
          nameLast: 'Smith',
          handleStr: 'tonysmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        ]
      });

      expect(requestChannelLeaveV1(authUser2.token, channelId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser.token, channelId)).toStrictEqual({
        name: 'Hello',
        isPublic: true,
        ownerMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }],
        allMembers: [{
          uId: authUser.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        ]
      });
    });
  });
});

describe('channel/addowner/v2 tests', () => {
  describe('Error testing', () => {
    test('invalid token', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
  
      expect(requestChannelAddOwnerV1(authUser2.token + 'xyz', channelId, authUser1.authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('channelId does not refer to valid channel', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      
      expect(requestChannelAddOwnerV1(authUser2.token, channelId - 10, authUser1.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('uId does not refer to valid channel', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      
      expect(requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId - 10, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('uId refers to user who is not member of the channel', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      
      expect(requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('uId refers to user who is already owner of the channel', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      
      expect(requestChannelAddOwnerV1(authUser1.token, channelId, authUser2.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('authorised user who does not have channel owner permissions', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johngray@gmail.com', '4NJwi3caci', 'John', 'Gray');
      const { channelId } = requestChannelsCreateV2(authUser1.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser2.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
      
      expect(requestChannelAddOwnerV1(authUser3.token, channelId, authUser2.authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('Valid Inputs', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johngray@gmail.com', '4NJwi3caci', 'John', 'Gray');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
  
      expect(requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId)).toStrictEqual({
        name: 'Kiwis Society',
        isPublic: true,
        ownerMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser1.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
        allMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser1.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser3.authUserId,
          email: 'johngray@gmail.com',
          nameFirst: 'John',
          nameLast: 'Gray',
          handleStr: 'johngray',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
      });
    });

    test('channel member with owner permissions adds themselves as channel owner', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johngray@gmail.com', '4NJwi3caci', 'John', 'Gray');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
  
      expect(requestChannelAddOwnerV1(authUser1.token, channelId, authUser1.authUserId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId)).toStrictEqual({
        name: 'Kiwis Society',
        isPublic: true,
        ownerMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser1.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
        allMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser1.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser3.authUserId,
          email: 'johngray@gmail.com',
          nameFirst: 'John',
          nameLast: 'Gray',
          handleStr: 'johngray',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
      });
    });

    test('channel member with owner permissions adds another user as channel owner', () => {
      const authUser1 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johngray@gmail.com', '4NJwi3caci', 'John', 'Gray');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
  
      expect(requestChannelAddOwnerV1(authUser1.token, channelId, authUser3.authUserId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId)).toStrictEqual({
        name: 'Kiwis Society',
        isPublic: true,
        ownerMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser3.authUserId,
          email: 'johngray@gmail.com',
          nameFirst: 'John',
          nameLast: 'Gray',
          handleStr: 'johngray',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
        allMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser1.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser3.authUserId,
          email: 'johngray@gmail.com',
          nameFirst: 'John',
          nameLast: 'Gray',
          handleStr: 'johngray',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
      });
    });
  });  
});

describe('channel/removeowner/v2 tests', () => {
  describe('Error testing', () => {
    test('Invalid token', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId);
  
      expect(requestChannelRemoveOwnerV1(authUser1.token + 'xyz', channelId, authUser2.authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid channelId', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId);
  
      expect(requestChannelRemoveOwnerV1(authUser1.token, channelId - 10, authUser2.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid uId', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId);
  
      expect(requestChannelRemoveOwnerV1(authUser1.token, channelId, authUser2.authUserId - 100, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('uId refers to user who is not currently an owner of the channel', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId);
  
      expect(requestChannelRemoveOwnerV1(authUser1.token, channelId, authUser3.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('uId refers to user who is currently the only owner of the channel', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId);
  
      expect(requestChannelRemoveOwnerV1(authUser1.token, channelId, authUser2.authUserId)).toStrictEqual({});
      expect(requestChannelRemoveOwnerV1(authUser1.token, channelId, authUser1.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('authorised user does not have owner permissions in the channel', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId);

      expect(requestChannelRemoveOwnerV1(authUser3.token, channelId, authUser2.authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('valid inputs', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser1.authUserId);
  
      expect(requestChannelRemoveOwnerV1(authUser1.token, channelId, authUser2.authUserId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId)).toStrictEqual({
        name: 'Kiwis Society',
        isPublic: true,
        ownerMembers: [{
          uId: authUser1.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
        allMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser1.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser3.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
      });
    });

    test('channel member w/ permissions removes channel owner', () => {
      const authUser1 = requestAuthRegisterV2('johnsmith@gmail.com', '123password', 'John', 'Smith');
      const authUser2 = requestAuthRegisterV2('johnsmall@gmail.com', '4NJwi3caci', 'John', 'Small');
      const authUser3 = requestAuthRegisterV2('johndoe@gmail.com', '4NJwi3caci', 'John', 'Doe');
      const { channelId } = requestChannelsCreateV2(authUser2.token, 'Kiwis Society', true);
      requestChannelJoinV2(authUser1.token, channelId);
      requestChannelJoinV2(authUser3.token, channelId);
      requestChannelAddOwnerV1(authUser2.token, channelId, authUser3.authUserId);

      expect(requestChannelRemoveOwnerV1(authUser1.token, channelId, authUser2.authUserId, 1)).toStrictEqual(OK);
      expect(requestChannelDetailsV2(authUser2.token, channelId)).toStrictEqual({
        name: 'Kiwis Society',
        isPublic: true,
        ownerMembers: [{
          uId: authUser3.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
        allMembers: [{
          uId: authUser2.authUserId,
          email: 'johnsmall@gmail.com',
          nameFirst: 'John',
          nameLast: 'Small',
          handleStr: 'johnsmall',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser1.authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Smith',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        },
        {
          uId: authUser3.authUserId,
          email: 'johndoe@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johndoe',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
        ],
      });
    });
  });
});
