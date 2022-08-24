import { getData } from './dataStore';
import { isTokenValid, isUserIdValid, isPermissionIdValid } from './utils/auth.util';
import { updatePermissionId, updateName } from './utils/user.util';
import { findUserById, findUserByToken } from './utils/find.util';
import { v4 as uuidv4 } from 'uuid';

type adminUserPermissionChange = Record<string, never>;
type adminUserRemove = Record<string, never>;

/**
 * Function allows to change the user's permission id.
 *
 * @param token - The token belonging to the authorised user requesting to change another user's permission.
 * @param uId - The user id belonging to the user that permission is about to be changed
 * @param permissionId - The user's permission or authority
 * @returns Updated user's permissionId and empty object
 */
export function adminUserPermissionChangeV1(token: string, uId: number, permissionId: number): adminUserPermissionChange {
  const data = getData();
  // Error Checking
  if (!isTokenValid(token)) throw new Error('Token is invalid');

  if (!isUserIdValid(uId) || !isPermissionIdValid(permissionId)) {
    throw new Error('Input is invalid');
  }

  const authUser = findUserByToken(token);
  const user = findUserById(uId);

  // Auth user is not a global owner
  if (authUser.permissionId !== 1) throw new Error('Invalid Authorization!');

  // uId refers to a user who is the only global owner and they are being demoted to a user
  if (
    !data.users.some((user) => user.permissionId === 1 && user.uId !== uId) &&
    user.permissionId === 1
  ) {
    throw new Error('uId is the only global owner');
  }

  // If the user already has the permissions level of permissionId
  if (user.permissionId === permissionId) throw new Error('User already have permissions');

  user.permissionId = permissionId;

  updatePermissionId(uId, permissionId);
  return {};
}

/**
 * Function allows to remove user from UNSW Treats.
 *
 * @param token - The token belonging to the authorised user requesting to delete another user.
 * @param uId - The user id belonging to the user that is to be removed from UNSW Treats.
 * @returns Removed user such as first and last name, sethandle from UNSW Treats and empty object
 */
export function adminUserRemoveV1(token: string, uId: number): adminUserRemove {
  const data = getData();
  if (!isTokenValid(token)) throw new Error('Token is invalid');
  if (!isUserIdValid(uId)) throw new Error('uId is invalid');

  const user = findUserById(uId);
  const authUser = findUserByToken(token);

  // uId refers to user who is the only global owner
  if (
    !data.users.some((user) => user.permissionId === 1 && user.uId !== uId) &&
    user.permissionId === 1
  ) {
    throw new Error('uId is the only global owner');
  }
  // Auth user is not a global owner
  if (authUser.permissionId !== 1) throw new Error('Invalid Authorization!');

  const nameFirst = 'Removed';
  const nameLast = 'user';

  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  user.email = uuidv4().slice(0, 6) + '@' + 'email.com';
  user.handleStr = uuidv4().slice(0, 20);
  user.isRemoved = true;

  updateName(uId, nameFirst, nameLast);
  return {};
}
