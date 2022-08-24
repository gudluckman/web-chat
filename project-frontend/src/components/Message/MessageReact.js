import React from "react";
import axios from "axios";

import { Badge, IconButton } from "@material-ui/core";

import ThumbUpIcon from "@material-ui/icons/ThumbUp";
import ThumbUpOutlinedIcon from "@material-ui/icons/ThumbUpOutlined";

import AuthContext from "../../AuthContext";
import { StepContext } from "../Channel/ChannelMessages";
import { StepContextDm } from "../Dm/DmMessages";

function MessageReact({ messageId, reacts = [] /* [{ reactId, uIds }] */ }) {
  const token = React.useContext(AuthContext);
  let step = React.useContext(StepContext);
  let stepDm = React.useContext(StepContextDm);
  step = step ? step : () => {}; // sanity check
  stepDm = stepDm ? stepDm : () => {}; // sanity check

  const messageReact = isReacted => {
    if (isReacted) {
      axios
        .post(
          `/message/unreact/v1`,
          {
            messageId: Number.parseInt(messageId),
            reactId: 1 /* FIXME */
          },
          { headers: { token } }
        )
        .then(() => {
          step();
          stepDm();
        });
    } else {
      axios
        .post(
          `/message/react/v1`,
          {
            messageId: Number.parseInt(messageId),
            reactId: 1 /* FIXME */
          },
          { headers: { token } }
        )
        .then(() => {
          step();
          stepDm();
        });
    }
  };

  let thumbUpCount = 0;
  let isReacted = false;
  const thumbUpIndex = reacts.findIndex(react => react.reactId === 1);
  if (thumbUpIndex !== -1) {
    thumbUpCount = reacts[thumbUpIndex].uIds.length;
    isReacted = reacts[thumbUpIndex].isThisUserReacted;
  }

  return (
    <Badge
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      badgeContent={thumbUpCount}
      color="secondary"
    >
      <IconButton
        onClick={() => messageReact(isReacted)}
        style={{ margin: 1 }}
        size="small"
        edge="end"
        aria-label="delete"
      >
        {isReacted ? (
          <ThumbUpIcon fontSize="small" />
        ) : (
          <ThumbUpOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Badge>
  );
}

export default MessageReact;
