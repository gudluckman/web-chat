import React from "react";
import ProfileList from "./ProfileList";
import ChannelList from "./ChannelList";
import DmList from "./DmList";

function ProfileChannelLists({ channelId, dmId }) {
  return (
    <>
      <ProfileList />
      <ChannelList channelId={channelId} />
      <DmList dmId={dmId} />
    </>
  );
}

export default ProfileChannelLists;
