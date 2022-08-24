import request from 'sync-request';
import { requestAuthRegisterV2 } from './auth.help';
import { requestMessageSendDmV1 } from './message.help';
import { requestDmCreateV1, requestDmDetailsV1, requestDmMessagesV1, requestDmLeaveV1, requestDmRemoveV1,  requestDmListV1 } from './dm.help';
import { OK, SERVER_URL, AUTH_ERROR, INPUT_ERROR } from '../config/server.config';

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});
  
afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('dm/create/v2 http tests', () => {
  describe('Error Testing', () => {
    test('invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');

      expect(requestDmCreateV1(token + 'xyz', [authUser.authUserId, authUser2.authUserId], 1)).toStrictEqual(AUTH_ERROR);
    });
    test('invalid dmId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');

      expect(requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId - 100], 1)).toStrictEqual(INPUT_ERROR);
    });
    test('duplicate uId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');

      expect(requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId, authUser2.authUserId], 1)).toStrictEqual(INPUT_ERROR);
    });
  });
  describe('Success Cases', () => {
    test('dm successfully created', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');

      expect(requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId], 1)).toStrictEqual(OK);
      expect(requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId])).toStrictEqual({ dmId: expect.any(Number) });
    });
  });
});

describe('dm/details/v2 http tests', () => {
  describe('Error Testing', () => {
    test('Testing for invalid token, expect return error', () => {
      const { token } = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser1 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser2 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(token, [authUser1.authUserId, authUser2.authUserId]);
    
      expect(requestDmDetailsV1(token + 'a', dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('Testing for invalid dmId, expect return error', () => {
      const { token } = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser1 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser2 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(token, [authUser1.authUserId, authUser2.authUserId]);
  
      expect(requestDmDetailsV1(token, dmId + 1, 1)).toStrictEqual(INPUT_ERROR);
    });
  
    test('Testing for user not in dm, expect return error', () => {
      const { token } = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser1 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser2 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(token, [authUser1.authUserId, authUser2.authUserId]);
      const unauthUser = requestAuthRegisterV2('karensmith@gmail.com', 'karenDiner23', 'Karen', 'Smith');
      
      expect(requestDmDetailsV1(unauthUser.token, dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  
  describe('Success Cases', () => {
    test('Testing multiple users in one dm', () => {
      const authUser = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser2 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser3 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(authUser.token, [authUser2.authUserId, authUser3.authUserId]);
      
      expect(requestDmDetailsV1(authUser.token, dmId)).toStrictEqual({
        name: 'charlieharper, suejohnson, woodylewis',
        members: [
          {
            uId: authUser.authUserId,
            email: 'charlieharper@gmail.com',
            nameFirst: 'Charlie',
            nameLast: 'Harper',
            handleStr: 'charlieharper',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          },
          {
            uId: authUser2.authUserId,
            email: 'suejohnson@gmail.com',
            nameFirst: 'Sue',
            nameLast: 'Johnson',
            handleStr: 'suejohnson',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          },
          {
            uId: authUser3.authUserId,
            email: 'woodylewis@gmail.com',
            nameFirst: 'Woody',
            nameLast: 'Lewis',
            handleStr: 'woodylewis',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
      });
      expect(requestDmDetailsV1(authUser.token, dmId, 1)).toStrictEqual(OK);
    });
  
    test('Testing if a user is leaving dm', () => {
      const authUser = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser2 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser3 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(authUser.token, [authUser2.authUserId, authUser3.authUserId]);
  
      requestDmLeaveV1(authUser2.token, dmId);
      expect(requestDmDetailsV1(authUser.token, dmId, 1)).toStrictEqual(OK);
      expect(requestDmDetailsV1(authUser.token, dmId)).toStrictEqual({
        name: 'charlieharper, suejohnson, woodylewis',
        members: [
          {
            uId: authUser.authUserId,
            email: 'charlieharper@gmail.com',
            nameFirst: 'Charlie',
            nameLast: 'Harper',
            handleStr: 'charlieharper',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          },
          {
            uId: authUser3.authUserId,
            email: 'woodylewis@gmail.com',
            nameFirst: 'Woody',
            nameLast: 'Lewis',
            handleStr: 'woodylewis',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
      });
    });
  
    test('Test if owner leaves the dm', () => {
      const authUser = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser2 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser3 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(authUser.token, [authUser2.authUserId, authUser3.authUserId]);
      
      requestDmLeaveV1(authUser.token, dmId);
      expect(requestDmDetailsV1(authUser2.token, dmId)).toStrictEqual({
        name: 'charlieharper, suejohnson, woodylewis',
        members: [
          {
            uId: authUser2.authUserId,
            email: 'suejohnson@gmail.com',
            nameFirst: 'Sue',
            nameLast: 'Johnson',
            handleStr: 'suejohnson',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          },
          {
            uId: authUser3.authUserId,
            email: 'woodylewis@gmail.com',
            nameFirst: 'Woody',
            nameLast: 'Lewis',
            handleStr: 'woodylewis',
            profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
          }
        ],
      });
      expect(requestDmDetailsV1(authUser2.token, dmId, 1)).toStrictEqual(OK);
    });
  
    test('Testing if owner is removing the dm, then dm will not exist', () => {
      const authUser = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser2 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser3 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(authUser.token, [authUser2.authUserId, authUser3.authUserId]);
      
      requestDmRemoveV1(authUser.token, dmId);
      expect(requestDmDetailsV1(authUser2.token, dmId, 1)).toStrictEqual(INPUT_ERROR);
    });
  });
});

describe('dm/remove/v2 tests', () => {
  describe('Error testing', () => {
    test('invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmRemoveV1(token + 'xyz', dm.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('invalid dmId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmRemoveV1(token, dm.dmId - 100, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('authUser not in dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      requestDmLeaveV1(token, dm.dmId);
      expect(requestDmRemoveV1(token, dm.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('trying to remove dm twice', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      requestDmRemoveV1(token, dm.dmId);
      expect(requestDmRemoveV1(token, dm.dmId, 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('dm succesfully removed', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmRemoveV1(token, dm.dmId, 1)).toStrictEqual(OK);
    });
  });
});

describe('dm/leave/v2 tests', () => {
  describe('Error testing', () => {
    test('invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmLeaveV1(authUser.token + 'xyz', dm.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('invalid dmId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmLeaveV1(authUser.token, dm.dmId - 100, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('authUser not in dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const authUser3 = requestAuthRegisterV2('bobdoe@gmail.com', 'password', 'Bob', 'Doe');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmLeaveV1(authUser3.token, dm.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('user tries leaving twice', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      requestDmLeaveV1(token, dm.dmId);
      expect(requestDmLeaveV1(token, dm.dmId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success Cases', () => {
    test('member leaves dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmLeaveV1(authUser.token, dm.dmId, 1)).toStrictEqual(OK);
    });
    test('creator leaves dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const dm = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmLeaveV1(token, dm.dmId, 1)).toStrictEqual(OK);
    });
  });
});

describe('dm/messages/v2 tests', () => {
  describe('Error testing', () => {
    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const { dmId } = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmMessagesV1(token + 'xyz', dmId, 0, 1)).toStrictEqual(AUTH_ERROR);
    });
    
    test('Invalid dmId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const { dmId } = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmMessagesV1(token, dmId + 1, 0, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Start is greater than number of messages', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const { dmId } = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmMessagesV1(token, dmId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Authorised user is not in dm', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const authUser = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const authUser2 = requestAuthRegisterV2('bobsmith@gmail.com', 'password', 'Bob', 'Smith');
      const authUser3 = requestAuthRegisterV2('bobdoe@gmail.com', 'password', 'Bob', 'Doe');
      const { dmId } = requestDmCreateV1(token, [authUser.authUserId, authUser2.authUserId]);

      expect(requestDmMessagesV1(authUser3.token, dmId, 0, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('End is -1 when there are no messages', () => {
      const { token }  = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const { dmId } = requestDmCreateV1(token, [ authUserId ]);
      
      const start = 0;
      expect(requestDmMessagesV1(token, dmId, start)).toStrictEqual({ messages: [], start: 0, end: -1 });
      expect(requestDmMessagesV1(token, dmId, start, 1)).toStrictEqual(OK);
    });

    test('End is start + 50 when there are at least 50 messages', () => {
      const { token }  = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      const { authUserId } = requestAuthRegisterV2('tomsmith@gmail.com', 'password', 'Tom', 'Smith');
      const { dmId } = requestDmCreateV1(token, [ authUserId ]);
      
      for (let i = 0; i < 101; i++) {
        requestMessageSendDmV1(token, dmId, 'Hello');
      }

      let start = 0;
      let { end } = requestDmMessagesV1(token, dmId, start);
      expect(end).toStrictEqual(start + 50);
      start = end;
      end = requestDmMessagesV1(token, dmId, start).end;
      expect(end).toStrictEqual(start + 50);
      start = end;
      end = requestDmMessagesV1(token, dmId, start).end;
      expect(end).toStrictEqual(-1);
      expect(requestDmMessagesV1(token, dmId, start, 1)).toStrictEqual(OK);
    });
  });
});

describe('dm/list/v2 http tests', () => {
  describe('Error Testing', () => {
    test('Testing invalid token', () => {
      const { token } = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser1 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser2 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(token, [authUser1.authUserId, authUser2.authUserId]);

      expect(requestDmListV1(token + 'a', 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  describe('Success Cases', () => {
    test('Testing single dm in list', () => {
      const { token } = requestAuthRegisterV2('charlieharper@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser1 = requestAuthRegisterV2('suejohnson@gmail.com', 'helloWorld', 'Sue', 'Johnson');
      const authUser2 = requestAuthRegisterV2('woodylewis@gmail.com', 'dr1nkPr1m3', 'Woody', 'Lewis');
      const { dmId } = requestDmCreateV1(token, [authUser1.authUserId, authUser2.authUserId]);
  
      expect(requestDmListV1(token)).toStrictEqual({
        dms: [
          {
            dmId: dmId,
            name: 'charlieharper, suejohnson, woodylewis',
          },
        ]
      });
      expect(requestDmListV1(token, 1)).toStrictEqual(OK);
    });
  
    test('Testing multiple dm list', () => {
      const authUser1 = requestAuthRegisterV2('charlieharper2@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser2 = requestAuthRegisterV2('evelynharper42@gmail.com', 'helloWorld', 'Evelyn', 'Harper');
      const authUser3 = requestAuthRegisterV2('alanharper09@gmail.com', 'dr1nkPr1m3', 'Alan', 'Harper');
      
      const authUser4 = requestAuthRegisterV2('jakeharper13@gmail.com', 'dr1nkPr1m2', 'Jake', 'Harper');
      const authUser5 = requestAuthRegisterV2('judithharper62@gmail.com', 'dr1nkPr1m1', 'Judith', 'Harper');
      const authUser6 = requestAuthRegisterV2('herbMelnick100@gmail.com', 'dr1nkPr1m0', 'Herb', 'Melnick');
      
      const authUser7 = requestAuthRegisterV2('bertaroberts12@gmail.com', 'dr1nkPr1', 'Berta', 'Roberts');
      const authUser8 = requestAuthRegisterV2('bridgetschmidth4@gmail.com', 'dr1nkP21', 'Bridget', 'Schmidth');
      const authUser9 = requestAuthRegisterV2('MartyPepper3@gmail.com', 'dr12kPr3', 'Marty', 'Pepper');
      
      const dm1 = requestDmCreateV1(authUser1.token, [authUser2.authUserId, authUser3.authUserId]);
      const dm2 = requestDmCreateV1(authUser5.token, [authUser4.authUserId, authUser6.authUserId, authUser1.authUserId]);
      const dm3 = requestDmCreateV1(authUser9.token, [authUser7.authUserId, authUser8.authUserId, authUser2.authUserId, authUser3.authUserId, authUser1.authUserId]);
    
      expect(requestDmListV1(authUser1.token)).toStrictEqual({
        dms: [
          {
            dmId: dm1.dmId,
            name: 'alanharper, charlieharper, evelynharper',
          },
          {
            dmId: dm2.dmId,
            name: 'charlieharper, herbmelnick, jakeharper, judithharper',
          },
          {
            dmId: dm3.dmId,
            name: 'alanharper, bertaroberts, bridgetschmidth, charlieharper, evelynharper, martypepper',
          }
        ]
      });
      expect(requestDmListV1(authUser1.token, 1)).toStrictEqual(OK);
    });
    
    test('Testing if user is not in any dm', () => {
      const authUser1 = requestAuthRegisterV2('charlieharper2@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser2 = requestAuthRegisterV2('evelynharper42@gmail.com', 'helloWorld', 'Evelyn', 'Harper');
      const authUser3 = requestAuthRegisterV2('alanharper09@gmail.com', 'dr1nkPr1m3', 'Alan', 'Harper');
      const authUser30 = requestAuthRegisterV2('waldenschmidth12@gmail.com', 'dr1nkPr1m', 'Walden', 'Schmidth');

      expect(requestDmListV1(authUser30.token)).toStrictEqual({ dms: [] });
      expect(requestDmListV1(authUser30.token, 1)).toStrictEqual(OK);
    });
  
    test('Testing multiple dm list, but one dm is removed by its owner', () => {
      const authUser1 = requestAuthRegisterV2('charlieharper2@gmail.com', 'gNorf21', 'Charlie', 'Harper');
      const authUser2 = requestAuthRegisterV2('evelynharper42@gmail.com', 'helloWorld', 'Evelyn', 'Harper');
      const authUser3 = requestAuthRegisterV2('alanharper09@gmail.com', 'dr1nkPr1m3', 'Alan', 'Harper');
      
      const authUser4 = requestAuthRegisterV2('jakeharper13@gmail.com', 'dr1nkPr1m2', 'Jake', 'Harper');
      const authUser5 = requestAuthRegisterV2('judithharper62@gmail.com', 'dr1nkPr1m1', 'Judith', 'Harper');
      const authUser6 = requestAuthRegisterV2('herbMelnick100@gmail.com', 'dr1nkPr1m0', 'Herb', 'Melnick');
      
      const authUser7 = requestAuthRegisterV2('bertaroberts12@gmail.com', 'dr1nkPr1', 'Berta', 'Roberts');
      const authUser8 = requestAuthRegisterV2('bridgetschmidth4@gmail.com', 'dr1nkP21', 'Bridget', 'Schmidth');
      const authUser9 = requestAuthRegisterV2('MartyPepper3@gmail.com', 'dr12kPr3', 'Marty', 'Pepper');
      
      const dm1 = requestDmCreateV1(authUser1.token, [authUser2.authUserId, authUser3.authUserId]);
      const dm2 = requestDmCreateV1(authUser5.token, [authUser4.authUserId, authUser6.authUserId, authUser1.authUserId]);
      const dm3 = requestDmCreateV1(authUser9.token, [authUser7.authUserId, authUser8.authUserId, authUser2.authUserId, authUser3.authUserId, authUser1.authUserId]);
      
      requestDmRemoveV1(authUser5.token, dm2.dmId);
      expect(requestDmListV1(authUser1.token)).toStrictEqual({
        dms: [
          {
            dmId: dm1.dmId,
            name: 'alanharper, charlieharper, evelynharper',
          },
          {
            dmId: dm3.dmId,
            name: 'alanharper, bertaroberts, bridgetschmidth, charlieharper, evelynharper, martypepper',
          }
        ]
      });
      expect(requestDmListV1(authUser1.token, 1)).toStrictEqual(OK);
    });
  }); 
});

