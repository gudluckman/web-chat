import request from 'sync-request';
import { SERVER_URL } from '../config/server.config';

export function requestChannelsCreateV2(token: string, name: string, isPublic: boolean, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/channels/create/v3',
    {
      headers: { token },
      json: { name, isPublic }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestChannelsListV2(token: string, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/channels/list/v3',
    {
      headers: { token },
      qs: {}
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestChannelsListAllV2(token: string, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/channels/listall/v3',
    {
      headers: { token },
      qs: {}
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}
