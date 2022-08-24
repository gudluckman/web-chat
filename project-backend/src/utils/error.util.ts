import fs from 'fs';

const errorFileName = 'asyncError.json';

/**
 * Function logs error into a json file, which will be read by the route.
 * @param error - error thrown by an async function.
 */
 export function logError(error: Error) {
  fs.writeFileSync(`./src/${errorFileName}`, JSON.stringify(error, null, 2));
}

/**
 * Function checks if an error was logged.
 * @returns true if an error was logged and false if no error was logged.
 */
export function isErrorExist() {
  if (fs.readdirSync('./src').includes(`${errorFileName}`)) return true;
  return false;
}

/**
 * Function clears the asyncError file.
 */
export function clearError() {
  fs.unlinkSync(`./src/${errorFileName}`);
}