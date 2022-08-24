import React from "react";
import axios from "axios";

import { IconButton } from "@material-ui/core";

import DeleteIcon from "@material-ui/icons/Delete";

import AuthContext from "../../AuthContext";
import { StepContext } from "../Channel/ChannelMessages";
import { StepContextDm } from "../Dm/DmMessages";

function MessageRemove({ messageId, disabled = false }) {
  const token = React.useContext(AuthContext);

  let step = React.useContext(StepContext);
  let stepDm = React.useContext(StepContextDm);
  step = step ? step : () => {}; // sanity check
  stepDm = stepDm ? stepDm : () => {}; // sanity check

  const messageRemove = () => {
    axios
      .delete(`/message/remove/v2`, {
        headers: { token },
        params: {
          messageId: Number.parseInt(messageId)
        }
      })
      .then(() => {
        step();
        stepDm();
      });
  };

  return (
    <IconButton
      disabled={disabled}
      onClick={messageRemove}
      style={{ margin: 1 }}
      size="small"
      edge="end"
      aria-label="delete"
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  );
}

export default MessageRemove;
