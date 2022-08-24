import request from 'sync-request';
import { requestAuthRegisterV2 } from './auth.help';
import { OK, SERVER_URL, AUTH_ERROR, INPUT_ERROR } from '../config/server.config';
import { requestAdminUserPermissionChangeV1,  requestAdminUserRemoveV1 } from './admin.help';

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('admin/userpermission/change/v1 tests', () => {
  describe('Error Testing', () => {
    test('Invalid token', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');

      expect(requestAdminUserPermissionChangeV1(authUser.token + 'a', authUserId, 1, 1)).toStrictEqual(AUTH_ERROR);
    });
  
    test('Invalid uId', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestAdminUserPermissionChangeV1(authUser.token, authUserId + 1, 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Invalid permissionId - not a global owner nor global member', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestAdminUserPermissionChangeV1(authUser.token, authUserId, 10, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User is the only global owner - trying to self demote', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Doe');

      expect(requestAdminUserPermissionChangeV1(authUser.token, authUser.authUserId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('user already has the permission level', () => {
      const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');

      expect(requestAdminUserPermissionChangeV1(user.token, authUser.authUserId, 1, 1)).toStrictEqual(OK);
      expect(requestAdminUserPermissionChangeV1(user.token, authUser.authUserId, 1, 1)).toStrictEqual(INPUT_ERROR);
      expect(requestAdminUserPermissionChangeV1(user.token, authUserId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Authorised user in not a global owner', () => {
      const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestAdminUserPermissionChangeV1(authUser.token, authUserId, 1, 1)).toStrictEqual(AUTH_ERROR);
    });
  });

  describe('Success cases', () => {
    test('Authorised user promotes user to global owner', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      
      expect(requestAdminUserPermissionChangeV1(authUser.token, user.authUserId, 1, 1)).toStrictEqual(OK);
    });

    test('Authorised user promotes then demotes user', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      
      requestAdminUserPermissionChangeV1(authUser.token, user.authUserId, 1)
      expect(requestAdminUserPermissionChangeV1(authUser.token, user.authUserId, 2, 1)).toStrictEqual(OK);
    });

    test('One global owner demotes the other global owner', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      // auth user promotes user
      requestAdminUserPermissionChangeV1(authUser.token, user.authUserId, 1);
      // user demotes auth user
      expect(requestAdminUserPermissionChangeV1(user.token, authUser.authUserId, 2, 1)).toStrictEqual(OK);
    });
  });
});

describe('admin/user/remove/v1 tests', () => {
  describe('Error Testing', () => {
    test('Invalid token', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestAdminUserRemoveV1(authUser.token + 'a', authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Invalid uId', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestAdminUserRemoveV1(authUser.token, authUserId + 1, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('User is the only global owner - trying self remove', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password', 'John', 'Doe');
      
      expect(requestAdminUserRemoveV1(authUser.token, authUser.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });

    test('Authorised user in not a global owner', () => {
      const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const { authUserId } = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      
      expect(requestAdminUserRemoveV1(authUser.token, authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });
    
    test('Global member removes user with global owner status', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      
      expect(requestAdminUserRemoveV1(user.token, authUser.authUserId, 1)).toStrictEqual(INPUT_ERROR);
    });
  });

  describe('Success cases', () => {
    test('Authorised user removes another user', () => {
    const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
    const user = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');

    expect(requestAdminUserRemoveV1(authUser.token, user.authUserId)).toStrictEqual({});
    });

    test('Promoted authorised user removes another user', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      const user = requestAuthRegisterV2('jackma@gmail.com', 'p4s5word', 'Jack', 'Ma');
      
      requestAdminUserPermissionChangeV1(authUser.token, authUser2.authUserId, 1);
      expect(requestAdminUserRemoveV1(authUser2.token, user.authUserId, 1)).toStrictEqual(OK);
    });

    test('Promoted user, demotes then remove authorised user', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      
      // promotes authUser2 to global owner status 
      requestAdminUserPermissionChangeV1(authUser.token, authUser2.authUserId, 1);
      // authUser2 demotes authUser1 then remove authUser1
      requestAdminUserPermissionChangeV1(authUser2.token, authUser.authUserId, 2);
      expect(requestAdminUserRemoveV1(authUser2.token, authUser.authUserId, 1)).toStrictEqual(OK);
    });

    test('Promoted user, removes authorised user', () => {
      const authUser = requestAuthRegisterV2('johndoe@gmail.com', 'password5', 'John', 'Doe');
      const authUser2 = requestAuthRegisterV2('karensmith@gmail.com', 'p4assword', 'Karen', 'Smith');
      
      // promotes authUser2 to global owner status 
      expect(requestAdminUserPermissionChangeV1(authUser.token, authUser2.authUserId, 1)).toStrictEqual({});
      expect(requestAdminUserRemoveV1(authUser2.token, authUser.authUserId, 1)).toStrictEqual(OK);
    });
  });
});
