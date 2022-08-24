import request from "sync-request";
import { SERVER_URL } from "../config/server.config";

export function requestMessageShareV1(token: string, ogMessageId: number, message: string, channelId: number, dmId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/Share/v1',
    {
      headers: { token },
      json: { ogMessageId, message, channelId, dmId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageUnpinV1(token: string, messageId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/unpin/v1',
    {
      headers: { token },
      json: { messageId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessagePinV1(token: string, messageId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/pin/v1',
    {
      headers: { token },
      json: { messageId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageUnreactV1(token: string, messageId: number, reactId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/unreact/v1',
    {
      headers: { token },
      json: { messageId, reactId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageReactV1(token: string, messageId: number, reactId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/react/v1',
    {
      headers: { token },
      json: { messageId, reactId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageSendV1(token: string, channelId: number, message: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/send/v2',
    {
      headers: { token },
      json: { channelId, message }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageEditV1(token: string, messageId: number, message: string, arg?: number) {
  const res = request(
    'PUT',
    SERVER_URL + '/message/edit/v2',
    {
      headers: { token },
      json: { messageId, message }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageRemoveV1(token: string, messageId: number, arg?: number) {
  const res = request(
    'DELETE',
    SERVER_URL + '/message/remove/v2',
    {
      headers: { token },
      qs: { messageId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageSendDmV1(token: string, dmId: number, message: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/senddm/v2',
    {
      headers: { token },
      json: { dmId, message }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageSendLaterDmV1(token: string, dmId: number, message: string, timeSent: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/sendlaterdm/v1',
    {
      headers: { token },
      json: { dmId, message, timeSent }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestMessageSendLaterV1(token: string, channelId: number, message: string, timeSent: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/message/sendlater/v1',
    {
      headers: { token },
      json: { channelId, message, timeSent }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}
