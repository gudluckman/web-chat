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
  Link,
  IconButton
} from "@material-ui/core";
import PersonAdd from "@material-ui/icons/PersonAdd";
import PersonAddDisabled from "@material-ui/icons/PersonAddDisabled";
import axios from "axios";
import React from "react";
import AddMemberDialog from "./AddMemberDialog";
import ChannelMessages from "./ChannelMessages";
import AuthContext from "../../AuthContext";
import { extractUId } from "../../utils/token";
import { isMatchingId } from "../../utils";
import { useStep } from "../../utils/update";
import Placeholder from "../Placeholder";

function Channel({ channelId, ...props }) {
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [members, setMembers] = React.useState([]);
  const [owners, setOwners] = React.useState([]);
  const token = React.useContext(AuthContext);
  const uId = extractUId(token);

  function fetchChannelData() {
    axios
      .get("/channel/details/v3", {
        params: { channelId },
        headers: { token }
      })
      .then(({ data }) => {
        const { name, ownerMembers, allMembers } = data;
        // assumes members of form [{ uId, nameFirst, nameLast }]
        setMembers(allMembers);
        setOwners(ownerMembers);
        setName(name);
      })
      .catch(err => {
        setMembers([]);
        setOwners([]);
        setName("");
      })
      .finally(() => setLoading(false));
  }

  useStep(fetchChannelData, [channelId, token], 2);

  function joinChannel(channelId, token) {
    axios
      .post(
        "/channel/join/v3",
        {
          channelId: Number.parseInt(channelId)
        },
        { headers: { token } }
      )
      .then(() => {
        fetchChannelData(channelId, token);
      })
      .catch(err => {});
  }

  function leaveChannel(channelId, token) {
    axios
      .post(
        "/channel/leave/v2",
        {
          channelId: Number.parseInt(channelId)
        },
        { headers: { token } }
      )
      .then(() => {
        fetchChannelData(channelId, token);
      })
      .catch(err => {});
  }

  function addOwner(uId) {
    axios
      .post(
        "/channel/addowner/v2",
        {
          channelId: Number.parseInt(channelId),
          uId: Number.parseInt(uId)
        },
        { headers: { token } }
      )
      .then(() => {
        fetchChannelData(channelId, token);
      })
      .catch(err => {});
  }

  function removeOwner(uId) {
    axios
      .post(
        "/channel/removeowner/v2",
        {
          channelId: Number.parseInt(channelId),
          uId: Number.parseInt(uId)
        },
        { headers: { token } }
      )
      .then(() => {
        fetchChannelData(channelId, token);
      })
      .catch(err => {});
  }

  function userIsMember(members) {
    return members.find(member => isMatchingId(member.uId, uId)) !== undefined;
  }

  function userIsOwner(owners, uId) {
    return owners.find(owner => isMatchingId(owner.uId, uId)) !== undefined;
  }

  const viewerIsMember = userIsMember(members);

  return (
    <>
      {loading ? (
        <Placeholder />
      ) : (
        <>
          <Typography variant="h4">{name.toUpperCase()}</Typography>
          <List subheader={<ListSubheader>Members</ListSubheader>}>
            {members.map(({ uId, nameFirst, nameLast, profileImgUrl }) => (
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
                          {`${userIsOwner(owners, uId) ? " ⭐" : " "}`}
                        </Grid>
                        <Grid item>
                          {userIsOwner(owners, uId) ? (
                            <IconButton
                              size="small"
                              onClick={() => removeOwner(uId)}
                            >
                              <PersonAddDisabled />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => addOwner(uId)}
                            >
                              <PersonAdd />
                            </IconButton>
                          )}
                        </Grid>
                      </Grid>
                    </>
                  }
                />
              </ListItem>
            ))}
            <ListItem key="invite_member">
              {userIsMember(members) ? (
                <Grid container spacing={1}>
                  <Grid item>
                    <AddMemberDialog channelId={channelId} />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      onClick={() => leaveChannel(channelId, token)}
                    >
                      Leave Channel
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => joinChannel(channelId, token)}
                >
                  Join Channel
                </Button>
              )}
            </ListItem>
          </List>
          {viewerIsMember && <ChannelMessages channelId={channelId} />}
        </>
      )}
    </>
  );
}

export default Channel;
