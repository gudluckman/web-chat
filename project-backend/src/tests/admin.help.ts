import { SERVER_URL } from '../config/server.config';
import request from 'sync-request';

export function requestAdminUserPermissionChangeV1(token: string, uId: number, permissionId: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/admin/userpermission/change/v1',
    {
      headers: { token },
      json: { uId, permissionId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestAdminUserRemoveV1(token: string, uId: number, arg?: number) {
  const res = request(
    'DELETE',
    SERVER_URL + '/admin/user/remove/v1',
    {
      headers: { token },
      qs: { uId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}