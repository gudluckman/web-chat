import { getData, setData } from '../dataStore';
import { findUserById } from './find.util';

/**
 * Updates a user's handleStr in channel and dms.
 * @param uId - uId of the user with handleStr to update
 * @param handleStr - new handleStr to update
 */
export function updateHandleStr(uId: number, handleStr: string) {
  const data = getData();

  for (const channel of data.channels) {
    channel.allMembers.find((user) => user.uId === uId).handleStr = handleStr;
    channel.ownerMembers.find((user) => user.uId === uId).handleStr = handleStr;
  }

  for (const dm of data.dms) {
    dm.members.find((user) => user.uId === uId).handleStr = handleStr;
    if (dm.dmCreator.uId === uId) {
      dm.dmCreator.handleStr = handleStr;
    }
  }

  setData();
}

/**
 * Updates first name and last name in channels and dms.
 * @param uId - user with uId to have their name changed.
 * @param nameFirst - new first name.
 * @param nameLast - new last name.
 */
export function updateName(uId: number, nameFirst: string, nameLast: string) {
  const data = getData();

  for (const channel of data.channels) {
    channel.allMembers.find((user) => user.uId === uId).nameFirst = nameFirst;
    channel.allMembers.find((user) => user.uId === uId).nameLast = nameLast;
    channel.ownerMembers.find((user) => user.uId === uId).nameFirst = nameFirst;
    channel.ownerMembers.find((user) => user.uId === uId).nameLast = nameLast;
  }

  for (const dm of data.dms) {
    dm.members.find((user) => user.uId === uId).nameFirst = nameFirst;
    dm.members.find((user) => user.uId === uId).nameLast = nameLast;
    if (dm.dmCreator.uId === uId) {
      dm.dmCreator.nameFirst = nameFirst;
      dm.dmCreator.nameLast = nameLast;
    }
  }

  setData();
}

/**
<<<<<<< HEAD
 * Function updates the number of channels the user have joined.
 * @param uId - uId of the user with stats to be updated.
 */
export function updateChannelsJoinedStats(uId: number) {
  const data = getData();
  const { stats } = findUserById(uId);

  const timeStamp = Math.floor(Date.now() / 1000);

  stats.channelsJoined.push({numChannelsJoined: data.channels.filter((channel) => channel.allMembers.some((user) => user.uId === uId)).length, timeStamp});

  updateChannelsExist();
  setData();
}

/**
 * Function updates the number of dms the user have joined.
 * @param uId - uId of the user with stats to be updated.
 */
export function updateDmsJoinedStats(uId: number) {
  const data = getData();
  const { stats } = findUserById(uId);

  const timeStamp = Math.floor(Date.now() / 1000);

  stats.dmsJoined.push({numDmsJoined: data.dms.filter((dm) => dm.members.some((user) => user.uId === uId)).length, timeStamp});

  setData();
}

/**
 * Function updates the number of messages sent by the user.
 * @param uId - uId of the user with stats to be updated.
 */
export function updateMsgSentStats(uId: number) {
  const { stats } = findUserById(uId);

  const timeStamp = Math.floor(Date.now() / 1000);
  const totalNumOfMessagesSent = stats.messagesSent.length;
  stats.messagesSent.push({numMessagesSent: totalNumOfMessagesSent, timeStamp});

  updateMsgExist();
  setData();
}

/**
 * Function udpates the number of messages in workspace stats.
 */
export function updateMsgExist() {
  const data = getData();

  const timeStamp = Math.floor(Date.now() / 1000);
  data.stats.messagesExist.push({numMessagesExist: data.messages.length, timeStamp});

  setData();
}

/**
 * Function updates the number of channels in workspace stats.
 */
export function updateChannelsExist() {
  const data = getData();

  const timeStamp = Math.floor(Date.now() / 1000);
  data.stats.channelsExist.push({numChannelsExist: data.channels.length, timeStamp});

  setData();
}

/**
 * Function updates the number of dms in workspace stats.
 */
export function updateDmsExist() {
  const data = getData();

  const timeStamp = Math.floor(Date.now() / 1000);
  data.stats.dmsExist.push({numDmsExist: data.dms.length, timeStamp});

  setData();
}

/** 
 * Updates user's permissionId in channels and dms.
 * @param uId - user with uId to have their permissions changed.
 * @param permissionId - new permissionId.
 */
 export function updatePermissionId(uId: number, permissionId: number) {
  const data = getData();

  for (const channel of data.channels) {
    channel.allMembers.find((user) => user.uId === uId).permissionId = permissionId;
    channel.ownerMembers.find((user) => user.uId === uId).permissionId = permissionId;
  }

  for (const dm of data.dms) {
    dm.members.find((user) => user.uId === uId).permissionId = permissionId;
    if (dm.dmCreator.uId === uId) {
      dm.dmCreator.permissionId = permissionId;
    }
  }

  setData();
}

/**
 * Updates a user's profileImg in channel and dms.
 * @param uId - uId of the user with profileImgUrl to update
 * @param profileImgUrl - new profileImgUrl to update
 */
 export function updateProfileImgUrl(uId: number, profileImgUrl: string) {
  const data = getData();

  for (const channel of data.channels) {
    channel.allMembers.find((user) => user.uId === uId).profileImgUrl = profileImgUrl;
    channel.ownerMembers.find((user) => user.uId === uId).profileImgUrl = profileImgUrl;
  }

  for (const dm of data.dms) {
    dm.members.find((user) => user.uId === uId).profileImgUrl = profileImgUrl;
    if (dm.dmCreator.uId === uId) {
      dm.dmCreator.profileImgUrl = profileImgUrl;
    }
  }

  setData();
}
