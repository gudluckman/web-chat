import express from 'express';
import { echo } from './echo';
import morgan from 'morgan';
import { LOCAL_PORT } from './config/server.config';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import { channelDetailsV3, channelJoinV3, channelLeaveV2, channelInviteV3, channelMessagesV3, channelAddOwnerV2, channelRemoveOwnerV2 } from './channel';
import { channelsCreateV3, channelsListV3, channelsListallV3 } from './channels';
import { userProfileSetHandleV1, userProfileV2, usersAllV1, userProfileSetEmailV1, userProfileSetNameV1, userStatsV1, usersStatsV1, userProfileUploadPhotoV1 } from './users';
import { authRegisterV3, authLoginV2, authLogoutV2, authRequestPasswordResetV1, authPasswordResetV1 } from './auth';
import { clearV1 } from './other';
import { messageShareV1, messageUnpinV1, messagePinV1, messageUnreactV1, messageReactV1, messageSendV2, messageEditV2, messageRemoveV2, messageSendDmV2, messageSendLaterV1, messageSendLaterDmV1 } from './message';
import { dmCreateV2, dmRemoveV2, dmLeaveV2, dmMessagesV2, dmDetailsV2, dmListV2 } from './dm';
import { adminUserRemoveV1, adminUserPermissionChangeV1 } from './admin';
import HTTPError from 'http-errors';
import { standupStartV1, standupActiveV1, standupSendV1 } from './standup';
import { searchV1 } from './search';
import { getNotificationsV1 } from './notifications';
import { clearError, isErrorExist } from './utils/error.util';

// Set up web app, use JSON
const app = express();
app.use(express.json());
app.use(express.static('./src/uploads'));

// Use middleware that allows for access from other domains
app.use(cors());

// for logging errors
app.use(morgan('dev'));

const PORT: number = parseInt(process.env.PORT || LOCAL_PORT);
const HOST: string = process.env.IP || 'localhost';

// Example get request
app.get('/echo', (req, res, next) => {
  try {
    const data = req.query.echo as string;
    return res.json(echo(data));
  } catch (err) {
    next(err);
  }
});

app.post('/message/share/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { ogMessageId, message, channelId, dmId } = req.body;
    res.json(messageShareV1(token, ogMessageId, message, channelId, dmId));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === '403 Error') {
      throw HTTPError(403, '403 Error');
    } else {
      throw HTTPError(400, '400 Error');
    }
  }
});

app.post('/message/unpin/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { messageId } = req.body;
    res.json(messageUnpinV1(token, messageId));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === '403 Error') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

app.post('/message/pin/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { messageId } = req.body;
    res.json(messagePinV1(token, messageId));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === '403 Error') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

app.post('/message/unreact/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { messageId, reactId } = req.body;
    res.json(messageUnreactV1(token, messageId, reactId));
  } catch (error) {
    if (error.message === 'Token is invalid') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

app.post('/message/react/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { messageId, reactId } = req.body;
    res.json(messageReactV1(token, messageId, reactId));
  } catch (error) {
    if (error.message === 'Token is invalid') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// send dm messages
app.post('/message/senddm/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { dmId, message } = req.body;
    res.json(messageSendDmV2(token, dmId, message));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === '403 Error') {
      throw HTTPError(403, error);
    } else if (error.message === 'Input is invalid') {
      throw HTTPError(400, error);
    }
  }
});

// removing message
app.delete('/message/remove/v2', (req, res) => {
  try {
    const token = req.header('token');
    const messageId = parseInt(req.query.messageId as string);
    res.json(messageRemoveV2(token, messageId));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === '403 Error') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// send channel messages
app.post('/message/send/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId, message } = req.body;
    res.json(messageSendV2(token, channelId, message));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === '403 Error') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// Edit a message
app.put('/message/edit/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { messageId, message } = req.body;
    res.json(messageEditV2(token, messageId, message));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === '403 Error') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// send a message later at a specified time
app.post('/message/sendlater/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId, message, timeSent } = req.body;
    res.json(messageSendLaterV1(token, channelId, message, timeSent));
  } catch (error) {
    if (error.message === 'Token is invalid' ||
    error.message === 'User not in channel') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// send a dm later at a specified time
app.post('/message/sendlaterdm/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { dmId, message, timeSent } = req.body;
    res.json(messageSendLaterDmV1(token, dmId, message, timeSent));
  } catch (error) {
    if (error.message === 'Token is invalid' ||
    error.message === 'User not in dm') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// for creating new channel
app.post('/channels/create/v3', (req, res) => {
  try {
    const { name, isPublic } = req.body;
    const token = req.header('token');
    res.json(channelsCreateV3(token, name, isPublic));
  } catch (error) {
    if (error.message === 'Token is invalid') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// List out all channels under the user
app.get('/channels/list/v3', (req, res) => {
  try {
    const token = req.header('token');
    res.json(channelsListV3(token));
  } catch (error) {
    if (error.message === 'Token is invalid') {
      throw HTTPError(403, error);
    }
  }
});

// List out all channels
app.get('/channels/listall/v3', (req, res) => {
  try {
    const token = req.header('token');
    res.json(channelsListallV3(token));
  } catch (error) {
    if (error.message === 'Token is invalid') {
      throw HTTPError(403, error);
    }
  }
});

// for joining channel
app.post('/channel/join/v3', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId } = req.body;
    res.json(channelJoinV3(token, channelId));
  } catch (error) {
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Invalid token'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for inviting to a channel
app.post('/channel/invite/v3', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId, uId } = req.body;
    res.json(channelInviteV3(token, channelId, uId));
  } catch (error) {
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Invalid token'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for leaving channel
app.post('/channel/leave/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId } = req.body;
    res.json(channelLeaveV2(token, channelId));
  } catch (error) {
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Invalid token'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for getting channel details
app.get('/channel/details/v3', (req, res) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.query.channelId as string);
    res.json(channelDetailsV3(token, channelId));
  } catch (error) {
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Invalid token'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for getting channel messages
app.get('/channel/messages/v3', (req, res) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.query.channelId as string);
    const start = parseInt(req.query.start as string);
    res.json(channelMessagesV3(token, channelId, start));
  } catch (error) {
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Invalid token'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for adding new channel owner
app.post('/channel/addowner/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId, uId } = req.body;
    res.json(channelAddOwnerV2(token, channelId, uId));
  } catch (error) {
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Invalid token'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for removing channel owner
app.post('/channel/removeowner/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId, uId } = req.body;
    res.json(channelRemoveOwnerV2(token, channelId, uId));
  } catch (error) {
    console.log(error.message);
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Invalid token'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for getting user details
app.get('/user/profile/v3', (req, res) => {
  try {
    const token = req.header('token');
    const uId = parseInt(req.query.uId as string);

    res.json(userProfileV2(token, uId));
  } catch (error) {
    if (error.message === 'Invalid token') throw HTTPError(403, error);
    throw HTTPError(400, error);
  }
});

// for setting new handleStr
app.put('/user/profile/sethandle/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { handleStr } = req.body;
    res.json(userProfileSetHandleV1(token, handleStr));
  } catch (error) {
    if (error.message === 'Invalid token') throw HTTPError(403, error);
    throw HTTPError(400, error);
  }
});

// for updating user's first and last name
app.put('/user/profile/setname/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { nameFirst, nameLast } = req.body;
    res.json(userProfileSetNameV1(token, nameFirst, nameLast));
  } catch (error) {
    if (error.message === 'Invalid token') throw HTTPError(403, error);
    throw HTTPError(400, error);
  }
});

// for updating user's email
app.put('/user/profile/setemail/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { email } = req.body;
    res.json(userProfileSetEmailV1(token, email));
  } catch (error) {
    if (error.message === 'Invalid token') throw HTTPError(403, error);
    throw HTTPError(400, error);
  }
});

// for uploading profile photo
app.post('/user/profile/uploadphoto/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { imgUrl, xStart, yStart, xEnd, yEnd } = req.body;
    userProfileUploadPhotoV1(token, imgUrl, xStart, yStart, xEnd, yEnd);

    if (isErrorExist) throw new Error('An error occurred');
    clearError();
    res.json({});
  } catch (error) {
    if (error.message === 'Invalid token') throw HTTPError(403, error);
    throw HTTPError(400, error);
  }
});

// for getting user stats
app.get('/user/stats/v1', (req, res) => {
  try {
    const token = req.header('token');
    res.json(userStatsV1(token));
  } catch (error) {
    throw HTTPError(403, error);
  }
});

// for getting workspace stats
app.get('/users/stats/v1', (req, res) => {
  try {
    const token = req.header('token');
    res.json(usersStatsV1(token));
  } catch (error) {
    throw HTTPError(403, error);
  }
});

// for listing all user details
app.get('/users/all/v2', (req, res) => {
  try {
    const token = req.header('token');
    res.json(usersAllV1(token));
  } catch (error) {
    throw HTTPError(403, error);
  }
});
// for registering a new user
app.post('/auth/register/v3', (req, res) => {
  // For PUT/POST requests, data is transfered through the JSON body
  try {
    const { email, password, nameFirst, nameLast } = req.body;
    res.json(authRegisterV3(email, password, nameFirst, nameLast));
  } catch (error) {
    console.log(error);
    throw HTTPError(400, error);
  }
});

// for user to log in
app.post('/auth/login/v3', (req, res) => {
  try {
    const { email, password } = req.body;
    res.json(authLoginV2(email, password));
  } catch (error) {
    throw HTTPError(400, error);
  }
});

// for user to log out
app.post('/auth/logout/v2', (req, res) => {
  try {
    const token = req.header('token');
    res.json(authLogoutV2(token));
  } catch (error) {
    throw HTTPError(403, error);
  }
});

// for requesting password reset
app.post('/auth/passwordreset/request/v1', (req, res) => {
  const { email } = req.body;
  res.json(authRequestPasswordResetV1(email));
});

// for resetting password
app.post('/auth/passwordreset/reset/v1', (req, res) => {
  try {
    const { resetCode, newPassword } = req.body;
    res.json(authPasswordResetV1(resetCode, newPassword));
  } catch (error) {
    throw HTTPError(400, error);
  }
});

// Resets data
app.delete('/clear/v1', (req, res) => {
  clearV1();
  res.json({});
});

// for getting dm details
app.get('/dm/details/v2', (req, res) => {
  try {
    const token = req.header('token');
    const dmId = parseInt(req.query.dmId as string);
    res.json(dmDetailsV2(token, dmId));
  } catch (error) {
    if (error.message === 'Token is invalid' ||
    error.message === 'User is not in dm') {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for creating a new dm
app.post('/dm/create/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { uIds } = req.body;
    res.json(dmCreateV2(token, uIds));
  } catch (error) {
    if (error.message === 'Token is invalid') {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for listing out all dms under the user
app.get('/dm/list/v2', (req, res) => {
  try {
    const token = req.header('token');
    res.json(dmListV2(token));
  } catch (error) {
    throw HTTPError(403, error);
  }
});

// for removing a dm
app.delete('/dm/remove/v2', (req, res) => {
  try {
    const token = req.header('token');
    const dmId = parseInt(req.query.dmId as string);
    res.json(dmRemoveV2(token, dmId));
  } catch (error) {
    if (error.message === 'dmId is invalid') {
      throw HTTPError(400, error);
    }
    throw HTTPError(403, error);
  }
});

// for user leaving a dm
app.post('/dm/leave/v2', (req, res) => {
  try {
    const token = req.header('token');
    const { dmId } = req.body;
    res.json(dmLeaveV2(token, dmId));
  } catch (error) {
    if (error.message === 'Token is invalid' ||
    error.message === 'User is not in dm') {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for listing messages in a dm
app.get('/dm/messages/v2', (req, res) => {
  try {
    const token = req.header('token');
    const dmId = parseInt(req.query.dmId as string);
    const start = parseInt(req.query.start as string);
    res.json(dmMessagesV2(token, dmId, start));
  } catch (error) {
    if (error.message === 'Token is invalid' ||
    error.message === 'User is not in dm') {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for starting a standup
app.post('/standup/start/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId, length } = req.body;
    res.json(standupStartV1(token, channelId, length));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === 'User not in channel') {
      throw HTTPError(403, '403 Error');
    }
    throw HTTPError(400, error);
  }
});

// for checking whether a standup is active within a channel
app.get('/standup/active/v1', (req, res) => {
  try {
    const token = req.header('token');
    const channelId = parseInt(req.query.channelId as string);
    res.json(standupActiveV1(token, channelId));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === 'User not in channel') {
      throw HTTPError(403, '403 Error');
    } else {
      throw HTTPError(400, error);
    }
  }
});

// for sneding messages during a standup
app.post('/standup/send/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { channelId, message } = req.body;
    res.json(standupSendV1(token, channelId, message));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === 'User not in channel') {
      throw HTTPError(403, '403 Error');
    }
    throw HTTPError(400, error);
  }
});

// for getting notifications
app.get('/notifications/get/v1', (req, res) => {
  try {
    const token = req.header('token');
    res.json(getNotificationsV1(token));
  } catch (error) {
    throw HTTPError(403, error);
  }
});

// To list out all messages searched by user
app.get('/search/v1', (req, res) => {
  try {
    const token = req.header('token');
    const queryStr = req.query.queryStr as string;
    res.json(searchV1(token, queryStr));
  } catch (error) {
    if (error.message === 'Token is invalid') {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// for admin to change permissionId of a user
app.post('/admin/userpermission/change/v1', (req, res) => {
  try {
    const token = req.header('token');
    const { uId, permissionId } = req.body;
    res.json(adminUserPermissionChangeV1(token, uId, permissionId));
  } catch (error) {
    if (
      error.message === 'Invalid Authorization!' ||
      error.message === 'Token is invalid'
    ) {
      throw HTTPError(403, error);
    }
    throw HTTPError(400, error);
  }
});

// remove user from treats
app.delete('/admin/user/remove/v1', (req, res) => {
  try {
    const token = req.header('token');
    const uId = parseInt(req.query.uId as string);
    res.json(adminUserRemoveV1(token, uId));
  } catch (error) {
    if (error.message === 'Token is invalid' || error.message === 'Invalid Authorization!') {
      throw HTTPError(403, error);
    } else {
      throw HTTPError(400, error);
    }
  }
});

// handles errors nicely
app.use(errorHandler());

// for logging errors
app.use(morgan('dev'));

// handles errors nicely
app.use(errorHandler());
// start server
const server = app.listen(PORT, HOST, () => {
  console.log(`⚡️ Server listening on port ${PORT}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
