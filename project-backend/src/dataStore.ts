import fs from 'fs';

export interface userStats {
  channelsJoined: { numChannelsJoined: number, timeStamp: number }[],
  dmsJoined: { numDmsJoined: number, timeStamp: number }[],
  messagesSent: { numMessagesSent: number, timeStamp: number}[],
  involvementRate: number
}

export interface workspaceStats {
  channelsExist: { numChannelsExist: number, timeStamp: number }[],
  dmsExist: { numDmsExist: number, timeStamp: number }[],
  messagesExist: { numMessagesExist: number, timeStamp: number}[],
  utilizationRate: number
}

export interface notification {
  channelId: number,
  dmId: number,
  notificationMessage: string
}

export interface user {
  uId: number,
  email: string,
  nameFirst: string,
  nameLast: string,
  profileImgUrl: string,
  password?: string,
  permissionId?: number,
  handleStr: string,
  tokens?: string[],
  resetCodes?: string[],
  stats?: userStats,
  isRemoved?: boolean,
  notifications?: notification[]
}

export interface react {
  reactId: number,
  uIds: number[],
  isThisUserReacted: boolean
  isRemoved?: boolean
}

export interface message {
  dmId?: number,
  channelId?: number,
  messageId: number,
  uId: number,
  message: string,
  timeSent: number,
  timeSentMs?: number,
  reacts: react[],
  isPinned: boolean,
}

export interface channel {
  channelId: number,
  name: string,
  isPublic?: boolean,
  messages?: message[],
  ownerMembers?: user[],
  allMembers?: user[],
  standupActive?: boolean,
  standupFinish?: number,
  standupMessage?: string,
  standupUser?: number,
}

export interface dm {
  dmId: number,
  name: string,
  messages?: message[],
  members?: user[],
  dmCreator?: user
}

export interface dataStore {
  users: user[],
  channels: channel[],
  messages: message[],
  dms: dm[],
}

export interface workspace {
  users: user[],
  channels: channel[],
  messages: message[],
  dms: dm[],
  stats: workspaceStats | Record<string, never>
}

let data: workspace = {
  users: [],
  channels: [],
  messages: [],
  dms: [],
  stats: {}
};

const filename = 'data.json';

/**
 * Function that reads data.json to obtain data.
 * @returns the data object containing users and channels data.
 */
function getData() {
  if (fs.readdirSync('./').includes(filename)) {
    data = JSON.parse(String(fs.readFileSync(`./${filename}`)));
  }
  return data;
}

/**
 * Function writes into an existing or new file with the current data.
 */
function setData() {
  fs.writeFileSync(`./src/${filename}`, JSON.stringify(data, null, 2));
}

/**
 * Deletes the existing data.json file in the src directory.
 */
function clearData() {
  fs.unlinkSync(`./src/${filename}`);
  const filenames = fs.readdirSync('./src/uploads');
  for (const file of filenames) {
    if (file !== 'defaultProfileImg.jpg') {
      fs.unlinkSync(`./src/uploads/${file}`);
    }
  }
}

export { getData, setData, clearData };
