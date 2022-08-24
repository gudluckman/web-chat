import { setData, dm, getData, user, message, react } from './dataStore';
import { isDmIdValid, isTokenValid, isUserIdValid } from './utils/auth.util';
import { removeDmMessages } from './utils/dm.util';
import { findDmById, findUserByToken } from './utils/find.util';
import { notifyDmAdded } from './utils/notifications.util';
import { updateDmsExist, updateDmsJoinedStats } from './utils/user.util';

type dmCreate = { dmId: number };
type dmRemove = Record<string, never>;
type dmLeave = Record<string, never>;
type dmMessages = { messages: message[], start: number, end: number};
type dmDetails = { name: string, members: user[] };
type dmList = { dms: dm[] };

/**
 * An authorised user creates a new dm
 * @param token - token for the current session user is logged in to.
 * @param uIds - an array of users, excluding the creator of the dm.
 * @returns An object { error: 'error' } if an error occurs, other wise return
 *  an object with { dmId }.
 */
function dmCreateV2(token: string, uIds: number[]): dmCreate {
  const data = getData();
  // Error 403
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  // Error 400
  if (uIds.some((uId) => !isUserIdValid(uId))) throw new Error('Some uId in uIds is invalid');
  if (uIds.some((uId) => uId === findUserByToken(token).uId)) throw new Error('Creator in uIds');
  if (new Set(uIds).size !== uIds.length) throw new Error('Duplicate uId');

  const members = data.users.filter((user: user) => uIds.includes(user.uId) || user === findUserByToken(token))
    .map((user: user) => (
      {
        uId: user.uId,
        email: user.email,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast,
        handleStr: user.handleStr,
        profileImgUrl: user.profileImgUrl
      }
    )).sort((a, b) => {
      if (a.handleStr.localeCompare(b.handleStr) < 0) {
        return -1;
      } else if (a.handleStr.localeCompare(b.handleStr) > 0) {
        return 1;
      }
      return 0;
    });

  const name = members.map((user: user) => user.handleStr).join(', ');

  const { uId, email, nameFirst, nameLast, handleStr, profileImgUrl } = findUserByToken(token);
  const dmCreator = { uId, email, nameFirst, nameLast, handleStr, profileImgUrl };

  const dmId = Math.floor(Math.random() * 10000);

  data.dms.push({ dmId, name, members, dmCreator, messages: [] });

  uIds.forEach(memId => {
    notifyDmAdded(uId, memId, dmId);
    updateDmsJoinedStats(memId);
  });

  updateDmsJoinedStats(uId);
  updateDmsExist();
  setData();
  return { dmId };
}

/**
 * Given authorised user token and dmId, the function returns an object containing
 * an array of the direct message creator's name and member(s) in the direct message.
 * @param token - token of the session the user is logged in to.
 * @param dmId - Id of the direct message to collect details from.
 * @returns An object containing {
 * name: string,
 * member: [users]
 * }, yet if an error occurs then it returns and object containing { error: 'error' }
 */
function dmDetailsV2(token: string, dmId: number): dmDetails {
  // Error 400
  if (!isDmIdValid(dmId)) throw new Error('dmId is invalid');

  // Error 403
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  const { uId } = findUserByToken(token);
  const { name, members } = findDmById(dmId);
  if (members.filter((user: user) => user.uId === uId).length !== 0) {
    return { name, members };
  } else {
    throw new Error('User is not in dm');
  }
}

/**
 * An authorised user, who is also the creator of a dm, removes said dm.
 * @param token - token for the current session user is logged in to.
 * @param dmId - dmId of the dm to remove.
 * @returns An object { error: 'error' } if an error occurs, other wise return
 *  an empty object.
 */
function dmRemoveV2(token: string, dmId: number): dmRemove {
  const data = getData();
  // Error 400
  if (!isDmIdValid(dmId)) throw new Error('dmId is invalid');

  const dm = findDmById(dmId);
  // Error 403
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (dm.dmCreator.uId !== findUserByToken(token).uId) {
    throw new Error('User is not creator');
  }
  if (!dm.members.some((user: user) => user.uId === findUserByToken(token).uId)) {
    throw new Error('User is not in dm');
  }

  data.dms = data.dms.filter((dm: dm) => dm.dmId !== dmId);
  removeDmMessages(dmId);

  updateDmsJoinedStats(findUserByToken(token).uId);
  updateDmsExist();
  setData();
  return {};
}

/**
 * An authorised user, who is also a member of a dm, leaves said dm.
 * The dm remains even if the creator leaves.
 * @param token - token for the current session user is logged in to.
 * @param dmId - dmId of the dm to leave.
 * @returns An object { error: 'error' } if an error occurs, other wise return
 *  an empty object.
 */
function dmLeaveV2(token: string, dmId: number): dmLeave {
  // checking invalid token and invalid dmId
  // Error 400
  if (!isDmIdValid(dmId)) throw new Error('dmId is invalid');

  // Error 403
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  const dm = findDmById(dmId);
  if (!dm.members.some((user: user) => user.uId === findUserByToken(token).uId)) {
    throw new Error('User is not in dm');
  }

  dm.members = dm.members.filter((user: user) => user.uId !== findUserByToken(token).uId);

  updateDmsJoinedStats(findUserByToken(token).uId);
  updateDmsExist();
  setData();
  return {};
}

/**
 * Given a dmId that the authorised user is a member of, return up to 50 messages
 * between start index and start + 50. If the least recent messages have been returned
 * then end will be -1.
 * @param token - token belongs to the authorised user making the request.
 * @param dmId - The id of the dm to view messages for.
 * @param start - the index to start listing messages from.
 * @returns an object contianing an array of messages, start index and end index.
 */
function dmMessagesV2(token: string, dmId: number, start: number): dmMessages {
  // Error 400
  if (!isDmIdValid(dmId)) throw new Error('dmId is invalid');

  const dm = findDmById(dmId);
  const user = findUserByToken(token);
  if (start > dm.messages.length) throw new Error('Start is greater than total messages');
  // Error 403
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (!dm.members.some((mem) => mem.uId === user.uId)) throw new Error('User is not in dm');

  // Sorting and copying messages array based off index input.
  let end = start + 50;
  const sortedMessages = dm.messages
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
      dm.messages[dm.messages.length - 1].messageId
  ) {
    end = -1;
  }

  sortedMessages.map((msg: message) => msg.reacts?.forEach((react: react) => {
    if (react.uIds?.includes(user.uId)) {
      react.isThisUserReacted = true;
    } else {
      react.isThisUserReacted = false;
    }
  })
  );

  return {
    messages: sortedMessages,
    start: start,
    end: end,
  };
}

/**
 * This function will take in an userId and list out all the dms that the user is part of.
 * It will go through all dms in the dataStore and check all members in the 'members' array,
 * if the Id is matched, the object of that dm will be added into the array and once all dms
 * have been looped through it will return the array.
 * @param token - token string for current session.
 * @returns An object containing { dms: [{ dmId, name }]} or { dms: [] } and if
 * a user does not belong to any dms it will return object containing { error: 'error' }.
 */
function dmListV2(token: string): dmList {
  const data = getData();
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  const dms = data.dms.filter((dm: dm) => dm.members.some((user: user) => user.uId === findUserByToken(token).uId));

  return {
    dms: dms.map((dm: dm) => ({
      dmId: dm.dmId,
      name: dm.name
    }))
  };
}

export { dmCreateV2, dmRemoveV2, dmLeaveV2, dmMessagesV2, dmDetailsV2, dmListV2 };
