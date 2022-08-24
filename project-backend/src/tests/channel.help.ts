import request from 'sync-request';
import { SERVER_URL } from '../config/server.config';

export function requestChannelMessagesV2(token: string, channelId: number, start: number, arg?: number) {  
  const res = request(
    'GET',
    SERVER_URL + '/channel/messages/v3',
    {
      headers: { token },
      qs: { channelId, start}
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestChannelLeaveV1(token: string, channelId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/leave/v2',
    {
      headers: { token },
      json: { channelId }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestChannelJoinV2(token: string, channelId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/join/v3',
    {
      headers: { token },
      json: { channelId }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestChannelDetailsV2(token: string, channelId: number, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/channel/details/v3',
    {
      headers: { token },
      qs: { channelId }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestChannelAddOwnerV1(token:string, channelId: number, uId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/addowner/v2',
    {
      headers: { token },
      json: { channelId, uId }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestChannelInviteV2(token: string, channelId: number, uId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/invite/v3',
    {
      headers: { token },
      json: { channelId, uId }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestChannelRemoveOwnerV1(token:string, channelId: number, uId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channel/removeowner/v2',
    {
      headers: { token },
      json: { channelId, uId }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}
