// import { echo } from './echo';
import request from 'sync-request';
import {URL, LOCAL_PORT} from '../config/server.config';

const OK = 200;
const INPUT_ERROR = 400;
const url = URL;
const port = LOCAL_PORT;

/*
Iteration 3
*/
describe('HTTP tests using Jest', () => {
  test('Test successful echo', () => {
    const res = request(
      'GET',
            `${url}:${port}/echo`,
            {
              qs: {
                echo: 'Hello',
              }
            }
    );
    const bodyObj = JSON.parse(res.body as string);
    expect(res.statusCode).toBe(OK);
    expect(bodyObj).toEqual('Hello');
  });
  test('Test invalid echo', () => {
    const res = request(
      'GET',
            `${url}:${port}/echo`,
            {
              qs: {
                echo: 'echo',
              }
            }
    );
    const bodyObj = JSON.parse(res.body as string);
    expect(res.statusCode).toBe(INPUT_ERROR);
    expect(bodyObj.error).toStrictEqual({ message: 'Cannot echo "echo"' });
  });
});
