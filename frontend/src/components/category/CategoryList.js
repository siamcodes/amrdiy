import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../../functions/category";
import { List, Skeleton } from "antd";

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getCategories().then((c) => {
            setCategories(c.data);
            setLoading(false);
        });
    }, []);

    if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

    return <List
        size="small"
        dataSource={categories}
        renderItem={(category) => (
            <List.Item>
                <Link to={`/category/${category.slug}`}>{category.name}</Link>
            </List.Item>
        )}
    />;
};

export default CategoryList;
