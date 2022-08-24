import CryptoJS from 'crypto-js';
import { SECRET } from '../config/encrypt.config';
import crypto from 'crypto';

/**
 * Takes in a string and encrypts it with a secret stored in config.
 * @param text - string to be encrypted.
 * @returns the encrypted string.
 */
export function encryptWithAES(text: string) {
  return CryptoJS.AES.encrypt(text, SECRET).toString();
}

/**
 * Takes in an encrypted string and decrypt with a secret stored in config.
 * @param ciphertext - encrypted text to be decrypted.
 * @returns the decrypted cipher text.
 */
export function decryptWithAES(ciphertext: string) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Function returns a hashed string.
 * @param text - string to be hashed.
 * @returns a hashed string.
 */
 export function getHashOf(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}