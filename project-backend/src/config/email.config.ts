import nodemailer from 'nodemailer';

export const SENDER = 'f11beggs@gmail.com';
const CLIENT_ID = '872829731004-2kac8krehbv43dh7j03gbb03f53l7sc5.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REFRESH_TOKEN = '1//04HPaoRWePE4_CgYIARAAGAQSNwF-L9Ir3UVYQHAYksLOKLlS36AFmylF1T3AqL1iXbku8fuK7m-R41q9sfHHwIyABwcMIG0ySsQ';

export const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: SENDER,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN
  }
});
