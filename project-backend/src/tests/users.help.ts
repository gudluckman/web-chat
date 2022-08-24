import { SERVER_URL } from '../config/server.config';
import request from 'sync-request';

export function requestUserProfileV2(token: string, uId: number, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/user/profile/v3',
    {
      headers: { token },
      qs: { uId }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}
export function requestUserProfileSetNameV1(
  token: string, 
  nameFirst: string, 
  nameLast: string,
  arg?: number) 
  {
  const res = request(
    'PUT',
    SERVER_URL + '/user/profile/setname/v2',
    {
      headers: { token },
      json: { nameFirst, nameLast } 
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestUserProfileSetEmailV1(token: string, email: string, arg?: number) {
  const res = request(
    'PUT',
    SERVER_URL + '/user/profile/setemail/v2',
    {
      headers: { token },
      json: { email } 
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestUserProfileSetHandle(token: string, handleStr: string, arg?: number) {
  const res = request(
    'PUT',
    SERVER_URL + '/user/profile/sethandle/v2',
    {
      headers: { token },
      json: { handleStr }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestUsersAllV1(token: string, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/users/all/v2',
    {
      headers: { token }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}

export function requestUserStatsV1(token: string, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/user/stats/v1',
    {
      headers: { token }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
};

export function requestUsersStatsV1(token: string, arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/users/stats/v1',
    {
      headers: { token }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
};

export function requestUploadPhotoV1(token: string, imgUrl: string, xStart: number, yStart: number, xEnd: number, yEnd: number, arg?: number) {
  const res = request(
    'POST',
    SERVER_URL + '/user/profile/uploadphoto/v1',
    {
      headers: { token },
      json: {
        imgUrl,
        xStart,
        yStart,
        xEnd,
        yEnd
      }
    }
  );
  return res.statusCode;
}