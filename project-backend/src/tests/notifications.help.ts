import request from "sync-request";
import { SERVER_URL } from "../config/server.config";

export function requestNotificationsV1(token: string, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/notifications/get/v1',
    {
      headers: { token }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
};