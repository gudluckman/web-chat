import React from "react";
import Layout from "../components/Layout";
import ProfileChannelLists from "../components/ProfileChannelLists";
import Channel from "../components/Channel";

function ChannelPage({ match }) {
  const { channelId } = match.params;
  return (
    <Layout
      menu={<ProfileChannelLists channelId={channelId} dmId={null} />}
      body={<Channel channelId={channelId} />}
    />
  );
}

export default ChannelPage;
