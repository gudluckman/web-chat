import { setData, channel, getData, react } from '../dataStore';
import { messageSendV2 } from '../message';
import { findChannelById, findDmById, findUserByToken } from './find.util';
import { checkForTag } from './notifications.util';
import { updateMsgSentStats } from './user.util';

// this helper function updates properties of a particular channel in which
// a standup has just finished
export function standupOver(token: string, channel: channel) {
  channel.standupActive = false;
  if (channel.standupMessage !== '') {
    messageSendV2(token, channel.channelId, channel.standupMessage);
    channel.standupMessage = '';
  }
  channel.standupFinish = -1;
  channel.standupUser = -1;

  setData();
}

// this helper function sends a message after a specified amount of time
// by the messageSendLater function
export function helperMessageSend(token: string, channelId: number, message: string, messageId: number) {
  const data = getData();

  const { uId } = findUserByToken(token);
  const channel = findChannelById(channelId);

  const timeSent = Math.floor(Date.now() / 1000);
  const timeSentMs = Math.floor(Date.now());
  const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
  const messageObj = { messageId, uId, message, timeSent, reacts, isPinned: false, timeSentMs, channelId };

  // Push new message object into the channel messages array and
  // global dataStore messages array.
  channel.messages.push(messageObj);
  data.messages.push(messageObj);

  checkForTag(messageId);
  updateMsgSentStats(uId);
  setData();
}

// this helper function sends a message after a specified amount of time
// by the messageSendLaterDm function
export function helperMessageSendDm(token: string, dmId: number, message: string, messageId: number) {
  const data = getData();

  const { uId } = findUserByToken(token);
  const dm = findDmById(dmId);

  const timeSent = Math.floor(Date.now() / 1000);
  const timeSentMs = Math.floor(Date.now());
  const reacts = [{ reactId: 1, uIds: [], isThisUserReacted: false }] as react[];
  const messageObj = { messageId, uId, message, timeSent, reacts, isPinned: false, timeSentMs, dmId };

  // Push new message object into the channel messages array and
  // global dataStore messages array.
  if (dm !== undefined) {
    dm.messages.push(messageObj);
    data.messages.push(messageObj);

    checkForTag(messageId);
    updateMsgSentStats(uId);  
  }
  setData();
}