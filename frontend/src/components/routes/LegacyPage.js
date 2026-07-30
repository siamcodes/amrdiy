import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export const useLegacyHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return {
    location,
    push: (destination) => {
      if (typeof destination === "string") {
        navigate(destination);
        return;
      }

      navigate(destination.pathname, { state: destination.state });
    },
    replace: (destination) => navigate(destination, { replace: true }),
  };
};

const LegacyPage = ({ component: Component }) => {
  const params = useParams();
  const history = useLegacyHistory();

  return <Component match={{ params }} history={history} location={history.location} />;
};

export default LegacyPage;
