import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Row, Spin, Statistic, Table, Tag, Typography } from "antd";
import {
    AppstoreOutlined, ShoppingCartOutlined, TeamOutlined, WalletOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNav from "../../components/nav/AdminNav";
import { getAdminStats } from "../../functions/admin";
import { BarChart, DonutChart, LineChart } from "../../components/charts/AdminCharts";

const { Paragraph, Title } = Typography;

const AdminDashboard = () => {
    const user = useSelector((state) => state.user);
    const [data, setData] = useState({
        summary: {}, orderStatuses: [], monthlySales: [], topProducts: [], recentOrders: [],
    });
    const [loading, setLoading] = useState(false);

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            setData((await getAdminStats(user?.token)).data);
        } catch (error) {
            toast.error("โหลดข้อมูล Dashboard ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const monthlyData = useMemo(() => {
        const values = new Map(data.monthlySales.map((item) => [item.month, item]));
        return Array.from({ length: 12 }, (_, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (11 - index), 1);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            return {
                month,
                label: date.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
                orders: values.get(month)?.orders || 0,
                revenue: values.get(month)?.revenue || 0,
            };
        });
    }, [data.monthlySales]);

    const cards = [
        { title: "รายได้ทั้งหมด", value: data.summary.revenue || 0, prefix: <WalletOutlined />, suffix: "บาท", color: "#1677ff" },
        { title: "คำสั่งซื้อ", value: data.summary.orders || 0, prefix: <ShoppingCartOutlined />, suffix: "รายการ", color: "#52c41a" },
        { title: "สินค้า", value: data.summary.products || 0, prefix: <AppstoreOutlined />, suffix: "รายการ", color: "#faad14" },
        { title: "ลูกค้า", value: data.summary.users || 0, prefix: <TeamOutlined />, suffix: "บัญชี", color: "#722ed1" },
    ];
    const statusColors = {
        "Not Processed": "default",
        "Cash On Delivery": "gold",
        Processing: "processing",
        processing: "processing",
        Dispatched: "cyan",
        Cancelled: "error",
        Completed: "success",
    };
    const orderColumns = [
        {
            title: "เลขที่คำสั่งซื้อ",
            dataIndex: "_id",
            render: (value) => <Typography.Text copyable>{String(value).slice(-10).toUpperCase()}</Typography.Text>,
        },
        {
            title: "ลูกค้า",
            render: (_, order) => (
                <div>
                    <div>{order.customer?.name || order.customer?.username || "ไม่พบข้อมูลลูกค้า"}</div>
                    <Typography.Text type="secondary">{order.customer?.email}</Typography.Text>
                </div>
            ),
        },
        {
            title: "ยอดรวม",
            dataIndex: "amount",
            align: "right",
            render: (value) => Number(value || 0)
                .toLocaleString("th-TH", { style: "currency", currency: "THB" }),
        },
        {
            title: "สถานะ",
            dataIndex: "orderStatus",
            render: (value) => <Tag color={statusColors[value]}>{value}</Tag>,
        },
        {
            title: "วันที่สั่งซื้อ",
            dataIndex: "createdAt",
            render: (value) => new Date(value).toLocaleString("th-TH"),
            responsive: ["md"],
        },
    ];

    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <main>
                <Title level={2}>Dashboard</Title>
                <Paragraph type="secondary">ภาพรวมข้อมูลร้านค้าและยอดขายล่าสุด</Paragraph>
                <Spin spinning={loading}>
                    <Row gutter={[16, 16]}>
                        {cards.map((item) => (
                            <Col xs={24} sm={12} xl={6} key={item.title}>
                                <Card className="dashboard-stat-card"
                                    styles={{ body: { borderTop: `4px solid ${item.color}` } }}>
                                    <Statistic title={item.title} value={item.value}
                                        precision={item.title === "รายได้ทั้งหมด" ? 2 : 0}
                                        prefix={item.prefix} suffix={item.suffix} />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <Row gutter={[16, 16]} className="dashboard-chart-row">
                        <Col xs={24} xl={15}>
                            <Card title="ยอดขาย 12 เดือนล่าสุด">
                                <LineChart data={monthlyData} />
                            </Card>
                        </Col>
                        <Col xs={24} xl={9}>
                            <Card title="สถานะคำสั่งซื้อ">
                                <DonutChart data={data.orderStatuses} />
                            </Card>
                        </Col>
                        <Col xs={24}>
                            <Card title="สินค้าขายดี">
                                <BarChart data={data.topProducts} />
                            </Card>
                        </Col>
                        <Col xs={24}>
                            <Card title="คำสั่งซื้อล่าสุด"
                                extra={<Link to="/admin/orders"><Button type="link">ดูทั้งหมด</Button></Link>}>
                                <Table
                                    rowKey="_id"
                                    columns={orderColumns}
                                    dataSource={data.recentOrders}
                                    pagination={false}
                                    scroll={{ x: 760 }}
                                    locale={{ emptyText: "ยังไม่มีคำสั่งซื้อ" }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Spin>
            </main>
        </div>
    );
};

export default AdminDashboard;
