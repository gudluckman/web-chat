import request from 'sync-request';
import { requestStandupStartV1, requestStandupActiveV1, requestStandupSendV1 } from './standup.help'
import { requestAuthRegisterV2 } from './auth.help';
import { OK, SERVER_URL, AUTH_ERROR, INPUT_ERROR } from '../config/server.config';
import { requestChannelsCreateV2 } from './channels.help';

beforeAll(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

afterEach(() => {
  request('DELETE', SERVER_URL + '/clear/v1');
});

describe('/standup/start/v1 tests', () => {
  describe('error return type', () => {
    test('Invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupStartV1(token + 'ab', channelId, 5, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('Invalid channelId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupStartV1(token, channelId - 100, 5, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('Length is negative', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupStartV1(token, channelId, -5, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('Active standup currently running', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupStartV1(token, channelId, 2, 1)).toStrictEqual(OK);
      expect(requestStandupStartV1(token, channelId, 2, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('Authorised user not in channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);
      const token2 = requestAuthRegisterV2('granddad@gmail.com', '1234567', 'Grand', 'Dad');

      expect(requestStandupStartV1(token2.token, channelId, 1, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  describe('correct return type', () => {
    test('standup succesfully started', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupStartV1(token, channelId, 2, 1)).toStrictEqual(OK);
    });
  });
});

describe('/standup/active/v1 tests', () => {
  describe('error return type', () => {
    test('invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupActiveV1(token + 'ab', channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
    test('invalid channelId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupActiveV1(token, channelId - 99, 1)).toStrictEqual(INPUT_ERROR);
    });
    test('user not a member of channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);
      const token2 = requestAuthRegisterV2('granddad@gmail.com', '1234567', 'Grand', 'Dad');

      expect(requestStandupActiveV1(token2.token, channelId, 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  describe('correct return type', () => {
    test('standup not active', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupActiveV1(token, channelId, 1)).toStrictEqual(OK);
      expect(requestStandupActiveV1(token, channelId)).toStrictEqual({ isActive: false, timeFinish: null});
    });
    test('standup is active', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      requestStandupStartV1(token, channelId, 3);
      expect(requestStandupActiveV1(token, channelId, 1)).toStrictEqual(OK);
      expect(requestStandupActiveV1(token, channelId)).toStrictEqual({ isActive: true, timeFinish: expect.any(Number)});
    });
  });
});

describe('/standup/send/v1 tests', () => {
  describe('error return type', () => {
    test('invalid token', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      requestStandupStartV1(token, channelId, 3);
      expect(requestStandupSendV1(token + 'ab', channelId, 'hello', 1)).toStrictEqual(AUTH_ERROR);
    });
    test('invalid channelId', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      requestStandupStartV1(token, channelId, 3);
      expect(requestStandupSendV1(token, channelId - 99, 'hello', 1)).toStrictEqual(INPUT_ERROR);
    });
    test('message length over 1000', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      requestStandupStartV1(token, channelId, 3);
      expect(requestStandupSendV1(token, channelId, 'LLorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. N'
      , 1)).toStrictEqual(INPUT_ERROR);
    });
    test('standup not currently active', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      expect(requestStandupSendV1(token, channelId, 'hello', 1)).toStrictEqual(INPUT_ERROR);
    });
    test('user not member of channel', () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);
      const token2 = requestAuthRegisterV2('granddad@gmail.com', '1234567', 'Grand', 'Dad');

      requestStandupStartV1(token, channelId, 3);
      expect(requestStandupSendV1(token2.token, channelId, 'hello', 1)).toStrictEqual(AUTH_ERROR);
    });
  });
  describe('correct return type', () => {
    test('message succesfully sent',  async () => {
      const { token } = requestAuthRegisterV2('johnsmith@gmail.com', '1234567', 'John', 'Smith');
      const { channelId } = requestChannelsCreateV2(token, 'first', true);

      requestStandupStartV1(token, channelId, 2);
      expect(requestStandupSendV1(token, channelId, 'hello')).toStrictEqual({});
      expect(requestStandupSendV1(token, channelId, 'hello')).toStrictEqual({});
      await new Promise((r) => setTimeout(r, 2000));
    });
  });
}); 