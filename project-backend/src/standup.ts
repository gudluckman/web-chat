import { setData, user } from './dataStore';
import { isChannelIdValid, isTokenValid } from './utils/auth.util';
import { findChannelById, findUserByToken } from './utils/find.util';
import { standupOver } from './utils/timeout.util';

type standupStart = { timeFinish: number };
type standupActive = { isActive: boolean, timeFinish: number };
type standupSend = Record<string, never>;

function standupStartV1(token: string, channelId: number, length: number): standupStart {
  // error checking
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (!isChannelIdValid(channelId)) throw new Error('Invalid channelId');
  if (length < 0) throw new Error('Length is invalid');

  const { uId } = findUserByToken(token);
  const channel = findChannelById(channelId);

  if (!channel.allMembers.some((user: user) => user.uId === uId)) throw new Error('User not in channel');
  if (channel.standupActive) throw new Error('Standup already taking place');

  channel.standupActive = true;
  channel.standupFinish = Math.floor((Date.now() / 1000) + length);
  channel.standupMessage = '';
  channel.standupUser = uId;

  setTimeout(() => standupOver(token, channel), length * 1000);

  setData();
  return { timeFinish: channel.standupFinish };
}

function standupActiveV1(token: string, channelId: number): standupActive {
  // error checking
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (!isChannelIdValid(channelId)) throw new Error('Invalid channelId');

  const { uId } = findUserByToken(token);
  const channel = findChannelById(channelId);

  if (!channel.allMembers.some((user: user) => user.uId === uId)) throw new Error('User not in channel');

  if (channel.standupActive === true) return { isActive: true, timeFinish: channel.standupFinish };

  return { isActive: false, timeFinish: null };
}

function standupSendV1(token: string, channelId: number, message: string): standupSend {
  // error checking
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (!isChannelIdValid(channelId)) throw new Error('Invalid channelId');
  if (message.length > 1000) throw new Error('Length is invalid');

  const { uId, handleStr } = findUserByToken(token);
  const channel = findChannelById(channelId);

  if (!channel.allMembers.some((user: user) => user.uId === uId)) throw new Error('User not in channel');
  if (channel.standupActive === false) throw new Error('Standup not taking place');

  if (channel.standupMessage.length !== 0) {
    channel.standupMessage += '\n';
  }
  channel.standupMessage += `${handleStr}: ${message}`;

  setData();
  return {};
}

export { standupStartV1, standupActiveV1, standupSendV1 };
