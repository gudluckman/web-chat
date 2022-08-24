import { findUserByEmail } from "./find.util";
import crypto from 'crypto';
import { transport, SENDER } from "../config/email.config";
import { setData } from "../dataStore";

/**
 * Sends a reset password code to the given email.
 * @param email - email of the account to reset password.
 */
 export function sendResetCode(email: string) {
  const user = findUserByEmail(email);
  const resetCode = crypto.randomBytes(16).toString('hex');
  const mailOptions = {
    from: SENDER,
    to: email,
    subject: 'Password Reset Code',
    text: `Reset code: ${resetCode}`
  };

  transport.sendMail(mailOptions, function(error, info) {
    if (error) console.log(error);
    console.log(info);
  });

  user.resetCodes.push(resetCode);
  setData();
}