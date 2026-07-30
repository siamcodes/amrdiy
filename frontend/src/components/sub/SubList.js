import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSubs } from "../../functions/sub";
import { List, Skeleton } from "antd";

const SubList = () => {
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getSubs().then((res) => {
            setSubs(res.data);
            setLoading(false);
        });
    }, []);

    if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

    return <List
        size="small"
        dataSource={subs}
        renderItem={(sub) => (
            <List.Item>
                <Link to={`/sub/${sub.slug}`}>{sub.name}</Link>
            </List.Item>
        )}
    />;
};

export default SubList;
