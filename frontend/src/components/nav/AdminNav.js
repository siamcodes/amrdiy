import React, { useState } from "react";
import { Divider, Menu, Space, Switch, Typography } from "antd";
import {
    AppstoreOutlined, DashboardOutlined, GiftOutlined, ProfileOutlined,
    DatabaseOutlined, FileTextOutlined, MoonOutlined, ShoppingCartOutlined, ShoppingOutlined,
    SunOutlined, TagsOutlined, TeamOutlined, TruckOutlined,
    BookOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";

const AdminNav = () => {
    const location = useLocation();
    const [dark, setDark] = useState(() => localStorage.getItem("amrdiy-admin-dark") === "true");
    const toggleDark = (checked) => {
        setDark(checked);
        localStorage.setItem("amrdiy-admin-dark", String(checked));
        window.dispatchEvent(new CustomEvent("amrdiy-admin-theme", { detail: checked }));
    };
    const items = [
        { key: "/admin/dashboard", icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">แดชบอร์ด</Link> },
        { key: "/admin/orders", icon: <ShoppingCartOutlined />, label: <Link to="/admin/orders">คำสั่งซื้อ</Link> },
        { key: "/admin/shipping", icon: <TruckOutlined />, label: <Link to="/admin/shipping">การจัดส่ง</Link> },
        { key: "/admin/blogs", icon: <FileTextOutlined />, label: <Link to="/admin/blogs">บทความ</Link> },
        { key: "/admin/courses", icon: <BookOutlined />, label: <Link to="/admin/courses">คอร์สเรียน</Link> },
        { key: "/admin/users", icon: <TeamOutlined />, label: <Link to="/admin/users">ข้อมูลลูกค้า</Link> },
        { key: "/admin/catalog", icon: <DatabaseOutlined />, label: <Link to="/admin/catalog">Catalog</Link> },
        { key: "/admin/product", icon: <ShoppingOutlined />, label: <Link to="/admin/product">เพิ่มสินค้า</Link> },
        { key: "/admin/products", icon: <AppstoreOutlined />, label: <Link to="/admin/products">รายการสินค้า</Link> },
        { key: "/admin/category", icon: <TagsOutlined />, label: <Link to="/admin/category">ประเภทสินค้า</Link> },
        { key: "/admin/coupon", icon: <GiftOutlined />, label: <Link to="/admin/coupon">คูปอง</Link> },
        { key: "/admin/brand", icon: <ProfileOutlined />, label: <Link to="/admin/brand">ยี่ห้อ</Link> },
    ];
    return <>
        <Space style={{ width: "100%", justifyContent: "space-between", padding: "4px 12px 12px" }}>
            <Typography.Text>{dark ? <MoonOutlined /> : <SunOutlined />} Dark Mode</Typography.Text>
            <Switch checked={dark} onChange={toggleDark} />
        </Space>
        <Divider style={{ margin: "0 0 8px" }} />
        <Menu mode="inline" selectedKeys={[location.pathname]} items={items} />
    </>;
};

export default AdminNav;
