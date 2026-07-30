import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Avatar, Card, Empty, Input, Space, Table, Tag, Typography,
} from "antd";
import {
    CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, TeamOutlined, UserOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import AdminNav from "../../components/nav/AdminNav";
import { getUsers } from "../../functions/admin";

const { Title } = Typography;

const AdminUsers = () => {
    const user = useSelector((state) => state.user);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState("");

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            setUsers((await getUsers(user?.token)).data);
        } catch (error) {
            toast.error("โหลดข้อมูลลูกค้าไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        const search = keyword.trim().toLowerCase();
        if (!search) return users;
        return users.filter((item) =>
            [item.name, item.firstName, item.lastName, item.username, item.email, item.address]
                .some((value) => String(value || "").toLowerCase().includes(search)));
    }, [keyword, users]);

    const columns = [
        {
            title: "ลูกค้า",
            render: (_, item) => (
                <Space>
                    <Avatar size="large" src={item.image || item.picture} icon={<UserOutlined />} />
                    <div>
                        <div>{item.name || [item.firstName, item.lastName].filter(Boolean).join(" ") || "-"}</div>
                        <Typography.Text type="secondary">@{item.username || "-"}</Typography.Text>
                    </div>
                </Space>
            ),
        },
        { title: "อีเมล", dataIndex: "email" },
        {
            title: "ยืนยันอีเมล",
            dataIndex: "emailVerified",
            align: "center",
            render: (value) => value
                ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
                : <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />,
        },
        {
            title: "สิทธิ์",
            dataIndex: "role",
            render: (role) => <Tag color={role === "admin" ? "purple" : "blue"}>{role}</Tag>,
        },
        {
            title: "วันที่สมัคร",
            dataIndex: "createdAt",
            render: (value) => new Date(value).toLocaleString("th-TH"),
            responsive: ["md"],
        },
        {
            title: "ที่อยู่",
            dataIndex: "address",
            ellipsis: true,
            responsive: ["lg"],
        },
    ];

    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <main>
                <Title level={2}><TeamOutlined /> ข้อมูลลูกค้า</Title>
                <Card>
                    <Input size="large" allowClear prefix={<SearchOutlined />}
                        placeholder="ค้นหาชื่อ Username อีเมล หรือที่อยู่"
                        value={keyword} onChange={(event) => setKeyword(event.target.value)} />
                    <Table
                        className="admin-data-table"
                        rowKey="_id"
                        loading={loading}
                        columns={columns}
                        dataSource={filteredUsers}
                        locale={{ emptyText: <Empty description="ไม่พบข้อมูลลูกค้า" /> }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `ทั้งหมด ${total} บัญชี`,
                        }}
                        scroll={{ x: 850 }}
                    />
                </Card>
            </main>
        </div>
    );
};

export default AdminUsers;
