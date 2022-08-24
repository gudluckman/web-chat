import { setData, user, message, react } from './dataStore';
import { isChannelIdValid, isTokenValid, isUserIdValid } from './utils/auth.util';
import { findChannelById, findUserById, findUserByToken } from './utils/find.util';
import { notifyChannelAdded } from './utils/notifications.util';
import { updateChannelsJoinedStats } from './utils/user.util';

type channelDetails = {
  name: string,
  isPublic: boolean,
  ownerMembers: user[],
  allMembers: user[]
};

type channelMessages = {
  messages: message[],
  start: number,
  end: number,
};

type channelJoin = Record<string, never>;
type channelInvite = Record<string, never>;
type channelLeave = Record<string, never>;
type channelAddOwner = Record<string, never>;
type channelRemoveOwner = Record<string, never>;

/**
 * An authorised user joins a channel given by the channel Id only if they
 * have permission. Only global owner permissions can join private channels.
 * @param token - token for the current session user is logged in to.
 * @param channelId - Channel Id of channel to join.
 * @returns An object { error: 'error' } if an error occurs, other wise return
 *  an empty object.
 */
function channelJoinV3(token: string, channelId: number): channelJoin {
  // Error checking
  // ERROR 403
  if (!isTokenValid(token)) throw new Error('Invalid token');
  // ERROR 400
  if (!isChannelIdValid(channelId)) throw new Error('Channel does not exist');

  const channel = findChannelById(channelId);
  const { uId, email, nameFirst, nameLast, handleStr, permissionId, profileImgUrl } = findUserByToken(token);

  // ERROR 403
  if ((channel.isPublic === false && (permissionId !== 1 && !channel.allMembers.some((mem) => mem.uId === uId)))) {
    throw new Error('Invalid Authorization!');
  }
  // ERROR 400
  if (channel.allMembers.some((mem) => mem.uId === uId)) {
    throw new Error('User is already a member of this channel');
  }

  channel.allMembers.push({ uId, email, nameFirst, nameLast, handleStr, profileImgUrl });

  updateChannelsJoinedStats(uId);
  setData();
  return {};
}

/**
 * Provides basic details about the channel.
 * Returns an object containing name, isPublic, ownerMembers, allMembers.
 * @param token - token of the session the user is logged in to.
 * @param channelId - Id of the channel to collect details from.
 * @returns An object containing {
 * name: String,
 * isPublic: Boolean,
 * ownerMembers: [users],
 * allMembers: [users]
 * }, but if an error occurs then return an object containing { error: 'error' }.
 */
function channelDetailsV3(token: string, channelId: number): channelDetails {
  // Error checking
  // ERROR 403
  if (!isTokenValid(token)) throw new Error('Invalid token');
  // ERROR 400
  if (!isChannelIdValid(channelId)) throw new Error('Channel does not exist');

  const { uId } = findUserByToken(token);
  const { name, isPublic, ownerMembers, allMembers } = findChannelById(channelId);

  // ERROR 403
  if (allMembers.filter((user: user) => user.uId === uId).length !== 0) {
    return { name, isPublic, ownerMembers, allMembers };
  } else {
    throw new Error('Invalid Authorization!');
  }
}

/**
 * Function searches for the given channel by channelId and returns an object
 * containing an array of up to 50 messages with index starting from 'start'.
 * The array starting index will be by the order of latest message sent.
 * @param token - token of the session the user is logged in to.
 * @param channelId - Id belonging to channel containing the messages.
 * @param start - the index to start reading messages in the channel.
 * @returns An object { messages, start, end } where end is the index of the
 * first message. Returns { error: 'error' } for errors.
 */
function channelMessagesV3(token: string, channelId: number, start: number): channelMessages {
  // Error checking
  // ERROR 403
  if (!isTokenValid(token)) throw new Error('Invalid token');
  // ERROR 400
  if (!isChannelIdValid(channelId)) throw new Error('Channel does not exist');

  const channel = findChannelById(channelId);
  const user = findUserByToken(token);

  // ERROR 400
  if (start > channel.messages.length) throw new Error('Message exceeds the limit');
  // ERROR 403
  if (isChannelIdValid(channelId) && !channel.allMembers.some((mem) => mem.uId === user.uId)) {
    throw new Error('Invalid Authorization!');
  }

  // Sorting and copying messages array based off index input.
  let end = start + 50;
  const sortedMessages = channel.messages
    .sort((a, b) => b.timeSentMs - a.timeSentMs)
    .slice(start, end)
    .map((msg) => ({
      messageId: msg.messageId,
      uId: msg.uId,
      message: msg.message,
      timeSent: msg.timeSent,
      reacts: msg.reacts,
      isPinned: msg.isPinned
    }));

  if (
    sortedMessages.length === 0 ||
      sortedMessages[sortedMessages.length - 1].messageId ===
      channel.messages[channel.messages.length - 1].messageId
  ) {
    end = -1;
  }

  sortedMessages.map((msg: message) => msg.reacts?.forEach((react: react) => {
    if (react.uIds?.includes(user.uId)) {
      react.isThisUserReacted = true;
    } else {
      react.isThisUserReacted = false;
    }
  }));

  return {
    messages: sortedMessages,
    start: start,
    end: end,
  };
}

/**
 * This function will take in 3 parameters so an authorised user can invite another user
 * to join the channel that he/she is in. If the channel does not exist, or authorised user
 * is not in the channel, or uId is already in the channel the function will return error.
 * @param token - token of the session the user is logged in to.
 * @param channelId - channelId that authorised user is in to invite uId.
 * @param uId - User that is to be invited.
 * @returns An empty object or { error: 'error' }
 */
function channelInviteV3(token:string, channelId: number, uId: number): channelInvite {
  // ERROR 403
  if (!isTokenValid(token)) throw new Error('Invalid token');
  // ERROR 400
  if (!isChannelIdValid(channelId)) throw new Error('Channel does not exist');
  if (!isUserIdValid(uId)) throw new Error('User is invalid');

  const { allMembers } = findChannelById(channelId);
  const user = findUserByToken(token);
  // ERROR 403
  if (
    allMembers.some((mem) => mem.uId === uId) ||
    !allMembers.some((mem) => mem.uId === user.uId)
  ) {
    throw new Error('Invalid Authorization!');
  }

  const { email, nameFirst, nameLast, handleStr, profileImgUrl } = findUserById(uId);
  allMembers.push({ uId, email, nameFirst, nameLast, handleStr, profileImgUrl });

  notifyChannelAdded(user.uId, uId, channelId);
  updateChannelsJoinedStats(uId);
  setData();
  return {};
}

/**
 * This function will take in 2 parameters so an authorised user can leave the channel with
 * the channelId provide. If token is invalid or channelId does not exist the function will
 * return error. If the user of the token Id does not exist in the channel it will also return
 * error
 * @param token - token of the session the user is logged in to.
 * @param channelId - channelId that authorised user is in to invite uId.
 * @returns An empty object or { error: 'error' }
 */
function channelLeaveV2(token:string, channelId: number): channelLeave {
  // ERROR 403
  if (!isTokenValid(token)) throw new Error('Invalid token');
  // ERROR 400
  if (!isChannelIdValid(channelId)) throw new Error('Channel does not exist');

  const channel = findChannelById(channelId);
  const user = findUserByToken(token);

  if (channel.standupUser === user.uId) throw new Error('User who started standup cannot leave standup.');

  // ERROR 403
  if (!channel.allMembers.some((mem) => mem.uId === user.uId)) {
    throw new Error('Invalid Authorization!');
  }
  channel.ownerMembers = channel.ownerMembers.filter((mem) => mem.uId !== user.uId);
  channel.allMembers = channel.allMembers.filter((mem) => mem.uId !== user.uId);

  updateChannelsJoinedStats(findUserByToken(token).uId);
  setData();
  return {};
}

/**
 * An authorised user with channel owner permissions in the given channel
 * can make a given member of a channel, a channel owner
 * @param token - token of the session the user is logged in to.
 * @param channelId - channelId that authorised user has owner permissions in.
 * @param uId - User that is to be added as owner.
 * @returns An empty object or { error: 'error' }
 */
function channelAddOwnerV2(token: string, channelId: number, uId: number): channelAddOwner {
  // ERROR 403
  if (!isTokenValid(token)) throw new Error('Invalid token');
  // ERROR 400
  if (!isChannelIdValid(channelId)) throw new Error('Channel does not exist');
  if (!isUserIdValid(uId)) throw new Error('User is invalid');

  const { ownerMembers } = findChannelById(channelId);
  const { allMembers } = findChannelById(channelId);
  const authUser = findUserByToken(token);

  // ERROR 400
  if (ownerMembers.some((mem) => mem.uId === uId)) {
    throw new Error('User is already an owner of this channel');
  }
  if (!allMembers.some((mem) => mem.uId === uId)) {
    throw new Error('User is not a member of this channel');
  }
  // ERROR 403
  if (
    (!ownerMembers.some((mem) => mem.uId === authUser.uId) && !(allMembers.some((mem) => mem.uId === authUser.uId) && authUser.permissionId === 1))
  ) {
    throw new Error('Invalid Authorization!');
  }

  const { email, nameFirst, nameLast, handleStr, profileImgUrl } = findUserById(uId);

  ownerMembers.push({ uId, email, nameFirst, nameLast, handleStr, profileImgUrl });

  setData();
  return {};
}

/**
 * An authorised user with channel owner permissions in the given channel
 * can remove a given channel owner
 * @param token - token of the session the user is logged in to.
 * @param channelId - channelId that authorised user has owner permissions in.
 * @param uId - User that is to be removed as owner.
 * @returns An empty object or { error: 'error' }
 */
function channelRemoveOwnerV2(token: string, channelId: number, uId: number): channelRemoveOwner {
  // ERROR 403
  if (!isTokenValid(token)) throw new Error('Invalid token');
  // ERROR 400
  if (!isChannelIdValid(channelId)) throw new Error('Channel does not exist');
  if (!isUserIdValid(uId)) throw new Error('User is invalid');

  const channel = findChannelById(channelId);
  const authUser = findUserByToken(token);

  // ERROR 400
  if ((channel.ownerMembers.some((mem) => mem.uId === uId) && channel.ownerMembers.length === 1)) {
    throw new Error('User is the only owner of this channel');
  }
  if (!channel.ownerMembers.some((mem) => mem.uId === uId)) {
    throw new Error('User is not an owner of this channel');
  }
  // ERROR 403
  if (
    (!channel.ownerMembers.some((mem) => mem.uId === authUser.uId) &&
    !(channel.allMembers.some((mem) => mem.uId === authUser.uId) && authUser.permissionId === 1))
  ) {
    throw new Error('Invalid Authorization!');
  }

  channel.ownerMembers = channel.ownerMembers.filter((mem) => mem.uId !== uId);

  setData();
  return {};
}

export { channelDetailsV3, channelJoinV3, channelInviteV3, channelMessagesV3, channelLeaveV2, channelAddOwnerV2, channelRemoveOwnerV2 };
