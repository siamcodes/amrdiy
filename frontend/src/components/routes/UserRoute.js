import React from "react";
import { useSelector } from "react-redux";
import LoadingToRedirect from "./LoadingToRedirect";
import LegacyPage from "./LegacyPage";

const UserRoute = ({ component }) => {
  const { user } = useSelector((state) => ({ ...state }));

  return user && user.token
    ? <LegacyPage component={component} />
    : <LoadingToRedirect />;
};

export default UserRoute;
