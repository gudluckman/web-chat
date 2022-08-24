import { getData, user, channel, dm, message } from "../dataStore";
import { getHashOf } from "./encrypt.util";

/**
 * Find a user with the given uId, returns an object with the complete user data.
 * To select only parts of the data, the returned object can be destructured.
 * @param uId - The Id of the user to be searched for.
 * @returns a user object of a user with the given uId.
 */
 export function findUserById(uId: number): user {
  const data = getData();
  return data.users.find((user: user) => user.uId === uId);
}

/**
 * Find a user with the given token, returns an object with the complete user data.
 * To select only parts of the data, the returned object can be destructured.
 * @param token - The hashed token of the session that the desired user is logged in to.
 * @returns a user object of a user with the given token session.
 */
export function findUserByToken(token: string): user {
  const data = getData();
  return data.users.find((user) => user.tokens.some((tok) => getHashOf(tok) === token))
}

/**
 * Find a user with the given email, returns an object with the complete user data.
 * @param email - The email belonging to the user that is logged in.
 * @returns a user object of the user with the given email.
 */
export function findUserByEmail(email: string): user {
  const data = getData();
  return data.users.find((user: user) => user.email === email);
}

/**
 * Find a channel with the given channelId, returns an object with the complete channel data.
 * To select only parts of the data, the returned object can be destructured.
 * @param channelId - The channelId belonging to the channel to be searched for.
 * @returns a channel object of a channel with the given channelId.
 */
export function findChannelById(channelId: number): channel {
  const data = getData();
  return data.channels.find((channel: channel) => channel.channelId === channelId);
}

/**
 * Find a dm with the given dmId, returns an object with the complete dm data.
 * To select only parts of the data, the returned object can be destructured.
 * @param dmId - The dmId belonging to the dm to be searched for.
 * @returns a dm object of a dm with the given dmId.
 */
export function findDmById(dmId: number): dm {
  const data = getData();
  return data.dms.find((dm: dm) => dm.dmId === dmId);
}

/**
 * Find a channel with the given messagelId, returns an object with the complete channel data.
 * To select only parts of the data, the returned object can be destructured.
 * @param messageId - The messageId belonging to the message to be searched for.
 * @returns a channel object with the given messageId.
 */
export function findChannelByMessageId(messageId: number): channel {
  const data = getData();
  return data.channels.find((channel: channel) => channel.messages.some((msg: message) => msg.messageId === messageId));
}

/**
 * Find a message with the given messagelId, returns an object with the complete message data.
 * To select only parts of the data, the returned object can be destructured.
 * @param messageId - The messageId belonging to the message to be searched for.
 * @returns a message object with the given messageId.
 */
export function findMessageByMessageId(messageId: number): message {
  const data = getData();
  return data.messages.find((msg: message) => msg.messageId === messageId);
}

/**
 * Find a dm with the given messagelId, returns an object with the complete dm data.
 * To select only parts of the data, the returned object can be destructured.
 * @param messageId - The messageId belonging to the message to be searched for.
 * @returns a dm object with the given messageId.
 */
export function findDmByMessageId(messageId: number): dm {
  const data = getData();
  return data.dms.find((dm: dm) => dm.messages.some((msg: message) => msg.messageId === messageId));
}

/**
 * Function returns user with the active resetCode.
 * @param resetCode - resetCode recieved from request password reset.
 * @returns the user with the active resetCode.
 */
 export function findUserbyResetCode(resetCode: string) {
  const data = getData();
  return data.users.find((user: user) => user.resetCodes.includes(resetCode));
}

/**
 * Function returns user with the active resetCode.
 * @param messageId - messageId of the message
 * @param reactId - reactId
 * @returns the react object of the messageId of the reactId
 */
export function findReactbyMessageIdReactId(messageId: number, reactId: number) {
  const messageObj = findMessageByMessageId(messageId);
  return messageObj.reacts.find(react => react.reactId === reactId);
}
