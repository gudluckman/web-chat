import request from 'sync-request';
import { SERVER_URL } from '../config/server.config';

export function requestAuthRegisterV2(email: string, password: string, nameFirst: string, nameLast: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/register/v3',
    {
      json: { email, password, nameFirst, nameLast }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestAuthLoginV2(email: string, password: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/login/v3',
    {
      json: { email, password }
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestAuthLogoutV1(token: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/logout/v2',
    {
      headers: { token },
      json: {}
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestPasswordResetReqV1(email: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/passwordreset/request/v1',
    {
      json: { email },
    }
  );
  if (arg === 1) return res.statusCode; 
  return JSON.parse(res.getBody() as string);
}

export function requestPasswordResetResetV1(resetCode: string, newPassword: string, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/auth/passwordreset/reset/v1',
    {
      json: { resetCode, newPassword },
    }
  );
  return res.statusCode; 
}