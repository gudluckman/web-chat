import { channel, getData, user, dm, message } from './dataStore';
import { isTokenValid } from './utils/auth.util';
import { findUserByToken } from './utils/find.util';

type searchedMessages = {
    messages: message[],
} | { messages: [] };

/**
 * Function allows users to search collection of messages in all channel/DMs that the
 * user has joined that contain the query (case insensitive).
 * @param token - The token belonging to the user searching the collection of messages.
 * @param queryStr - The query string that matches messages.
 * @returns an array of message object.
 */
export function searchV1(token: string, queryStr: string): searchedMessages {
  const data = getData();

  // Error checking
  if (queryStr.length < 1 || queryStr.length > 1000) {
    throw new Error('Invalid input');
  }
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  queryStr = queryStr.toLowerCase();
  const authUser = findUserByToken(token);
  const channels = data.channels.filter((channel: channel) => channel.allMembers.some((user: user) => user.uId === authUser.uId));
  const dms = data.dms.filter((dm: dm) => dm.members.some((user: user) => user.uId === authUser.uId));

  const searchedMessages = data.messages.filter((message) =>
    channels.some((channel) => channel.channelId === message.channelId) || dms.some((dm) => dm.dmId === message.dmId)
  ).map((message) => ({
    messageId: message.messageId,
    uId: message.uId,
    message: message.message,
    timeSent: message.timeSent,
    reacts: message.reacts.map(react => ({
      reactId: react.reactId,
      uIds: react.uIds,
      isThisUserReacted: react.uIds.includes(authUser.uId)
    })),
    isPinned: message.isPinned
  }));

  return {
    messages: searchedMessages.filter((message) => message.message.includes(queryStr)),
  };
}
