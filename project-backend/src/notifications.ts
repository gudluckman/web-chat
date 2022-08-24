import { notification } from './dataStore';
import { isTokenValid } from './utils/auth.util';
import { findUserByToken } from './utils/find.util';

type getNotifications = { notifications: notification[] | [] };

/**
 * Function retrieves all notifications sent to the user.
 * @param token - the session of the logged in user requesting for notifications.
 * @returns an array of notifications for the particular user.
 */
export function getNotificationsV1(token: string): getNotifications {
  if (!isTokenValid(token)) throw new Error('Invalid token');

  return { notifications: findUserByToken(token).notifications };
}
