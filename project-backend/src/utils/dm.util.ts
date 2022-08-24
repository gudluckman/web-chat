import { getData, setData } from "../dataStore";
import { updateMsgExist } from "./user.util";

/**
 * Function removes all the messages associated with a removed dm.
 * @param dmId - dm to be removed.
 */
export function removeDmMessages(dmId: number) {
  const data = getData();
  if (data.messages.some((msg) => msg.dmId === dmId)) {
    data.messages = data.messages.filter((msg) => msg.dmId !== dmId);
    updateMsgExist();
  }
  setData();
}