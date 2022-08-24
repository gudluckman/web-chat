import React from "react";
import timeago from "epoch-timeago";
import axios from "axios";

import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText
} from "@material-ui/core";

import AuthContext from "../../AuthContext";
import MessagePin from "./MessagePin";
import MessageReact from "./MessageReact";
import MessageRemove from "./MessageRemove";
import MessageEdit from "./MessageEdit";
import MessageShareDialog from "./MessageShareDialog";

import { isMatchingId } from "../../utils";
import { extractUId } from "../../utils/token";

function Message({
  messageId,
  message = "",
  uId,
  timeSent,
  isUnread = false,
  isPinned = false,
  reacts = [] /* [{ reactId, uIds }] */
}) {
  const [nameFirst, setNameFirst] = React.useState();
  const [nameLast, setNameLast] = React.useState();
  const [imgUrl, setImgUrl] = React.useState();
  const token = React.useContext(AuthContext);
  const isUser = isMatchingId(uId, extractUId(token));

  const fullName = [nameFirst, nameLast]
    .filter(s => s != null && s !== "")
    .join(" ");
  const initials = [nameFirst, nameLast]
    .filter(s => s != null && s !== "")
    .map(s => s[0])
    .join("");
  const msgToList = msg => msg.split("\n");

  React.useEffect(() => {
    setNameFirst();
    setNameLast();
    setImgUrl();
    axios
      .get(`/user/profile/v3`, {
        params: {
          uId
        },
        headers: { token }
      })
      .then(({ data }) => {
        const {
          user: {
            email = "",
            nameFirst = "",
            nameLast = "",
            handleStr = "",
            profileImgUrl = ""
          }
        } = data;
        setNameFirst(nameFirst);
        setNameLast(nameLast);
        setImgUrl(`${profileImgUrl}`);
      })
      .catch(err => {
        console.error(err);
      });
  }, [messageId, token, uId]);

  return (
    <ListItem key={messageId} style={{ width: "100%" }}>
      {message && (
        <>
          <ListItemAvatar>
            <Avatar
              style={{
                width: "50px",
                height: "50px",
                border: "1px solid #ccc"
              }}
              src={imgUrl}
            >
              {initials}
            </Avatar>
          </ListItemAvatar>
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <ListItemText
              primary={
                <>
                  <span>{fullName}</span>
                  <span style={{ paddingLeft: 10, fontSize: 10 }}>
                    {timeago(timeSent * 1000)}
                  </span>
                </>
              }
              secondary={
                <div>
                  <pre style={{ fontFamily: "inherit" }}>{message}</pre>
                </div>
              }
            />
            <div style={{ display: "flex", height: 30, marginLeft: 20 }}>
              <MessageReact messageId={messageId} reacts={reacts} uId={uId} />
              <MessagePin messageId={messageId} isPinned={isPinned} />
              <MessageShareDialog ogMessageId={messageId} />
              <MessageEdit
                messageId={messageId}
                // disabled={!isUser} /* We have no way of checking admin status */
              />
              <MessageRemove
                messageId={messageId}
                // disabled={!isUser} /* We have no way of checking admin status */
              />
            </div>
          </div>
        </>
      )}
    </ListItem>
  );
}

export default Message;
