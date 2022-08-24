import request from 'sync-request';
import {requestAuthRegisterV2, requestAuthLoginV2, requestAuthLogoutV1, requestPasswordResetReqV1, requestPasswordResetResetV1} from './auth.help';
import { AUTH_ERROR, INPUT_ERROR, OK, SERVER_URL } from '../config/server.config';
import { requestUserProfileV2 } from './users.help';

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
})

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('auth/register/v3 tests', () => {
  describe('error return type', () => {
    test('length of password is less than 6 characters', () => {
      expect(requestAuthRegisterV2('johnsmith@gmail.com', 'foo', 'John', 'Smith', 1)).toStrictEqual(INPUT_ERROR);
    });
    test('invalid email', () => {
      expect(requestAuthRegisterV2('foo', 'barpassword', 'John', 'Smith', 1)).toStrictEqual(INPUT_ERROR);
    });
    test('first name longer than 50 characters', () => {
      expect(requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'Thisisfiftyonecharactersasanamethatcanbeusedfortest', 'Smith', 1)).toStrictEqual(INPUT_ERROR);
    });
    test('last name longer than 50 characters', () => {
      expect(requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'Smith', 'Thisisfiftyonecharactersasanamethatcanbeusedfortest', 1)).toStrictEqual(INPUT_ERROR);
    });
    test('Email already exists', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');

      expect(requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'Will', 'Magnus', 1)).toStrictEqual(INPUT_ERROR);
    });
  });
  describe('correct return type', () => {
    test('user successfully registers', () => {
      expect(requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith')).toStrictEqual(
        expect.objectContaining({
          token: expect.any(String),
          authUserId: expect.any(Number)
        })
      );
      expect(requestAuthRegisterV2('johnsmith1@gmail.com', 'password', 'John', 'Smith', 1)).toStrictEqual(OK);
    });
    test('authUserId created is unique', () => {
      const firstId = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');    
      const secondId = requestAuthRegisterV2('example@gmail.com', 'abcde129', 'Magnus', 'Jeff');
      
      expect(secondId.authUserId).not.toStrictEqual(firstId.authUserId);
      expect(requestAuthRegisterV2('johnsmith1@gmail.com', 'password', 'John', 'Smith', 1)).toStrictEqual(OK);
    });
    test('Token created is unique', () => {
      const firstId = requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');    
      const secondId = requestAuthRegisterV2('example@gmail.com', 'abcde129', 'Magnus', 'Jeff');
      
      expect(secondId.token).not.toStrictEqual(firstId.token);
      expect(requestAuthRegisterV2('johnsmith1@gmail.com', 'password', 'John', 'Smith', 1)).toStrictEqual(OK);
    });
    test('handleStr is valid', () => {
      const uId = requestAuthRegisterV2('johnsmith1@gmail.com', 'abcd@!231', 'John', 'Smith');
  
      expect(requestUserProfileV2(uId.token, uId.authUserId).user.handleStr).toStrictEqual('johnsmith');
      expect(requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith', 1)).toStrictEqual(OK);
    });
    test('Long first and last name', () => {
      const uId = requestAuthRegisterV2('validemail@gmail.com', 'abcd@!231', 'Johntenchrgh', 'Smithtenchhg');

      expect(requestUserProfileV2(uId.token, uId.authUserId).user.handleStr).toStrictEqual('johntenchrghsmithten');
      expect(requestAuthRegisterV2('validemail1@gmail.com', 'abcd@!231', 'Johntenchrgh', 'Smithtenchhg', 1)).toStrictEqual(OK);
    });
    test('Non-alphanumeric first and last names', () => {
      const uId = requestAuthRegisterV2('validemail@gmail.com', 'abcd@!231', 'John1@#', 'Smith2-=');

      expect(requestUserProfileV2(uId.token, uId.authUserId).user.handleStr).toStrictEqual('john1smith2');
      expect(requestAuthRegisterV2('validemail1@gmail.com', 'abcd@!231', 'John1@#', 'Smith2-=', 1)).toStrictEqual(OK);
    });
    test('two users with same first names and last names', () => {
      const uId1 = requestAuthRegisterV2('validemail@gmail.com', 'abcd@!231', 'John', 'Smith');
      const uId2 = requestAuthRegisterV2('example@gmail.com', 'abcd@!231', 'John', 'Smith');

      expect(requestUserProfileV2(uId1.token, uId1.authUserId).user.handleStr).toStrictEqual('johnsmith');
      expect(requestUserProfileV2(uId2.token, uId2.authUserId).user.handleStr).toStrictEqual('johnsmith0');
      expect(requestAuthRegisterV2('validemail1@gmail.com', 'abcd@!231', 'John', 'Smith', 1)).toStrictEqual(OK);
    });
    test('two users with same first names and last names, but over 20 characters', () => {
      const uId1 = requestAuthRegisterV2('validemail@gmail.com', 'abcd@!231', 'JohnSmith12', 'SmithJohn13');
      const uId2 = requestAuthRegisterV2('example@gmail.com', 'abcd@!231', 'JohnSmith12', 'SmithJohn13');

      expect(requestUserProfileV2(uId1.token, uId1.authUserId).user.handleStr).toStrictEqual('johnsmith12smithjohn');
      expect(requestUserProfileV2(uId2.token, uId2.authUserId).user.handleStr).toStrictEqual('johnsmith12smithjohn0');
      expect(requestAuthRegisterV2('validemail1@gmail.com', 'abcd@!231', 'JohnSmith12', 'SmithJohn13', 1)).toStrictEqual(OK);
    });
  });
});

describe('auth/login/v3 tests', () => {
  describe('error return type', () => {
    test('invalid email', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      expect(requestAuthLoginV2('jake', '0', 1)).toStrictEqual(INPUT_ERROR);
    })
    test('invalid password', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      expect(requestAuthLoginV2('johnsmith@gmail.com', 'mario', 1)).toStrictEqual(INPUT_ERROR);
    })
    test('password of another user', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      requestAuthRegisterV2('johnsmith1@gmail.com', 'abcd@!2317', 'John', 'Smith');
      expect(requestAuthLoginV2('johnsmith1@gmail.com', 'abcd@!231', 1)).toStrictEqual(INPUT_ERROR);
    })
    test('logging in, but not registered', () => {
      expect(requestAuthLoginV2('johnsmith@gmail.com', 'abcd@!231', 1)).toStrictEqual(INPUT_ERROR);
    })
  });
  describe('correct return type', () => {
    test('valid email and password', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      expect(requestAuthLoginV2('johnsmith@gmail.com', 'abcd@!231')).toStrictEqual({ token: expect.any(String), authUserId: expect.any(Number) });
      expect(requestAuthLoginV2('johnsmith@gmail.com', 'abcd@!231', 1)).toStrictEqual(OK);
    });
  });
});

describe('auth/logout/v2 tests', () => {
  describe('error return type', () => {
    test('invalid token', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      expect(requestAuthLogoutV1(authUser.token + 'xyz', 1)).toStrictEqual(AUTH_ERROR);
    });
    test('User logs out and then tries to use expired token', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      expect(requestAuthLogoutV1(authUser.token, 1)).toStrictEqual(OK);
      expect(requestUserProfileV2(authUser.token, authUser.authUserId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  describe('correct return type', () => {
    test('User successfully logs out', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      expect(requestAuthLogoutV1(authUser.token, 1)).toStrictEqual(OK);
    });
    test('User has two tokens, and logs out', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      const authUser2 = requestAuthLoginV2('johnsmith@gmail.com', 'abcd@!231');
      expect(requestAuthLogoutV1(authUser.token, 1)).toStrictEqual(OK);
      expect(requestUserProfileV2(authUser2.token, authUser2.authUserId).user.email).toStrictEqual('johnsmith@gmail.com');
      expect(requestUserProfileV2(authUser.token, authUser.authUserId, 1)).toStrictEqual(AUTH_ERROR);
      expect(requestUserProfileV2(authUser2.token, authUser2.authUserId, 1)).toStrictEqual(OK);
    });
    test('User has two tokens, and logs out twice', () => {
      const authUser = requestAuthRegisterV2('johnsmith@gmail.com', 'abcd@!231', 'John', 'Smith');
      const authUser2 = requestAuthLoginV2('johnsmith@gmail.com', 'abcd@!231');
      expect(requestAuthLogoutV1(authUser.token)).toStrictEqual({});
      expect(requestAuthLogoutV1(authUser2.token, 1)).toStrictEqual(OK);
    });
  });
});

describe('auth/passwordreset/request/v1 tests', () => {
  describe('Success cases', () => {
    test('User is logged out of all current sessions', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      requestAuthLoginV2('johnsmith@gmail.com', 'password');
      requestAuthLoginV2('johnsmith@gmail.com', 'password');
      const { token } = requestAuthLoginV2('johnsmith@gmail.com', 'password');
      expect(requestPasswordResetReqV1('johnsmith@gmail.com', 1)).toStrictEqual(OK);
      expect(requestAuthLogoutV1(token, 1)).toStrictEqual(AUTH_ERROR);
    });

    test('Correct return type', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      expect(requestPasswordResetReqV1('johnsmith@gmail.com')).toStrictEqual({});
    });
  });
});

// Cannot test for invalid password nor success cases as code is always invalid.
describe('auth/passwordreset/reset/v1 tests', () => {
  describe('Error cases', () => {
    test('Invalid reset code', () => {
      requestAuthRegisterV2('johnsmith@gmail.com', 'password', 'John', 'Smith');
      requestPasswordResetReqV1('johnsmith@gmail.com');
      expect(requestPasswordResetResetV1('', 'password2')).toStrictEqual(INPUT_ERROR);
    });
  });
}); 
