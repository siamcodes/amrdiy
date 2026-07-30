import React from "react";
import { Menu } from "antd";
import {
    HeartOutlined, HistoryOutlined, LockOutlined, UserOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const UserNav = () => {
    const location = useLocation();
    const items = [
        { key: "/user/history", icon: <HistoryOutlined />, label: <Link to="/user/history">ประวัติคำสั่งซื้อ</Link> },
        { key: "/user/wishlist", icon: <HeartOutlined />, label: <Link to="/user/wishlist">รายการโปรด</Link> },
        { key: "/user/profile", icon: <UserOutlined />, label: <Link to="/user/profile">โปรไฟล์</Link> },
        { key: "/user/password", icon: <LockOutlined />, label: <Link to="/user/password">รหัสผ่าน</Link> },
    ];
    return <Menu mode="inline" selectedKeys={[location.pathname]} items={items} />;
};

export default UserNav;
