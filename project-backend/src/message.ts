import { getData, setData, user, message, react } from './dataStore';
import { isChannelIdValid, isDmIdValid, isMessageIdInChannelValid, isMessageIdInMessageValid, isTokenValid } from './utils/auth.util';
import { findChannelById, findChannelByMessageId, findDmById, findDmByMessageId, findMessageByMessageId, findUserByToken, findReactbyMessageIdReactId } from './utils/find.util';
import { updateMsgExist, updateMsgSentStats } from './utils/user.util';
import { helperMessageSend, helperMessageSendDm } from './utils/timeout.util';
import { checkForTag, notifyMessageReact } from './utils/notifications.util';

type messageSend = { messageId: number };
type messageEdit = Record<string, never>;
type messageRemove = Record<string, never>;
type messageSendLater = { messageId: number };
type messageSendLaterDm = { messageId: number };
type messageReact = Record<string, never>;
type messagePin = Record<string, never>;
type messageShare = { sharedMessageId: number };

/**
 * Function allows users to send a message in a given channel and returns the unique
 * messageId. Function also pushes the message into the dataStore.
 * @param token - The token belonging to the user sending the message.
 * @param channelId - The Id belonging to the channel where the message is sent.
 * @param message - The message sent to the channel.
 * @returns a messageId that is unique to the message sent.
 */
function messageSendV2(token: string, channelId: number, message: string): messageSend {
  const data = getData();

  if (!isTokenValid(token)) throw new Error('Token is invalid');
  // Error checking
  if (!isChannelIdValid(channelId) ||
    message.length < 1 || message.length > 1000
  ) {
    throw new Error('Input is invalid');
  }

  const { uId } = findUserByToken(token);
  const channel = findChannelById(channelId);

  if (!channel.allMembers.some((user: user) => user.uId === uId)) throw new Error('403 Error');

  const timeSent = Math.floor(Date.now() / 1000);
  const timeSentMs = Math.floor(Date.now());
  const messageId = Math.floor(Math.random() * 10000);
  const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
  const messageObj = { messageId, uId, message, timeSent, reacts, isPinned: false, timeSentMs, channelId };

  // Push new message object into the channel messages array and
  // global dataStore messages array.
  channel.messages.push(messageObj as message);
  data.messages.push(messageObj as message);

  checkForTag(messageId);
  updateMsgSentStats(uId);
  setData();
  return { messageId };
}

/**
 * Function allows users who have channel owner permission to edit a message
 * exists in the channel with the given channel Id in a given channel and return empty object.
 * @param token - The token belonging to the user sending the message.
 * @param messageId - The Id belonging to the message where the editing will be done.
 * @param message - The message that will replace the original message.
 * @returns a empty object.
 */
function messageEditV2(token: string, messageId: number, message: string): messageEdit {
  const data = getData();

  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (!isMessageIdInMessageValid(messageId) || message.length > 1000) {
    throw new Error('Input is invalid');
  }

  const { uId, permissionId } = findUserByToken(token);
  const channelObj = findChannelByMessageId(messageId);
  const dmObj = findDmByMessageId(messageId);
  const messageObj = findMessageByMessageId(messageId);
  const oldMsg = messageObj.message.slice();

  // Error checking
  if (isMessageIdInChannelValid(messageId)) {
    if (
      messageObj.uId !== uId ||
      !channelObj.allMembers.some((mem: user) => mem.uId === uId) ||
      (!channelObj.ownerMembers.some((mem: user) => mem.uId === uId) && !(channelObj.allMembers.some((mem: user) => mem.uId === uId) && permissionId === 1))
    ) {
      throw new Error('403 Error');
    }
  } else {
    if (
      messageObj.uId !== uId ||
      !dmObj.members.some((mem: user) => mem.uId === uId) ||
      (!(dmObj.dmCreator.uId === uId) && !(dmObj.members.some((mem: user) => mem.uId === uId) && permissionId === 1))
    ) {
      throw new Error('403 Error');
    }
  }

  if (message.length === 0) {
    data.messages = data.messages.filter((msg: message) => msg.messageId !== messageId);
    if (isMessageIdInChannelValid(messageId)) {
      channelObj.messages = channelObj.messages.filter((msg: message) => msg.messageId !== messageId);
    } else {
      dmObj.messages = dmObj.messages.filter((msg: message) => msg.messageId !== messageId);
    }
  } else {
    messageObj.message = message;
  }

  if (message.length !== 0) checkForTag(messageObj.messageId, oldMsg);
  setData();
  return {};
}

/**
 * Function allows users who have channel owner permission to remove a message
 * with the given message and return empty object.
 * @param token - The token belonging to the user sending the message.
 * @param messageId - The Id belonging to the message which will be removed.
 * @returns a empty object.
 */
function messageRemoveV2(token: string, messageId: number): messageRemove {
  const data = getData();
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (!isMessageIdInMessageValid(messageId)) {
    throw new Error('Input is invalid');
  }

  const { uId, permissionId } = findUserByToken(token);
  const messageObj = findMessageByMessageId(messageId);

  // Error checking
  if (isMessageIdInChannelValid(messageId)) {
    const channelObj = findChannelByMessageId(messageId);
    if (
      messageObj.uId !== uId ||
      !channelObj.allMembers.some((mem: user) => mem.uId === uId) ||
      (!channelObj.ownerMembers.some((mem: user) => mem.uId === uId) && !(channelObj.allMembers.some((mem: user) => mem.uId === uId) && permissionId === 1))
    ) {
      throw new Error('403 Error');
    } else {
      data.messages = data.messages.filter((msg: message) => msg.messageId !== messageId);
      channelObj.messages = channelObj.messages.filter((msg: message) => msg.messageId !== messageId);
    }
  } else {
    const dmObj = findDmByMessageId(messageId);
    if (
      messageObj.uId !== uId ||
      !dmObj.members.some((mem: user) => mem.uId === uId) ||
      (!(dmObj.dmCreator.uId === uId) && !(dmObj.members.some((mem: user) => mem.uId === uId) && permissionId === 1))
    ) {
      throw new Error('403 Error');
    } else {
      data.messages = data.messages.filter((msg: message) => msg.messageId !== messageId);
      dmObj.messages = dmObj.messages.filter((msg: message) => msg.messageId !== messageId);
    }
  }

  updateMsgExist();
  setData();
  return {};
}

/**
 * Function allows users to send a message in a given channel and returns the unique
 * messageId. Function also pushes the message into the dataStore.
 * @param token - The token belonging to the user sending the message.
 * @param dmId - The Id belonging to the dm where the message is sent.
 * @param message - The message sent to the channel.
 * @returns a messageId that is unique to the message sent.
 */
function messageSendDmV2(token: string, dmId: number, message: string): messageSend {
  const data = getData();
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  // Error checking
  if (
    !isDmIdValid(dmId) || message.length < 1 || message.length > 1000
  ) {
    throw new Error('Input is invalid');
  }

  const { uId } = findUserByToken(token);
  const dm = findDmById(dmId);

  if (!dm.members.some((user: user) => user.uId === uId)) throw new Error('403 Error');

  const timeSent = Math.floor(Date.now() / 1000);
  const timeSentMs = Math.floor(Date.now());
  const messageId = Math.floor(Math.random() * 10000);
  const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
  const messageObj = { messageId, uId, message, timeSent, reacts, isPinned: false, timeSentMs, dmId };

  // Push new message object into the channel messages array and
  // global dataStore messages array.
  dm.messages.push(messageObj as message);
  data.messages.push(messageObj as message);

  checkForTag(messageId);
  updateMsgSentStats(uId);
  setData();
  return { messageId };
}

/**
 * Function allows users to send a message in at a specified time in the future
 * @param token - The token belonging to the user sending the message.
 * @param channelId - The Id belonging to the channel where the message will be sent.
 * @param message - The message sent to the channel.
 * @param timeSent - the time when the message shall be sent.
 * @returns a messageId that is unique to the message sent.
 */
function messageSendLaterV1(token: string, channelId: number, message: string, timeSent: number): messageSendLater {
  // Error 400
  if (!isChannelIdValid(channelId)) throw new Error('channelId is invalid');
  else if (Math.floor(Date.now() / 1000) > timeSent) throw new Error('Time set is in the past');
  else if (message.length < 1) throw new Error('Message too short');
  else if (message.length > 1000) throw new Error('Message too long');
  // Error 403
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  const { uId } = findUserByToken(token);
  const channel = findChannelById(channelId);
  const messageId = Math.floor(Math.random() * 10000);

  if (!channel.allMembers.some((user: user) => user.uId === uId)) throw new Error('User not in channel');

  setTimeout(() => helperMessageSend(token, channelId, message, messageId), timeSent * 1000 - Math.floor(Date.now()));

  return { messageId: messageId };
}

/**
 * Function allows users to send a message in at a specified time in the future
 * @param token - The token belonging to the user sending the message.
 * @param dmId - The Id belonging to the dm where the message will be sent.
 * @param message - The message sent to the channel.
 * @param timeSent - the time when the message shall be sent.
 * @returns a messageId that is unique to the message sent.
 */
function messageSendLaterDmV1(token: string, dmId: number, message: string, timeSent: number): messageSendLaterDm {
  // Error 400
  if (!isDmIdValid(dmId)) throw new Error('dmId is invalid');
  else if (Math.floor(Date.now() / 1000) > timeSent) throw new Error('Time set is in the past');
  else if (message.length < 1) throw new Error('Message too short');
  else if (message.length > 1000) throw new Error('Message too long');
  // Error 403
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  const { uId } = findUserByToken(token);
  const dm = findDmById(dmId);
  const messageId = Math.floor(Math.random() * 10000);

  if (!dm.members.some((user: user) => user.uId === uId)) throw new Error('User not in dm');

  setTimeout(() => helperMessageSendDm(token, dmId, message, messageId), timeSent * 1000 - Math.floor(Date.now()));

  return { messageId: messageId };
}

/**
 * Function allows users to react on a message with given
 * messageId and reactId.
 * @param token - The token belonging to the user sending the message.
 * @param messageId - The Id belonging to the message .
 * @param reactId - The reactId that users want to use on the selected message.
 */
function messageReactV1(token: string, messageId: number, reactId: number): messageReact {
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  // Error checking
  if (
    !isMessageIdInMessageValid(messageId) || (reactId !== 1)
  ) {
    throw new Error('Input is invalid');
  }

  const { uId } = findUserByToken(token);
  const messageObj = findMessageByMessageId(messageId);

  if (messageObj.channelId !== undefined) {
    const channelObj = findChannelByMessageId(messageId);
    if (!channelObj.allMembers.some((mem: user) => mem.uId === uId)) throw new Error('User is not in channel');
  } else {
    const dmObj = findDmByMessageId(messageId);
    if (!dmObj.members.some((mem: user) => mem.uId === uId)) throw new Error('User is not in dm');
  }

  const reactObj = findReactbyMessageIdReactId(messageId, reactId);
  if (reactObj.uIds.includes(uId)) {
    throw new Error('Input is invalid');
  } else {
    reactObj.uIds.push(uId);
  }

  notifyMessageReact(uId, messageId);

  setData();
  return {};
}

/**
 * Function allows users to unreact a message that user reacted before with given
 * messageId and reactId.
 * @param token - The token belonging to the user sending the message.
 * @param messageId - The Id belonging to the message .
 * @param reactId - The reactId that users want to use on the selected message.
 * @returns a messageId that is unique to the message sent.
 */
function messageUnreactV1(token: string, messageId: number, reactId: number): messageReact {
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  // Error checking
  if (
    !isMessageIdInMessageValid(messageId) || (reactId !== 1)
  ) {
    throw new Error('Input is invalid');
  }

  const { uId } = findUserByToken(token);
  const messageObj = findMessageByMessageId(messageId);

  if (messageObj.channelId !== undefined) {
    const channelObj = findChannelByMessageId(messageId);
    if (!channelObj.allMembers.some((mem: user) => mem.uId === uId)) throw new Error('Input is invalid');
  } else {
    const dmObj = findDmByMessageId(messageId);
    if (!dmObj.members.some((mem: user) => mem.uId === uId)) throw new Error('Input is invalid');
  }

  const reactObj = findReactbyMessageIdReactId(messageId, reactId);
  if (!reactObj.uIds.includes(uId)) {
    throw new Error('Input is invalid');
  } else {
    reactObj.uIds = reactObj.uIds.filter(Id => Id !== uId);
  }

  setData();
  return {};
}

/**
 * Function allows channel/dm owner to pin a message within the dm/channel with the given
 * messageId.
 * @param token - The token belonging to the user sending the message.
 * @param messageId - The Id belonging to the dm where the message is sent.
 * @returns a messageId that is unique to the message sent.
 */
function messagePinV1(token: string, messageId: number): messagePin {
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  // Error checking
  if (
    !isMessageIdInMessageValid(messageId)
  ) {
    throw new Error('MessageId is invalid');
  }

  const { uId, permissionId } = findUserByToken(token);

  if (isMessageIdInChannelValid(messageId)) {
    const channelObj = findChannelByMessageId(messageId);
    if (!channelObj.allMembers.some((mem: user) => mem.uId === uId)) {
      throw new Error('User is not in channel');
    } else if (!channelObj.ownerMembers.some((mem: user) => mem.uId === uId) && !(channelObj.allMembers.some((mem: user) => mem.uId === uId) && permissionId === 1)) {
      throw new Error('403 Error');
    }
  } else {
    const dmObj = findDmByMessageId(messageId);
    if (!dmObj.members.some((mem: user) => mem.uId === uId)) {
      throw new Error('User is not in dm');
    } else if (!(dmObj.dmCreator.uId === uId) && !(dmObj.members.some((mem: user) => mem.uId === uId) && permissionId === 1)) {
      throw new Error('403 Error');
    }
  }

  const messageObj = findMessageByMessageId(messageId);

  if (messageObj.isPinned === true) {
    throw new Error('Message is already pinned');
  } else {
    messageObj.isPinned = true;
  }

  setData();
  return {};
}

/**
 * Function allows channel/dm owner to pin a message within the dm/channel with the given
 * messageId.
 * @param token - The token belonging to the user sending the message.
 * @param messageId - The Id belonging to the dm where the message is sent.
 * @returns a messageId that is unique to the message sent.
 */
function messageUnpinV1(token: string, messageId: number): messagePin {
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  // Error checking
  if (
    !isMessageIdInMessageValid(messageId)
  ) {
    throw new Error('Input is invalid');
  }

  const { uId, permissionId } = findUserByToken(token);

  if (isMessageIdInChannelValid(messageId)) {
    const channelObj = findChannelByMessageId(messageId);
    if (!channelObj.allMembers.some((mem: user) => mem.uId === uId)) {
      throw new Error('Input is invalid');
    } else if (!channelObj.ownerMembers.some((mem: user) => mem.uId === uId) && !(channelObj.allMembers.some((mem: user) => mem.uId === uId) && permissionId === 1)) {
      throw new Error('403 Error');
    }
  } else {
    const dmObj = findDmByMessageId(messageId);
    if (!dmObj.members.some((mem: user) => mem.uId === uId)) {
      throw new Error('Input is invalid');
    } else if (!(dmObj.dmCreator.uId === uId) && !(dmObj.members.some((mem: user) => mem.uId === uId) && permissionId === 1)) {
      throw new Error('403 Error');
    }
  }

  const messageObj = findMessageByMessageId(messageId);

  if (messageObj.isPinned === false) {
    throw new Error('Input is invalid');
  } else {
    messageObj.isPinned = false;
  }

  setData();
  return {};
}

/**
 * Function allows a message to be shared to another channel/dm with optional message.
 *
 * @param token - The token belonging to the user sending the message.
 * @param ogMessageId - The messageId that is to be shared.
 * @param message - The optional message to be included along with the shared message
 * @param channelId - channelId to be shared to otherwise -1
 * @param channelId - dmId to be shared to otherwise -1
 * @returns a SharedmessageId that is unique to the message shared.
 */
function messageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number): messageShare {
  const data = getData();
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  // Error checking
  if (
    !isMessageIdInMessageValid(ogMessageId) || (!isChannelIdValid(channelId) && !isDmIdValid(dmId)) || (channelId !== -1 && dmId !== -1)
  ) {
    throw new Error('Input is invalid');
  }

  const { uId } = findUserByToken(token);
  const messageId = Math.floor(Math.random() * 10000);
  const ogMessage = findMessageByMessageId(ogMessageId);
  let newMessage = ogMessage.message;
  if (message !== '') {
    newMessage = ogMessage.message.concat(': ', message);
  }

  if (newMessage.length > 1000) {
    throw new Error('Input is invalid');
  }

  if (dmId === -1) {
    if (isMessageIdInChannelValid(ogMessageId)) {
      const channelObj = findChannelByMessageId(ogMessageId);
      const sharedChannel = findChannelById(channelId);
      if (!channelObj.allMembers.some((mem: user) => mem.uId === uId)) {
        throw new Error('Input is invalid');
      } else if (!sharedChannel.allMembers.some((mem: user) => mem.uId === uId)) {
        throw new Error('403 Error');
      } else {
        const timeSent = Math.floor(Date.now() / 1000);
        const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
        const messageObj = { messageId, uId, message: newMessage, timeSent, reacts, isPinned: false, channelId };
        sharedChannel.messages.push(messageObj as message);
        data.messages.push(messageObj as message);
      }
    } else {
      const dmObj = findDmByMessageId(ogMessageId);
      const sharedChannel = findChannelById(channelId);
      if (!dmObj.members.some((mem: user) => mem.uId === uId)) {
        throw new Error('Input is invalid');
      } else if (!sharedChannel.allMembers.some((mem: user) => mem.uId === uId)) {
        throw new Error('403 Error');
      } else {
        const timeSent = Math.floor(Date.now() / 1000);
        const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
        const messageObj = { messageId, uId, message: newMessage, timeSent, reacts, isPinned: false, channelId };
        sharedChannel.messages.push(messageObj as message);
        data.messages.push(messageObj as message);
      }
    }
  } else {
    if (isMessageIdInChannelValid(ogMessageId)) {
      const channelObj = findChannelByMessageId(ogMessageId);
      const sharedDm = findDmById(dmId);
      if (!channelObj.allMembers.some((mem: user) => mem.uId === uId)) {
        throw new Error('Input is invalid');
      } else if (!sharedDm.members.some((mem: user) => mem.uId === uId)) {
        throw new Error('403 Error');
      } else {
        const timeSent = Math.floor(Date.now() / 1000);
        const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
        const messageObj = { messageId, uId, message: newMessage, timeSent, reacts, isPinned: false, dmId };
        sharedDm.messages.push(messageObj as message);
        data.messages.push(messageObj as message);
      }
    } else {
      const dmObj = findDmByMessageId(ogMessageId);
      const sharedDm = findDmById(dmId);
      if (!dmObj.members.some((mem: user) => mem.uId === uId)) {
        throw new Error('Input is invalid');
      } else if (!sharedDm.members.some((mem: user) => mem.uId === uId)) {
        throw new Error('403 Error');
      } else {
        const timeSent = Math.floor(Date.now() / 1000);
        const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
        const messageObj = { messageId, uId, message: newMessage, timeSent, reacts, isPinned: false, dmId };
        sharedDm.messages.push(messageObj as message);
        data.messages.push(messageObj as message);
      }
    }
  }

  checkForTag(messageId);
  setData();
  return { sharedMessageId: messageId };
}

export { messageShareV1, messageUnpinV1, messagePinV1, messageUnreactV1, messageReactV1, messageSendV2, messageEditV2, messageRemoveV2, messageSendDmV2, messageSendLaterV1, messageSendLaterDmV1 };
