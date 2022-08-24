import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';
import { getData, notification, setData, user, userStats } from './dataStore';
import { encryptWithAES, decryptWithAES, getHashOf } from './utils/encrypt.util';
import { isEmailValid, isPasswordValid, isResetCodeValid, isTokenValid } from './utils/auth.util';
import { findUserByEmail, findUserbyResetCode, findUserByToken } from './utils/find.util';
import { sendResetCode } from './utils/email.util';
import { SERVER_URL } from './config/server.config';

type authRegister = { token: string, authUserId: number };

type authLogin = { token: string, authUserId: number};
type authLogout = Record<string, never>;
type authPasswordReset = Record<string, never>;

/**
 * Registers a new user object into the dataStore including their unique uId,
 * email, password, first name, last name and handleStr.
 * Returns an object containing authUserId.
 * @param email - email to be registered.
 * @param password - password to be registered.
 * @param nameFirst - the first name of the user.
 * @param nameLast - the last name of the user.
 * @returns An object containing { authUserId: Number }, but if an error occurs
 * then return an object containing { error: 'error' }.
 */
function authRegisterV3(
  email: string, password: string,
  nameFirst: string, nameLast: string
): authRegister {
  const data = getData();
  const unHashedToken = uuidv4();
  const token = getHashOf(unHashedToken);

  // Error Checking
  if (
    !validator.isEmail(email) || password.length < 6 ||
    nameFirst.length > 50 || nameFirst.length < 1 ||
    nameLast.length > 50 || nameLast.length < 1 ||
    isEmailValid(email)
  ) {
    throw new Error('Input is invalid');
  }

  // Creating handleStr for user
  let handleStr = (nameFirst + nameLast).replace(/[^a-z0-9]/gi, '');

  handleStr = handleStr.slice(0, 20);

  // Check for same handleStr in the database
  let i = 0;
  while (data.users.some((user: user) => user.handleStr === handleStr.toLowerCase())) {
    if (i > 0) {
      handleStr = handleStr.slice(0, -1);
    }
    handleStr = handleStr + i;
    i++;
  }

  // Create the new user object
  const uId = data.users.length + 1;

  let permissionId = 2;
  if (data.users.length === 0) {
    permissionId = 1;
  }

  const resetCodes: string[] = [];

  const timeStamp = Math.floor(Date.now() / 1000);
  const stats: userStats = {
    channelsJoined: [{ numChannelsJoined: 0, timeStamp }],
    dmsJoined: [{ numDmsJoined: 0, timeStamp }],
    messagesSent: [{ numMessagesSent: 0, timeStamp }],
    involvementRate: 0
  };

  const user = {
    uId,
    email,
    nameFirst,
    nameLast,
    password: encryptWithAES(password),
    permissionId,
    handleStr: handleStr.toLowerCase(),
    tokens: [unHashedToken],
    resetCodes,
    stats,
    isRemoved: false,
    notifications: [] as notification[],
    profileImgUrl: SERVER_URL + '/defaultProfileImg.jpg'
  };

  if (permissionId === 1) {
    data.stats = {
      channelsExist: [{ numChannelsExist: 0, timeStamp }],
      dmsExist: [{ numDmsExist: 0, timeStamp }],
      messagesExist: [{ numMessagesExist: 0, timeStamp }],
      utilizationRate: 0
    };
  }

  data.users.push(user);
  setData();

  return { token, authUserId: uId };
}

/**
 * Login a registered user object into the dataStore using their
 * email and password.
 * Returns an object containing authUserId.
 * @param email - email of the user logging in.
 * @param password - password of the user logging in.
 * @returns An object containing { authUserId: Number }, but if an error occurs
 * then return an object containing { error: 'error' }.
 */
function authLoginV2(email: string, password: string): authLogin {
  const unHashedToken = uuidv4();
  const token = getHashOf(unHashedToken);

  // Error Checking
  if (!isEmailValid(email) || !isPasswordValid(password)) throw new Error('Email does not belong to a user');

  const user = findUserByEmail(email);

  if (decryptWithAES(user.password) === password) {
    user.tokens.push(unHashedToken);
    setData();
    return { token, authUserId: user.uId };
  } else {
    throw new Error('Password is incorrect');
  }
}

/**
 * Logs out a user by invalidating their token
 * Returns an empty object.
 * @param token - token for the current session user is logged in to.
 * @returns An object containing {}, or {error: 'error'} if an error occurs
 */
function authLogoutV2(token: string): authLogout {
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  const user = findUserByToken(token);

  user.tokens = user.tokens.filter((activeToken) => token !== getHashOf(activeToken));

  setData();
  return {};
}

/**
 * Function sends a reset password code to the given email. When this function
 * is called, all existing sessions are logged out.
 * @param email - email of the user requesting to reset password.
 * @returns an empty object.
 */
function authRequestPasswordResetV1(email: string): authPasswordReset {
  if (isEmailValid(email)) {
    sendResetCode(email);
    findUserByEmail(email).tokens = [];
  }
  setData();
  return {};
}

function authPasswordResetV1(resetCode: string, newPassword: string): authPasswordReset {
  if (newPassword.length < 6) throw new Error('Invalid password');
  if (!isResetCodeValid(resetCode)) throw new Error('Invalid resetCode');

  const user = findUserbyResetCode(resetCode);
  user.password = encryptWithAES(newPassword);
  user.resetCodes = [];

  setData();
  return {};
}

export { authRegisterV3, authLoginV2, authLogoutV2, authRequestPasswordResetV1, authPasswordResetV1 };
