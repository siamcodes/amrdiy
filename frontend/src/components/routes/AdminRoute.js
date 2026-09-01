import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import LoadingToRedirect from "./LoadingToRedirect";
import LegacyPage from "./LegacyPage";
import { currentAdmin } from "../../functions/auth";

const AdminRoute = ({ component }) => {
    const { user } = useSelector((state) => ({ ...state }));
    const [ok, setOk] = useState(false);

    useEffect(() => {
        if (user && user.token) {
            currentAdmin()
                .then((res) => {
                    setOk(true);
                })
                .catch((err) => {
                    setOk(false);
                });
        }
    }, [user]);

    return ok
        ? <LegacyPage component={component} />
        : <LoadingToRedirect />;
};

export default AdminRoute;
