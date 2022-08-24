import React from "react";
import axios from "axios";

import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  MenuItem,
  Select,
  DialogContentText,
  Button
} from "@material-ui/core";
import AuthContext from "../../AuthContext";
import { useStep } from "../../utils/update";

function AddMemberDialog({ channelId, ...props }) {
  const [open, setOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState("");
  const [users, setUsers] = React.useState([]);

  const token = React.useContext(AuthContext);

  const step = useStep();

  React.useEffect(() => {
    function fetchUserData() {
      axios
        .get("/users/all/v2", {
          headers: { token }
        })
        .then(({ data }) => {
          setUsers(data["users"]);
        })
        .catch(err => {});
    }
    fetchUserData();
  }, [token]);

  const handleUserSelect = event => {
    const newUserId = parseInt(event.target.value, 10);
    setSelectedUser(newUserId);
  };

  function handleClickOpen() {
    setOpen(true);
  }
  function handleClose() {
    setOpen(false);
  }
  function handleSubmit(event) {
    event.preventDefault();
    const uId = selectedUser;

    if (uId == null) return;

    axios
      .post(
        `/channel/invite/v3`,
        {
          uId: Number.parseInt(uId),
          channelId: Number.parseInt(channelId)
        },
        { headers: { token } }
      )
      .then(response => {
        console.log(response);
        step();
      })
      .catch(err => {});
  }
  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Invite Member
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">Invite User</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText>
              Select a user below to invite them to this channel
            </DialogContentText>
            <Select
              style={{ width: "100%" }}
              id="uId"
              onChange={handleUserSelect}
              value={selectedUser}
            >
              {users.map((d, idx) => {
                return (
                  <MenuItem key={d.uId} value={d.uId}>
                    {d.nameFirst} {d.nameLast}
                  </MenuItem>
                );
              })}
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleClose} type="submit" color="primary">
              Invite
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default AddMemberDialog;
