import { setData } from "../dataStore";
import { findChannelById, findChannelByMessageId, findDmById, findDmByMessageId, findMessageByMessageId, findUserById } from "./find.util";

export function notifyDmAdded(authUserId: number, uId: number, dmId: number) {
  const authUser = findUserById(authUserId);
  const { notifications } = findUserById(uId);
  const { name } = findDmById(dmId);

  const notification = {
    channelId: -1,
    dmId,
    notificationMessage: `${authUser.handleStr} added you to ${name}`
  }

  notifications.push(notification);

  setData();
}

/**
 * Notifies a user that they have been invited to a channel.
 * @param authUserId - user that invited the notified user into a channel.
 * @param uId - user to be invitied to the channel.
 * @param channelId - channel where the invitation occured.
 */
export function notifyChannelAdded(authUserId: number, uId: number, channelId: number) {
  const authUser = findUserById(authUserId);
  const { notifications } = findUserById(uId);
  const { name } = findChannelById(channelId);

  const notification = {
    channelId,
    dmId: -1,
    notificationMessage: `${authUser.handleStr} added you to ${name}`
  }

  notifications.push(notification);

  setData();
}

/**
 * Function notifies a user that their message have been reacted to.
 * @param authUserId - User reacting to a message.
 * @param messageId - Message being reacted to.
 */
export function notifyMessageReact(authUserId: number, messageId: number) {
  const authUser = findUserById(authUserId);
  const message = findMessageByMessageId(messageId);
  const { notifications } = findUserById(message.uId);

  const notification = {
    channelId: -1,
    dmId: -1,
    notificationMessage: `${authUser.handleStr} reacted to your message in `
  }

  if (message.channelId === undefined) {
    if (findDmByMessageId(messageId).members.some(mem => mem.uId === message.uId)) {
      notification.dmId = message.dmId;
      notification.notificationMessage = notification.notificationMessage + `${findDmById(message.dmId).name}`;
      notifications.push(notification);
    }
  } else {
    if (findChannelByMessageId(messageId).allMembers.some(mem => mem.uId === message.uId)) {
      notification.channelId = message.channelId;
      notification.notificationMessage = notification.notificationMessage + `${findChannelById(message.channelId).name}`;
      notifications.push(notification);
    }
  }
  
  setData();
}

/**
 * Function notifies a user that they have been tagged.
 * @param taggerId - The user sending the message with a tag.
 * @param taggedId - The user being tagged in the message.
 * @param messageId - The message where tagging occured.
 */
export function notifyTagging(taggerId: number, taggedId: number, messageId: number) {
  const tagger = findUserById(taggerId);
  const message = findMessageByMessageId(messageId);
  const { notifications } = findUserById(taggedId);

  const notification = {
    channelId: -1,
    dmId: -1,
    notificationMessage: `${tagger.handleStr} tagged you in `
  }

  if (message.channelId === undefined) {
    notification.dmId = message.dmId;
    notification.notificationMessage = notification.notificationMessage + `${findDmById(message.dmId).name}: ` + `${message.message.slice(0, 20)}`;
  } else {
    notification.channelId = message.channelId;
    notification.notificationMessage = notification.notificationMessage + `${findChannelById(message.channelId).name}: ` + `${message.message.slice(0, 20)}`;
  }
  
  notifications.push(notification);
}

/**
 * Function checks if a message contains a tag.
 * @param messageId - Message which may contain a tag.
 * @param oldMessage - Original message if the message was called in message/edit.
 */
export function checkForTag(messageId: number, oldMessage?: string) {
  const message = findMessageByMessageId(messageId);

  const messageArr = message.message.split(/[^a-z\d]/gmi);

  let users: string[] = [];

  messageArr.forEach((str, index) => {
    if (message.message.includes('@' + str)) {
      users.push(messageArr[index]);
    }
  });

  const userSet = new Set(users);
  users = Array.from(userSet);

  // To Account for message edit, if the same user is tagged again.
  if (oldMessage !== undefined) {
    const oldMessageArr = oldMessage.split(/[^a-z\d]/gmi);
    let oldUsers: string[] = [];

    oldMessageArr.forEach((str, index) => {
      if (oldMessage.includes('@' + str)) {
        oldUsers.push(oldMessageArr[index]);
      }
    });

    const oldUserSet = new Set(oldUsers);
    users = users.filter((user) => !oldUserSet.has(user));
  }

  // Check if message is in dm or channel.
  if (message.channelId !== undefined) {
    const channel = findChannelByMessageId(messageId);
    // Check if person tagged is in the channel, then notify each user that is tagged in the message.
    const membersTagged = channel.allMembers.filter((mem) => users.some((user) => mem.handleStr === user));
   if (membersTagged.length !== 0) {
    membersTagged.forEach((mem) => {
      notifyTagging(message.uId, mem.uId, messageId);
    });
   }
  } else {
    const dm = findDmByMessageId(messageId);
    const membersTagged = dm.members.filter((mem) => users.some((user) => mem.handleStr === user));
   if (membersTagged.length !== 0) {
    membersTagged.forEach((mem) => {
      notifyTagging(message.uId, mem.uId, messageId);
    });
   }
  }
}

