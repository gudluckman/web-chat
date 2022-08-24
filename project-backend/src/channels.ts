import { channel, getData, setData, user } from './dataStore';
import { isTokenValid } from './utils/auth.util';
import { getHashOf } from './utils/encrypt.util';
import { findUserByToken } from './utils/find.util';
import { updateChannelsJoinedStats } from './utils/user.util';

type channelsCreate = { channelId: number };
type channelsList = { channels: channel[] };
type channelsListall = { channels: channel[] };
/**
 * This function will take in an userID and list out all the channels that the user is part of.
 * It will go through all channels in the dataStore and check all members in the 'allmember' array,
 * if the Id is matched, the object of that channel will be added into the array and once all channels
 * have been looped through it will return the array.
 * @param token - token string for current session.
 * @returns An object contianing { channels: [{ channelId, name }]} or { channels: [] } if
 * a user does not belong to any channels.
 */
function channelsListV3(token: string): channelsList {
  const data = getData();

  if (!isTokenValid(token)) throw new Error('Token is invalid');

  const channels = data.channels.filter((channel: channel) => channel.allMembers.some((user: user) => user.uId === findUserByToken(token).uId));

  return {
    channels: channels.map((channel: channel) => ({
      channelId: channel.channelId,
      name: channel.name
    }))
  };
}

/**
 * This function will take in an userID and list out all the channels as long as the user is an
 * authorised user.
 * If the Id is matched, all channels including private will be added into the array and return
 * as an array of object.
 * If Id is not matched, simply return an empty array.
 * @param token - token string for current session.
 * @returns {Object} An object containing [{ channelId: Number, name: string}], but if no match
 * it will return an empty array [].
 */

function channelsListallV3(token: string): channelsListall {
  const data = getData();
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  return {
    channels: data.channels.map((channel: channel) => ({
      channelId: channel.channelId,
      name: channel.name
    }))
  };
}

/**
 * Creates a new channel with given name and type that is either public or private channel.
 * Returns an object containing channelId.
 * @param {String} token - token of the session the user is logged in to.
 * @param {String} name - name of the channel to create.
 * @param {Boolean} isPublic - indication of the new channel whether it is a public or private channel.
 * @returns {Object} An object containing { channelId: Number }, but if an error occurs.
 * then return an object containing { error: 'error' }.
 */
function channelsCreateV3(token: string, name: string, isPublic: boolean): channelsCreate {
  const data = getData();
  // Error checking
  if (name.length < 1 || name.length > 20) throw new Error('Input is invalid');
  if (!isTokenValid(token)) {
    throw new Error('Token is invalid');
  }
  // Setting the channelId based on previous channelId's to ensure unique ID
  let id = 100;
  id = data.channels.length + id;

  const user = data.users.filter((user: user) => user.tokens.some((tok) => getHashOf(tok) === token)).map(
    (user: user) => ({
      uId: user.uId,
      email: user.email,
      nameFirst: user.nameFirst,
      nameLast: user.nameLast,
      handleStr: user.handleStr,
      profileImgUrl: user.profileImgUrl
    })
  );

  // Creating the object for each channel
  const channel: channel = {
    channelId: id + 1,
    name: name,
    isPublic: isPublic,
    messages: [],
    ownerMembers: user,
    allMembers: [...user],
    standupActive: false,
    standupFinish: -1,
    standupMessage: '',
    standupUser: -1
  };

  data.channels.push(channel);

  updateChannelsJoinedStats(findUserByToken(token).uId);
  setData();
  return { channelId: channel.channelId };
}

export { channelsCreateV3, channelsListV3, channelsListallV3 };
