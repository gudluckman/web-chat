import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader
} from "@material-ui/core";

import RadioButtonCheckedIcon from "@material-ui/icons/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import AuthContext from "../AuthContext";
import AddChannelDialog from "./Channel/AddChannelDialog";

import { useStep } from "../utils/update";

function ChannelList({ channelId: currChannelId }) {
  const [myChannels, setMyChannels] = React.useState([]);
  const [allChannels, setAllChannels] = React.useState([]);

  const token = React.useContext(AuthContext);

  const fetchChannelsData = () => {
    // fetch channels data
    const getMyChannels = axios.get("/channels/list/v3", {
      headers: { token }
    });
    const getAllChannels = axios.get("/channels/listall/v3", {
      headers: { token }
    });

    axios.all([getMyChannels, getAllChannels]).then(
      axios.spread((myChannelResponse, allChannelResponse) => {
        const myChannelData = myChannelResponse.data.channels;
        const allChannelData = allChannelResponse.data.channels;
        const filteredChannels = allChannelData.filter(channel => {
          return (
            myChannelData.find(c => c.channelId === channel.channelId) ===
            undefined
          );
        });
        setMyChannels(myChannelData);
        setAllChannels(filteredChannels);
      })
    );
  };

  useStep(fetchChannelsData, [], 2);

  return (
    <>
      <List
        subheader={
          <ListSubheader style={{ display: "flex" }}>
            <span style={{ flex: 1 }}>My Channels</span>
            <AddChannelDialog callback={fetchChannelsData} />
          </ListSubheader>
        }
      >
        {myChannels.map(({ channelId, name }, index) => (
          <ListItem
            button
            key={channelId}
            component={Link}
            to={`/channel/${channelId}`}
          >
            <ListItemIcon>
              {channelId == currChannelId ? (
                <RadioButtonCheckedIcon />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </ListItemIcon>
            <ListItemText primary={name} />
          </ListItem>
        ))}
      </List>
      <List subheader={<ListSubheader>Other Channels</ListSubheader>}>
        {allChannels.map(({ channelId, name }, index) => (
          <ListItem
            button
            key={channelId}
            component={Link}
            to={`/channel/${channelId}`}
          >
            <ListItemIcon>
              {channelId == currChannelId ? (
                <RadioButtonCheckedIcon />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </ListItemIcon>
            <ListItemText primary={name} />
          </ListItem>
        ))}
      </List>
    </>
  );
}

export default ChannelList;
