import { SERVER_URL } from '../config/server.config';
import request from 'sync-request';

export function requestSearchV1(token: string, queryStr: string, 
arg?: number) {
  const res = request(
    'GET',
    SERVER_URL + '/search/v1',
    {
      headers: { token },
      qs: { queryStr }
    }
  );
  if (arg === 1) return res.statusCode;
  return JSON.parse(res.getBody() as string);
}
