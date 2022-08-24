import { requestAuthRegisterV2 } from "./auth.help";
import request from 'sync-request';
import { requestUserProfileV2, requestUserProfileSetEmailV1, requestUserProfileSetNameV1, requestUserProfileSetHandle, requestUsersAllV1, requestUserStatsV1, requestUsersStatsV1, requestUploadPhotoV1 } from "./users.help";
import { AUTH_ERROR, INPUT_ERROR, OK, SERVER_URL } from "../config/server.config";
import { requestChannelsCreateV2 } from "./channels.help";
import { requestDmCreateV1 } from "./dm.help";
import { requestMessageRemoveV1, requestMessageSendDmV1, requestMessageSendV1 } from "./message.help";

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
})

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('Tests for user/profile/v3', () => {
  describe('Error Testing', () => {
    test('uId is not a valid user', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'abcde123A', 'John', 'Smith');

      expect(requestUserProfileV2(token, authUserId + 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('token is not valid', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'abcde123A', 'John', 'Smith');
      expect(requestUserProfileV2(token + 1, authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Valid return type', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');

      expect(requestUserProfileV2(token, authUserId)).toStrictEqual(
        {
          user: {
            uId: authUserId,
            email: 'johnsmith@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        }
      );
      expect(requestUserProfileV2(token, authUserId, 1)).toStrictEqual(OK);
    });
  });
});

describe('Tests for user/profile/setemail/v2', () => {
  describe('Error testing', () => {
    test ('invalid token, expect return error', () => {
      const authUser = requestAuthRegisterV2('karensmith@hotmail.com', 'angRyKar3n', 'Karen', 'Smith');
      
      expect(requestUserProfileSetEmailV1(authUser.token + 'a', 'angrykaren@gmail.com', 1)).toStrictEqual(AUTH_ERROR);
    })
  
    test('invalid email, expect return error', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
  
      expect(requestUserProfileSetEmailV1(authUser.token, '.brucespringsteen2000@gmail', 1)).toStrictEqual(INPUT_ERROR);
    });
  
    test('email already exist, expect return error', () => {
      requestAuthRegisterV2('buzzlight@gmail.com', 'ol516gsXuK', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('johnsmith@gmail.com', 'One23FourFive6', 'John', 'Smith');
    
      expect(requestUserProfileSetEmailV1(authUser2.token, 'buzzlight@gmail.com', 1)).toStrictEqual(INPUT_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('Testing valid return type, expect user object', () => {
      const authUser = requestAuthRegisterV2('karensmith@gmail.com', 'password2314', 'Karen', 'Smith');

      expect(requestUserProfileSetEmailV1(authUser.token, 'angrykaren@hotmail.com')).toStrictEqual({});
      expect(requestUserProfileSetEmailV1(authUser.token, 'angrykaren@hotmail.com', 1)).toStrictEqual(OK);
      expect(requestUserProfileV2(authUser.token, authUser.authUserId)).toStrictEqual({
        user: {
          uId: authUser.authUserId,
          email: 'angrykaren@hotmail.com',
          nameFirst: 'Karen',
          nameLast: 'Smith',
          handleStr: 'karensmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
      });
      expect(requestUserProfileV2(authUser.token, authUser.authUserId, 1)).toStrictEqual(OK);
    });
  }); 
});

describe('Tests for /user/profile/setname/v2', () => {
  describe('Error testing', () => {
    test('invalid token, expect return error', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');

      expect(requestUserProfileSetNameV1(authUser.token + 'a', 'Johnny', 'Smith', 1)).toStrictEqual(AUTH_ERROR);
    });
    
    test('first name is empty, expect return error', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');

      expect(requestUserProfileSetNameV1(authUser.token, '', 'Smith', 1)).toStrictEqual(INPUT_ERROR);
    });
  
    test('last name is empty, expect return error', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');

      expect(requestUserProfileSetNameV1(authUser.token, 'Johnny', '', 1)).toStrictEqual(INPUT_ERROR);
    });
  
    test('first name exceeds 50 characters, expect return error', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestUserProfileSetNameV1(authUser.token, 'Thisisfiftyonecharactersasanamethatcanbeusedfortest', 'Smith', 1))
      .toStrictEqual(INPUT_ERROR);
    });
  
    test('last name exceeds 50 characters, expect return error', () => {
      const authUser = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');

      expect(requestUserProfileSetNameV1(authUser.token, 'Johnny', 'Thisisfiftyonecharactersasanamethatcanbeusedfortest', 1))
      .toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('name is updated succesfully', () => {
      const authUser = requestAuthRegisterV2('karensmith@gmail.com', 'password1314', 'Karen', 'Smith');
      
      expect(requestUserProfileSetNameV1(authUser.token, 'Jenny', 'Smith'))
      .toStrictEqual({});
      expect(requestUserProfileSetNameV1(authUser.token, 'Jenny', 'Smith', 1))
      .toStrictEqual(OK);
      
      expect(requestUserProfileV2(authUser.token, authUser.authUserId)).toStrictEqual(
        {
          user: {
            uId: authUser.authUserId,
            email: 'karensmith@gmail.com',
            nameFirst: 'Jenny',
            nameLast: 'Smith',
            handleStr: 'karensmith',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        }
      );
      expect(requestUserProfileV2(authUser.token, authUser.authUserId, 1)).toStrictEqual(OK);
    });
  });
});

describe('Tests for user/profile/sethandle/v2', () => {
  describe('Error testing', () => {
    test('length of handleStr is less than 3 characters', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');

      expect(requestUserProfileSetHandle(token, 'js', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('length of handleStr is more than 20 characters', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');

      expect(requestUserProfileSetHandle(token, 'aihpeagrgbedwfusgpjbd', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestUserProfileSetHandle(token + 'a', 'john', 1)).toStrictEqual(AUTH_ERROR);
    });

    test('handleStr contains non-alphanumeric characters', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestUserProfileSetHandle(token, 'jas@!=-f.', 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Same handleStr as another user', () => {
      requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Doe');
      
      expect(requestUserProfileSetHandle(token, 'johnsmith', 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Testing valid inputs', () => {
    test('Correct return type', () => {
      const { token, authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Doe');
      
      expect(requestUserProfileSetHandle(token, 'johnsmith')).toStrictEqual({});
      expect(requestUserProfileSetHandle(token, 'johnsmith', 1)).toStrictEqual(OK);
      expect(requestUserProfileV2(token, authUserId)).toStrictEqual({
        user: {
          uId: authUserId,
          email: 'johnsmith@gmail.com',
          nameFirst: 'John',
          nameLast: 'Doe',
          handleStr: 'johnsmith',
          profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
        }
      });
      expect(requestUserProfileV2(token, authUserId, 1)).toStrictEqual(OK);
    });
  });
});

describe('Tests for users/all/v2', () => {
  beforeEach(() => {
    for (let i = 0; i < 10; i++) {
      requestAuthRegisterV2(`john${i}@gmail.com`, 'password', 'John', 'Smith'); 
    }
  });
  
  describe('Error testing', () => {
    test('Invalid token making request', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');

      expect(requestUsersAllV1(token + 'a', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('Correct return type', () => {
      const { token, authUserId } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestUsersAllV1(token)).toStrictEqual(expect.objectContaining({
        users: expect.arrayContaining([
          {
            uId: authUserId,
            email: 'john@gmail.com',
            nameFirst: 'John',
            nameLast: 'Smith',
            handleStr: 'johnsmith9',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ])
      }));
      expect(requestUsersAllV1(token, 1)).toStrictEqual(OK);
    });
  });
});

describe('user/stats/v1 tests', () => {
  describe('Error cases', () => {
    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUserStatsV1(token + 'a', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('One user registered', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUserStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUserStatsV1(token)).toStrictEqual(
        { 
          userStats: {
            channelsJoined: [{numChannelsJoined: 0, timeStamp: expect.any(Number)}],
            dmsJoined: [{numDmsJoined: 0, timeStamp: expect.any(Number)}],
            messagesSent: [{numMessagesSent: 0, timeStamp: expect.any(Number)}],
            involvementRate: 0
          }
        }
      );
    });

    test('User joins a channel', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      requestChannelsCreateV2(token, 'First channel', true);
      expect(requestUserStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUserStatsV1(token)).toStrictEqual(
        { 
          userStats: {
            channelsJoined: [{numChannelsJoined: 0, timeStamp: expect.any(Number)}, {numChannelsJoined: 1, timeStamp: expect.any(Number)}],
            dmsJoined: [{numDmsJoined: 0, timeStamp: expect.any(Number)}],
            messagesSent: [{numMessagesSent: 0, timeStamp: expect.any(Number)}],
            involvementRate: 1
          }
        }
      );
    });

    test('User joins a dm', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      requestDmCreateV1(token, [authUserId]);
      expect(requestUserStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUserStatsV1(token)).toStrictEqual(
        { 
          userStats: {
            channelsJoined: [{numChannelsJoined: 0, timeStamp: expect.any(Number)}],
            dmsJoined: [{numDmsJoined: 0, timeStamp: expect.any(Number)}, {numDmsJoined: 1, timeStamp: expect.any(Number)}],
            messagesSent: [{numMessagesSent: 0, timeStamp: expect.any(Number)}],
            involvementRate: 1
          }
        }
      );
    });

    test('User sends a dm message', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [authUserId]);
      requestMessageSendDmV1(token, dmId, 'Hello');
      expect(requestUserStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUserStatsV1(token)).toStrictEqual(
        { 
          userStats: {
            channelsJoined: [{numChannelsJoined: 0, timeStamp: expect.any(Number)}],
            dmsJoined: [{numDmsJoined: 0, timeStamp: expect.any(Number)}, {numDmsJoined: 1, timeStamp: expect.any(Number)}],
            messagesSent: [{numMessagesSent: 0, timeStamp: expect.any(Number)}, {numMessagesSent: 1, timeStamp: expect.any(Number)}],
            involvementRate: 1
          }
        }
      );      
    });

    test('User sends multiple messages', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first channel', true);
      const { dmId } = requestDmCreateV1(token, [authUserId]);
      requestMessageSendV1(token, channelId, 'hello world');
      requestMessageSendDmV1(token, dmId, 'Hello');
      expect(requestUserStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUserStatsV1(token)).toStrictEqual(
        { 
          userStats: {
            channelsJoined: [{numChannelsJoined: 0, timeStamp: expect.any(Number)}, {numChannelsJoined: 1, timeStamp: expect.any(Number)}],
            dmsJoined: [{numDmsJoined: 0, timeStamp: expect.any(Number)}, {numDmsJoined: 1, timeStamp: expect.any(Number)}],
            messagesSent: [{numMessagesSent: 0, timeStamp: expect.any(Number)}, {numMessagesSent: 1, timeStamp: expect.any(Number)}, {numMessagesSent: 2, timeStamp: expect.any(Number)}],
            involvementRate: 1
          }
        }
      );   
    });

    test('Another user joins a channel', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const user2 = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      requestChannelsCreateV2(user2.token, 'first channel', true);
      const { dmId } = requestDmCreateV1(token, [user2.authUserId]);
      requestMessageSendDmV1(token, dmId, 'Hello');
      expect(requestUserStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUserStatsV1(token)).toStrictEqual(
        { 
          userStats: {
            channelsJoined: [{numChannelsJoined: 0, timeStamp: expect.any(Number)}],
            dmsJoined: [{numDmsJoined: 0, timeStamp: expect.any(Number)}, {numDmsJoined: 1, timeStamp: expect.any(Number)}],
            messagesSent: [{numMessagesSent: 0, timeStamp: expect.any(Number)}, {numMessagesSent: 1, timeStamp: expect.any(Number)}],
            involvementRate: 0.67
          }
        }
      );   
    });

    test('Involvement rate exceeds 1', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first channel', true);

      for (let i = 0; i < 5; i++) {
        let { messageId } = requestMessageSendV1(token, channelId, 'hello');
        requestMessageRemoveV1(token, messageId);
      }

      expect(requestUserStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUserStatsV1(token)).toStrictEqual(
        { 
          userStats: {
            channelsJoined: [{numChannelsJoined: 0, timeStamp: expect.any(Number)}, {numChannelsJoined: 1, timeStamp: expect.any(Number)}],
            dmsJoined: [{numDmsJoined: 0, timeStamp: expect.any(Number)}],
            messagesSent: [{numMessagesSent: 0, timeStamp: expect.any(Number)}, {numMessagesSent: 1, timeStamp: expect.any(Number)}, {numMessagesSent: 2, timeStamp: expect.any(Number)}, {numMessagesSent: 3, timeStamp: expect.any(Number)}, {numMessagesSent: 4, timeStamp: expect.any(Number)}, {numMessagesSent: 5, timeStamp: expect.any(Number)}],
            involvementRate: 1
          }
        }
      );   
    });
  });
});

describe('users/stats/v1 tests', () => {
  describe('Error cases', () => {
    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUsersStatsV1(token + 'a', 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('One user registered', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUsersStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUsersStatsV1(token)).toStrictEqual(
        { 
          workspaceStats: {
            channelsExist: [{numChannelsExist: 0, timeStamp: expect.any(Number)}],
            dmsExist: [{numDmsExist: 0, timeStamp: expect.any(Number)}],
            messagesExist: [{numMessagesExist: 0, timeStamp: expect.any(Number)}],
            utilizationRate: 0
          }
        }
      );
    });

    test('User joins a channel', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      requestChannelsCreateV2(token, 'First channel', true);
      expect(requestUsersStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUsersStatsV1(token)).toStrictEqual(
        { 
          workspaceStats: {
            channelsExist: [{numChannelsExist: 0, timeStamp: expect.any(Number)}, {numChannelsExist: 1, timeStamp: expect.any(Number)}],
            dmsExist: [{numDmsExist: 0, timeStamp: expect.any(Number)}],
            messagesExist: [{numMessagesExist: 0, timeStamp: expect.any(Number)}],
            utilizationRate: 1
          }
        }
      );
    });

    test('User joins a dm', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      requestDmCreateV1(token, [authUserId]);
      expect(requestUsersStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUsersStatsV1(token)).toStrictEqual(
        { 
          workspaceStats: {
            channelsExist: [{numChannelsExist: 0, timeStamp: expect.any(Number)}],
            dmsExist: [{numDmsExist: 0, timeStamp: expect.any(Number)}, {numDmsExist: 1, timeStamp: expect.any(Number)}],
            messagesExist: [{numMessagesExist: 0, timeStamp: expect.any(Number)}],
            utilizationRate: 1
          }
        }
      );
    });

    test('User sends a dm message', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { dmId } = requestDmCreateV1(token, [authUserId]);
      requestMessageSendDmV1(token, dmId, 'Hello');
      expect(requestUsersStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUsersStatsV1(token)).toStrictEqual(
        { 
          workspaceStats: {
            channelsExist: [{numChannelsExist: 0, timeStamp: expect.any(Number)}],
            dmsExist: [{numDmsExist: 0, timeStamp: expect.any(Number)}, {numDmsExist: 1, timeStamp: expect.any(Number)}],
            messagesExist: [{numMessagesExist: 0, timeStamp: expect.any(Number)}, {numMessagesExist: 1, timeStamp: expect.any(Number)}],
            utilizationRate: 1
          }
        }
      );      
    });

    test('User sends multiple messages', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first channel', true);
      const { dmId } = requestDmCreateV1(token, [authUserId]);
      requestMessageSendV1(token, channelId, 'hello world');
      requestMessageSendDmV1(token, dmId, 'Hello');
      expect(requestUsersStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUsersStatsV1(token)).toStrictEqual(
        { 
          workspaceStats: {
            channelsExist: [{numChannelsExist: 0, timeStamp: expect.any(Number)}, {numChannelsExist: 1, timeStamp: expect.any(Number)}],
            dmsExist: [{numDmsExist: 0, timeStamp: expect.any(Number)}, {numDmsExist: 1, timeStamp: expect.any(Number)}],
            messagesExist: [{numMessagesExist: 0, timeStamp: expect.any(Number)}, {numMessagesExist: 1, timeStamp: expect.any(Number)}, {numMessagesExist: 2, timeStamp: expect.any(Number)}],
            utilizationRate: 1
          }
        }
      );   
    });

    test('Another user registers but doesnt join a channel', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      requestChannelsCreateV2(token, 'first channel', true);
      expect(requestUsersStatsV1(token, 1)).toStrictEqual(OK);
      expect(requestUsersStatsV1(token)).toStrictEqual(
        { 
          workspaceStats: {
            channelsExist: [{numChannelsExist: 0, timeStamp: expect.any(Number)}, {numChannelsExist: 1, timeStamp: expect.any(Number)}],
            dmsExist: [{numDmsExist: 0, timeStamp: expect.any(Number)}],
            messagesExist: [{numMessagesExist: 0, timeStamp: expect.any(Number)}],
            utilizationRate: 0.5
          }
        }
      );   
    });
  });
});

describe('user/profile/uploadphoto/v1 tests', () => {
  describe('Error cases', () => {
    test('Invalid Token', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUploadPhotoV1(token + 'a', 'http://dummyimage.com/300.jpg', 0, 0, 200, 200)).toStrictEqual(AUTH_ERROR);
    });

    test('imgUrl does not return 200 code', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUploadPhotoV1(token, 'http://i.picsum.photos/id/728/200/300.jpg', 0, 0, 200, 200)).toStrictEqual(INPUT_ERROR);
    });

    test('Dimensions are greater than the image', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 0, 0, 400, 300)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 0, 0, 300, 400)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 700, 0, 800, 300)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 0, 400, 300, 500)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', -10, 0, 300, 300)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 0, -10, 300, 300)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', -10, 0, -5, 300)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 0, -10, 200, -5)).toStrictEqual(INPUT_ERROR);
    });

    test('End is less than start', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 200, 200, 100, 200)).toStrictEqual(INPUT_ERROR);
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300.jpg', 200, 200, 200, 100)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid file type', () => {
      const { token } = requestAuthRegisterV2('john@gmail.com', 'password', 'John', 'Smith');
      expect(requestUploadPhotoV1(token, 'http://dummyimage.com/300/09f.png/fff', 0, 0, 200, 200)).toStrictEqual(INPUT_ERROR);
    });
  });
});