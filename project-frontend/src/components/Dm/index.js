import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Typography,
  Button,
  Grid,
  Link
} from "@material-ui/core";
import axios from "axios";
import React from "react";
import DmMessages from "./DmMessages";
import AuthContext from "../../AuthContext";
import { useStep } from "../../utils/update";
import Placeholder from "../Placeholder";

function Dm({ dmId, ...props }) {
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [membersList, setMembersList] = React.useState([]);
  const token = React.useContext(AuthContext);

  function fetchDmData() {
    axios
      .get("/dm/details/v2", {
        params: {
          dmId: dmId
        },
        headers: { token }
      })
      .then(({ data }) => {
        const { name, members } = data;
        // assumes members of form [{ uId, nameFirst, nameLast }]
        console.log(members);
        setMembersList(members);
        setName(name);
      })
      .catch(err => {
        setMembersList([]);
        setName("");
      })
      .finally(() => setLoading(false));
  }

  useStep(fetchDmData, [dmId, token], 2);

  function leaveDm(dmId, token) {
    axios
      .post(
        "/dm/leave/v2",
        {
          dmId: Number.parseInt(dmId)
        },
        { headers: { token } }
      )
      .then(() => {
        fetchDmData(dmId, token);
      })
      .catch(err => {});
  }

  function removeDm(dmId, token) {
    axios
      .delete(`/dm/remove/v2`, {
        headers: { token },
        params: {
          dmId: Number.parseInt(dmId)
        }
      })
      .then(() => {
        fetchDmData(dmId, token);
      })
      .catch(err => {});
  }

  return (
    <>
      {loading ? (
        <Placeholder />
      ) : (
        <>
          <Typography variant="h4">{name.toUpperCase()}</Typography>
          <List subheader={<ListSubheader>Members</ListSubheader>}>
            {membersList.map(({ uId, nameFirst, nameLast, profileImgUrl }) => (
              <ListItem key={uId}>
                <ListItemAvatar>
                  <Avatar
                    style={{
                      width: "50px",
                      height: "50px",
                      border: "1px solid #ccc"
                    }}
                    src={profileImgUrl}
                  >
                    {[nameFirst, nameLast]
                      .filter(s => s != null && s !== "")
                      .map(s => s[0])
                      .join("")}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                          <Link
                            href={`/profile/${uId}`}
                          >{`${nameFirst} ${nameLast}`}</Link>
                        </Grid>
                      </Grid>
                    </>
                  }
                />
              </ListItem>
            ))}
            <ListItem key="leave_dm">
              <Grid container spacing={1}>
                <Grid item>
                  <Button
                    variant="outlined"
                    onClick={() => leaveDm(dmId, token)}
                  >
                    Leave Dm
                  </Button>
                  &nbsp;
                  <Button
                    variant="outlined"
                    onClick={() => removeDm(dmId, token)}
                  >
                    Remove Dm
                  </Button>
                </Grid>
              </Grid>
            </ListItem>
          </List>
          <DmMessages dmId={dmId} />
        </>
      )}
    </>
  );
}

export default Dm;
