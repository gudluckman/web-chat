import { getData, message } from "../dataStore";
import { decryptWithAES, getHashOf } from "./encrypt.util";

/**
 * Checks if token exists in dataStore.
 * @param token - token for the session user is logged in to
 * @returns true if token exists and false if token is invalid.
 */
 export function isTokenValid(token: string): boolean {
  const data = getData();
  return data.users.some((user) => user.tokens.some((tok) => getHashOf(tok) === token));
}

/**
 * Checks if uId exists in dataStore.
 * @param uId - userId to be checked with dataStore.
 * @returns true if uId belongs to a user and false if uId does not exist.
 */
 export function isUserIdValid(uId: number): boolean {
  const data = getData();
  return data.users.some((user) => user.uId === uId);
}

/**
 * Check if password belongs to the registered user in dataStore.
 * @param password - password of the user trying to login.
 * @returns true if password is correct and false if password does not match.
 */
 export function isPasswordValid(password: string): boolean {
  const data = getData();
  return data.users.some((user) => decryptWithAES(user.password) === password);
}

/**
 * Check if channelId exists in dataStore.
 * @param channelId - channelId to be checked in with dataStore.
 * @returns true if channelId exists and false if channelId is invalid.
 */
 export function isChannelIdValid(channelId: number): boolean {
  const data = getData();
  return data.channels.some((channel) => channel.channelId === channelId);
}

/**
 * Check if dmId exists in dataStore.
 * @param dmId - dmId to be checked in with dataStore.
 * @returns true if channelId exists and false if channelId is invalid.
 */
export function isDmIdValid(dmId: number): boolean {
  const data = getData();
  return data.dms.some((dm) => dm.dmId === dmId);
}

/**
 * Check if email belongs to a registered user in dataStore.
 * @param email - email of the registered user.
 * @returns true if email exists in dataStore and false is email does not exist.
 */
export function isEmailValid(email: string): boolean {
  const data = getData();
  return data.users.some((user) => user.email === email);
}

/**
 * Check if handleStr belongs to a registered user in dataStore.
 * @param handleStr - handleStr to match with the dataStore.
 * @returns true if handleStr exists and false if handleStr does not exist.
 */
export function isHandleStrValid(handleStr: string): boolean {
  const data = getData();
  return data.users.some((user) => user.handleStr === handleStr);
}

/**
 * Check if messageId exists in dataStore.
 * @param messageId - channelId to be checked in with dataStore.
 * @returns true if messageId exists and false if messageId is invalid.
 */
 export function isMessageIdInChannelValid(messageId: number): boolean {
  const data = getData();
  return data.channels.some((channel) => channel.messages.some((msg) => msg.messageId === messageId));
}

/**
 * Check if messageId exists in dataStore.
 * @param messageId - channelId to be checked in with dataStore.
 * @returns true if messageId exists and false if messageId is invalid.
 */
export function isMessageIdInDmValid(messageId: number): boolean {
  const data = getData();
  return data.dms.some((dm) => dm.messages.some((msg) => msg.messageId === messageId));
}

/**
 * Check if messageId exists in dataStore.
 * @param messageId - channelId to be checked in with dataStore.
 * @returns true if messageId exists and false if messageId is invalid.
 */
export function isMessageIdInMessageValid(messageId: number): boolean {
  const data = getData();
  return data.messages.some((msg) => msg.messageId === messageId);
}

/**
 * Function checks if resetCode exists in dataStore.
 * @param resetCode - resetCode recieved from request password reset.
 * @returns true if resetCode exists and false if it doesn't exist.
 */
export function isResetCodeValid(resetCode: string) {
  const data = getData();
  return data.users.some((user) => user.resetCodes.includes(resetCode));
}

/**
 * Function checks if reactId is in the message.
 * @param messageObj - message object in the messages array of objects
 * @param reactId - reactId to be searched
 * @returns true if reactId is already in the messageOb
 */
 export function isReactIdInTheMessage(messageObj: message, reactId: number) {
  return messageObj.reacts?.some(react => react.reactId === reactId);
}

/**
 * Function checks if the user has already reacted.
 * @param reactIdObj - reactObj to check if the user already reacted
 * @param uId - uId of the auth user
 * @returns true if user already reacted
 */
export function isThisUserReacted(messageObj: message, uId: number) {
  return messageObj.reacts?.some(react => react.uIds.includes(uId));
}

/** 
 * Checks if permissionId is 1 or 2.
 * @param permissionId - Id to be checked.
 * @returns true if permissionId is 1 or 2 to a user and false if permissionId does not exist.
 */
export function isPermissionIdValid(permissionId: number): boolean {
  return permissionId === 1 || permissionId === 2;
}