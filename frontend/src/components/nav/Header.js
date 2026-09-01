import React, { useMemo, useState } from 'react'
import { Badge, Button, Drawer, Grid, Layout, Menu, Space, Typography } from 'antd';
import {
    AppstoreOutlined,
    SettingOutlined,
    UserAddOutlined,
    UserOutlined,
    LogoutOutlined,
    ShoppingOutlined,
    ShoppingCartOutlined,
    UnorderedListOutlined,
    ContactsOutlined,
    MenuOutlined,
    ReadOutlined,
    BookOutlined,
    SearchOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Search from "../forms/Search";
import { signOut } from "../../functions/auth";

const { Header: AntHeader } = Layout;

const Header = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const screens = Grid.useBreakpoint();
    const location = useLocation();

    let dispatch = useDispatch();
    let { user, cart } = useSelector((state) => ({ ...state }));

    const navigate = useNavigate();

    const logout = async () => {
        await signOut();
        dispatch({
            type: "LOGOUT",
            payload: null,
        });
        navigate("/login");
    };

    const primaryItems = useMemo(() => [
            { key: '/', icon: <AppstoreOutlined />, label: <Link to="/">หน้าหลัก</Link> },
            { key: '/shop', icon: <ShoppingOutlined />, label: <Link to="/shop">สินค้า</Link> },
            { key: '/courses', icon: <BookOutlined />, label: <Link to="/courses">คอร์ส</Link> },
            { key: '/user/contact', icon: <ContactsOutlined />, label: <Link to="/user/contact">ติดต่อเรา</Link> },
    ], []);

    const accountItems = useMemo(() => {
        const items = [
            {
                key: '/blog',
                icon: <ReadOutlined />,
                label: <Link to="/blog">บทความ</Link>,
            },
            {
                key: '/cart',
                icon: <ShoppingCartOutlined />,
                label: <Link to="/cart"><Badge count={cart.length} size="small" offset={[8, -2]}>ตะกร้า</Badge></Link>,
            },
        ];
        if (!user) {
            items.push(
                { key: '/login', icon: <UserOutlined />, label: <Link to="/login">เข้าสู่ระบบ</Link> },
                { key: '/register', icon: <UserAddOutlined />, label: <Link to="/register">สมัครสมาชิก</Link> },
            );
        } else {
            const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/user/history';
            items.push({
                key: 'account',
                icon: <SettingOutlined />,
                label: user.email?.split('@')[0] || 'บัญชี',
                children: [
                    { key: dashboardPath, icon: <UnorderedListOutlined />, label: <Link to={dashboardPath}>แดชบอร์ด</Link> },
                    { key: '/user/courses', icon: <BookOutlined />, label: <Link to="/user/courses">คอร์สของฉัน</Link> },
                    { key: '/user/profile', icon: <UserOutlined />, label: 'โปรไฟล์', onClick: () => navigate('/user/profile') },
                    { key: 'logout', icon: <LogoutOutlined />, label: 'ออกจากระบบ', onClick: logout },
                ],
            });
        }

        return items;
    }, [cart.length, navigate, user]);

    const mobileItems = useMemo(
        () => [...primaryItems, ...accountItems],
        [accountItems, primaryItems]
    );

    return (
        <>
            <AntHeader className="site-header">
                {screens.xl ? (
                    <>
                        <div className="header-left">
                            <Link to="/" className="brand">
                                <img src="/amrdiy-logo.svg" alt="AMR DIY" className="brand-logo" />
                            </Link>
                            <Menu
                                className="primary-menu"
                                mode="horizontal"
                                disabledOverflow
                                selectedKeys={[location.pathname]}
                                items={primaryItems}
                            />
                        </div>
                        <div className="header-search">
                            <Search />
                        </div>
                        <Menu
                            className="account-menu"
                            mode="horizontal"
                            disabledOverflow
                            selectedKeys={[location.pathname]}
                            items={accountItems}
                        />
                    </>
                ) : (
                    <>
                        {mobileSearchOpen ? (
                            <div className="mobile-search-expanded">
                                <Search autoFocus />
                            </div>
                        ) : (
                            <>
                                <Link to="/" className="brand">
                                    <img src="/amrdiy-logo.svg" alt="AMR DIY" className="brand-logo" />
                                </Link>
                                <nav className="mobile-quick-menu" aria-label="เมนูหลักบนมือถือ">
                                    <Link
                                        to="/shop"
                                        className={location.pathname === '/shop' ? 'is-active' : undefined}
                                        aria-current={location.pathname === '/shop' ? 'page' : undefined}
                                    >
                                        สินค้า
                                    </Link>
                                    <Link
                                        to="/courses"
                                        className={location.pathname.startsWith('/courses') ? 'is-active' : undefined}
                                        aria-current={location.pathname.startsWith('/courses') ? 'page' : undefined}
                                    >
                                        คอร์ส
                                    </Link>
                                    <Link
                                        to="/blog"
                                        className={location.pathname.startsWith('/blog') ? 'is-active' : undefined}
                                        aria-current={location.pathname.startsWith('/blog') ? 'page' : undefined}
                                    >
                                        บทความ
                                    </Link>
                                </nav>
                            </>
                        )}
                        <Space>
                            <Badge count={cart.length} size="small">
                                <Button type="text" icon={<ShoppingCartOutlined />} onClick={() => navigate('/cart')} />
                            </Badge>
                            <Button
                                type="text"
                                icon={mobileSearchOpen ? <CloseOutlined /> : <SearchOutlined />}
                                aria-label={mobileSearchOpen ? "ปิดค้นหา" : "ค้นหา"}
                                onClick={() => setMobileSearchOpen((open) => !open)}
                            />
                            <Button
                                type="text"
                                icon={<MenuOutlined />}
                                aria-label="เปิดเมนู"
                                onClick={() => setMobileOpen(true)}
                            />
                        </Space>
                    </>
                )}
            </AntHeader>
            <Drawer
                title="AMR DIY"
                placement="right"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
            >
                <Search />
                <Menu
                    className="mobile-menu"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={mobileItems}
                    onClick={() => setMobileOpen(false)}
                />
            </Drawer>
        </>
    )
}

export default Header;
