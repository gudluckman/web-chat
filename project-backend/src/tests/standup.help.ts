import request from "sync-request";
import { SERVER_URL } from '../config/server.config';

export function requestStandupStartV1(token: string, channelId: number, length: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/standup/start/v1',
    {
      headers: { token },
      json: { channelId, length }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestStandupActiveV1(token: string, channelId: number, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/standup/active/v1',
    {
      headers: { token },
      qs: { channelId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestStandupSendV1(token: string, channelId: number, message: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/standup/send/v1',
    {
      headers: { token },
      json: { channelId, message }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}
