import React from "react";
import Layout from "../components/Layout";
import ProfileChannelLists from "../components/ProfileChannelLists";
import Dm from "../components/Dm";

function DmPage({ match }) {
  const { dmId } = match.params;
  return (
    <Layout
      menu={<ProfileChannelLists channelId={null} dmId={dmId} />}
      body={<Dm dmId={dmId} />}
    />
  );
}

export default DmPage;
