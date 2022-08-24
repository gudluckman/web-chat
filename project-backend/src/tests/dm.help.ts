import request from 'sync-request';
import { SERVER_URL } from '../config/server.config';

export function requestDmDetailsV1(token: string, dmId: number, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/dm/details/v2',
    {
      headers: { token },
      qs: { dmId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestDmCreateV1(token: string, uIds: number[], arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/dm/create/v2',
    {
      headers: { token },
      json: { uIds }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestDmRemoveV1(token: string, dmId: number, arg?: number) {
  const res = request(
    'DELETE',
    SERVER_URL + '/dm/remove/v2',
    {
      headers: { token },
      qs: { dmId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestDmLeaveV1(token: string, dmId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/dm/leave/v2',
    {
      headers: { token },
      json: { dmId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestDmListV1(token: string, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/dm/list/v2',
    {
      headers: { token }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestDmMessagesV1(token: string, dmId: number, start: number, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/dm/messages/v2',
    {
      headers: { token },
      qs: { dmId, start }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

