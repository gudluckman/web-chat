import { getData, setData, user, userStats, workspaceStats } from './dataStore';
import validator from 'validator';
import { isEmailValid, isHandleStrValid, isTokenValid, isUserIdValid } from './utils/auth.util';
import { findUserById, findUserByToken } from './utils/find.util';
import { updateHandleStr, updateName, updateProfileImgUrl } from './utils/user.util';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import axios from 'axios';
import { SERVER_URL } from './config/server.config';
import { logError } from './utils/error.util';

type userProfileSetEmail = Record<string, never>;

type userProfileSetName = Record<string, never>;

type userProfileSetHandle = Record<string, never>;

type userProfile = { user: user };

type usersAll = { users: user[] };

type userStatsType = { userStats: userStats };

type usersStatsType = { workspaceStats: workspaceStats | Record<string, never> };

type userUploadPhoto = Record<string, never>;

/**
 * A function that can only be called with an authorised authUserId and
 * returns the user object of the given uId from dataStore.
 * @param token - a valid token for the session of a logged in user.
 * @param uId - userId of the user profile to be returned.
 * @returns an object { error: 'error' } or { user }.
 * User object contains uId, email, nameFirst, nameLast and handleStr.
 */
function userProfileV2(token: string, uId: number): userProfile {
  // Check if token and uId is valid
  if (!isTokenValid(token)) throw new Error('Invalid token');
  if (!isUserIdValid(uId)) throw new Error('Invalid uId');

  const { email, nameFirst, nameLast, handleStr, profileImgUrl } = findUserById(uId);

  return {
    user: { uId, email, nameFirst, nameLast, handleStr, profileImgUrl }
  };
}

/**
 * Function changes a the current user's handleStr.
 * @param token - a valid token for the session user is logged in to.
 * @param handleStr - new handleStr to be updated in dataStore.
 * @returns an empty object or error if the error conditions are matched.
 */
function userProfileSetHandleV1(token: string, handleStr: string): userProfileSetHandle {
  // Error checking
  if (!isTokenValid(token)) throw new Error('Invalid token');

  const user = findUserByToken(token);

  if (
    handleStr.length < 3 ||
    handleStr.length > 20 || !(/^[a-z0-9]+$/i).test(handleStr) ||
    (isHandleStrValid(handleStr) && user.handleStr !== handleStr)
  ) {
    throw new Error('Invalid input');
  }

  user.handleStr = handleStr;
  updateHandleStr(user.uId, handleStr);

  setData();
  return {};
}

/**
 * Given a valid token, function will return all of the user profiles in a users array.
 * @param token - a valid token for the session belonging to a user.
 * @returns an object contianing an array of users that are currently registered or
 * an error if token is invalid.
 */
function usersAllV1(token: string): usersAll {
  const data = getData();

  // Check if token
  if (!isTokenValid(token)) throw new Error('Invalid token');

  const users = data.users.filter((user) => user.isRemoved === false)
    .map((user: user) => ({
      uId: user.uId,
      email: user.email,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      handleStr: user.handleStr,
      profileImgUrl: user.profileImgUrl
    }));

  return { users };
}

/**
 * A function that can only be called with an authorised authUserId and
 * returns the user empty object if no error occurs.
 * @param token - a valid token for the session of a logged in user.
 * @param email - user email to be updated in user profile.
 * @returns an object { error: 'error' } or {}.
 */
function userProfileSetEmailV1(token: string, email: string): userProfileSetEmail {
  // Error checking
  if (!isTokenValid(token)) throw new Error('Invalid token');

  const user = findUserByToken(token);

  if (!validator.isEmail(email) || (isEmailValid(email) && user.email !== email)) {
    throw new Error('Invalid email');
  }

  user.email = email;
  setData();
  return {};
}

/**
 * A function that can only be called with an authorised authUserId,
 * updates the first and last name of user and
 * returns the user empty object if no error occurs.
 * @param token - a valid token for the session of a logged in user.
 * @param nameFirst - user fist name to be updated in user profile.
 * @param nameLast - user last name to be updated in user profile.
 * @returns an object { error: 'error' } or {}.
 */
function userProfileSetNameV1(token: string, nameFirst: string, nameLast: string): userProfileSetName {
  // Error checking
  if (!isTokenValid(token)) throw new Error('Invalid token');
  if (nameFirst.length > 50 || nameFirst.length < 1 || nameLast.length > 50 || nameLast.length < 1) {
    throw new Error('Invalid input');
  }

  const user = findUserByToken(token);
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;

  updateName(user.uId, nameFirst, nameLast);
  setData();
  return {};
}

/**
 * Function return data about the user's lifetime in Treats.
 * @param token - a valid token for the session of a logged in user.
 * @returns an object of userStats which returns analytical data about the user.
 */
function userStatsV1(token: string): userStatsType {
  const data = getData();

  // Error checking
  if (!isTokenValid(token)) throw new Error('Invalid token');

  const { stats } = findUserByToken(token);

  const { numChannelsJoined } = stats.channelsJoined.slice(-1)[0];
  const { numDmsJoined } = stats.dmsJoined.slice(-1)[0];
  const { numMessagesSent } = stats.messagesSent.slice(-1)[0];

  const numerator = (numChannelsJoined + numDmsJoined + numMessagesSent);
  const denominator = (data.channels.length + data.dms.length + data.messages.length);

  stats.involvementRate = parseFloat((numerator / denominator).toFixed(2));

  if (denominator === 0) {
    stats.involvementRate = 0;
  } else if (stats.involvementRate > 1) {
    stats.involvementRate = 1;
  }

  setData();
  return { userStats: stats };
}

/**
 * Function returns analytical data about Treats workspace.
 * @param token - a valid token for the session of a logged in user.
 * @returns an object contianing data about the current state of Treats.
 */
function usersStatsV1(token: string): usersStatsType {
  const data = getData();

  // Error checking
  if (!isTokenValid(token)) throw new Error('Invalid token');

  const numInvolvedUsers = data.users.filter((user) => (user.stats.channelsJoined.slice(-1)[0].numChannelsJoined !== 0 || user.stats.dmsJoined.slice(-1)[0].numDmsJoined !== 0) && user.isRemoved === false).length;
  const numUsers = data.users.filter((user) => user.isRemoved === false).length;

  const utilizationRate = parseFloat((numInvolvedUsers / numUsers).toFixed(2));

  data.stats.utilizationRate = utilizationRate;

  setData();
  return { workspaceStats: data.stats };
}

function userProfileUploadPhotoV1(token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number): userUploadPhoto {
  if (!isTokenValid(token)) throw new Error('Invalid token');

  const width = xEnd - xStart;
  const height = yEnd - yStart;
  const user = findUserByToken(token);

  if (imgUrl.slice(0, 5) === 'https') throw new Error('Invalid url');
  if (width <= 0 || height <= 0) throw new Error('Invalid Input');

  const newImgPath = uuidv4();

  const cropImage = async () => {
    try {
      const image = (await axios({ url: imgUrl, responseType: 'arraybuffer' })).data as Buffer;
      const imageMetadata = await sharp(image).metadata();

      if (imageMetadata.format !== 'jpg') throw new Error('Invalid format');
      if (xStart > imageMetadata.width || xStart < 0 || xEnd > imageMetadata.width || xEnd < 0) throw new Error('Wrong size');
      if (yStart > imageMetadata.height || yStart < 0 || yEnd > imageMetadata.height || yEnd < 0) throw new Error('Wrong height');

      await sharp(image)
        .extract({ left: xStart, width, height, top: yStart })
        .toFormat('jpg')
        .toFile(`./src/uploads/${newImgPath}.jpg`);
    } catch (error) {
      logError(error);
    }
  };

  cropImage();

  user.profileImgUrl = SERVER_URL + `/${newImgPath}.jpg`;

  updateProfileImgUrl(user.uId, user.profileImgUrl);
  setData();
  return {};
}

export { userProfileV2, usersAllV1, userProfileSetHandleV1, userProfileSetEmailV1, userProfileSetNameV1, userStatsV1, usersStatsV1, userProfileUploadPhotoV1 };
