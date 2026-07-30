import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Avatar, Button, Card, Col, Descriptions, Empty, Form, Image, Input, InputNumber,
    Modal, Row, Select, Space, Table, Tag, Typography,
} from "antd";
import { PlusOutlined, SearchOutlined, ShoppingCartOutlined, TruckOutlined, UserOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import AdminNav from "../../components/nav/AdminNav";
import { changePaymentStatus, changeStatus, getOrders, updateOrderTracking } from "../../functions/admin";

const { Title } = Typography;
const statuses = [
    "Not Processed", "Cash On Delivery", "Processing",
    "Dispatched", "Cancelled", "Completed",
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

const AdminOrders = () => {
    const user = useSelector((state) => state.user);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [trackingOpen, setTrackingOpen] = useState(false);
    const [trackingForm] = Form.useForm();

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getOrders(user?.token);
            setOrders(response.data);
        } catch (error) {
            toast.error("โหลดคำสั่งซื้อไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const updateStatus = async (orderId, orderStatus) => {
        try {
            await changeStatus(orderId, orderStatus, user?.token);
            setOrders((items) => items.map((item) =>
                item._id === orderId ? { ...item, orderStatus } : item));
            toast.success("อัปเดตสถานะคำสั่งซื้อแล้ว");
        } catch (error) {
            toast.error(error.response?.data?.message || "อัปเดตสถานะไม่สำเร็จ");
        }
    };

    const updatePayment = async (orderId, paymentStatus) => {
        try {
            const { data } = await changePaymentStatus(orderId, paymentStatus, user?.token);
            setOrders((items) => items.map((item) =>
                item._id === orderId ? { ...item, payment: data.payment, paymentIntent: data.paymentIntent, orderStatus: data.orderStatus } : item));
            toast.success("อัปเดตสถานะการชำระเงินแล้ว");
        } catch (error) {
            toast.error(error.response?.data?.message || "อัปเดตการชำระเงินไม่สำเร็จ");
        }
    };

    const filteredOrders = useMemo(() => {
        const search = keyword.trim().toLowerCase();
        if (!search) return orders;
        return orders.filter((order) => [
            order._id,
            order.paymentIntent?.id,
            order.orderedBy?.name,
            order.orderedBy?.username,
            order.orderedBy?.email,
        ].some((value) => String(value || "").toLowerCase().includes(search)));
    }, [keyword, orders]);

    const openTracking = (order, parcel) => {
        setTrackingOrder(order);
        trackingForm.setFieldsValue(parcel ? {
            packageId: parcel._id,
            ...parcel,
            eventDescription: "",
            location: "",
        } : { status: "preparing", name: `พัสดุ ${(order.packages?.length || 0) + 1}` });
        setTrackingOpen(true);
    };

    const saveTracking = async () => {
        try {
            const values = await trackingForm.validateFields();
            const { packageId, ...packageData } = values;
            const { data } = await updateOrderTracking(
                trackingOrder._id,
                { packageId, package: packageData },
                user?.token
            );
            setOrders((items) => items.map((item) => item._id === data._id ? { ...item, ...data } : item));
            setTrackingOpen(false);
            toast.success("บันทึกข้อมูลพัสดุแล้ว");
        } catch (error) {
            if (error.response) toast.error(error.response.data?.message || "บันทึก Tracking ไม่สำเร็จ");
        }
    };

    const columns = [
        {
            title: "เลขที่คำสั่งซื้อ",
            dataIndex: "_id",
            render: (value) => <Typography.Text copyable>{value.slice(-10).toUpperCase()}</Typography.Text>,
        },
        {
            title: "ลูกค้า",
            render: (_, order) => (
                <Space>
                    <Avatar src={order.orderedBy?.image || order.orderedBy?.picture}
                        icon={<UserOutlined />} />
                    <div>
                        <div>{order.orderedBy?.name || order.orderedBy?.username || "ไม่พบข้อมูล"}</div>
                        <Typography.Text type="secondary">{order.orderedBy?.email}</Typography.Text>
                    </div>
                </Space>
            ),
        },
        {
            title: "ยอดรวม",
            render: (_, order) => ((order.paymentIntent?.amount || 0) / 100)
                .toLocaleString("th-TH", { style: "currency", currency: "THB" }),
        },
        {
            title: "วันที่สั่งซื้อ",
            dataIndex: "createdAt",
            render: (value) => new Date(value).toLocaleString("th-TH"),
            responsive: ["lg"],
        },
        {
            title: "สถานะ",
            render: (_, order) => (
                <Select
                    value={order.orderStatus === "processing" ? "Processing" : order.orderStatus}
                    onChange={(value) => updateStatus(order._id, value)}
                    className="order-status-select"
                    options={statuses.map((status) => ({
                        value: status,
                        label: <Tag color={statusColors[status]}>{status}</Tag>,
                    }))}
                />
            ),
        },
    ];

    const expandedRow = (order) => (
        <div>
            <Descriptions size="small" bordered column={{ xs: 1, md: 2, lg: 3 }}
                items={[
                    { key: "payment", label: "ช่องทางชำระเงิน", children: order.payment?.method || order.paymentIntent?.payment_method_types?.[0] || "-" },
                    { key: "paymentStatus", label: "สถานะการชำระเงิน", children:
                        <Select value={order.payment?.status || order.paymentIntent?.status || "pending"}
                            style={{ minWidth: 160 }} onChange={(value) => updatePayment(order._id, value)}
                            options={[
                                { value: "pending", label: "รอชำระ" },
                                { value: "pending_review", label: "รอตรวจหลักฐาน" },
                                { value: "paid", label: "ชำระแล้ว" },
                                { value: "failed", label: "ไม่ผ่าน" },
                                { value: "refunded", label: "คืนเงินแล้ว" },
                            ]} /> },
                    { key: "address", label: "ที่อยู่จัดส่ง", children:
                        [order.shippingAddress?.recipientName, order.shippingAddress?.phone,
                            order.shippingAddress?.addressLine1, order.shippingAddress?.district,
                            order.shippingAddress?.province, order.shippingAddress?.postalCode]
                            .filter(Boolean).join(" ") || order.orderedBy?.address || "-" },
                    { key: "slip", label: "หลักฐานการชำระเงิน", children: order.payment?.slip?.url
                        ? <Button type="link" href={order.payment.slip.url} target="_blank">เปิดดูสลิป</Button> : "-" },
                    { key: "shippingMethod", label: "บริการจัดส่ง", children:
                        order.shipping?.providerName
                            ? `${order.shipping.providerName} · ${order.shipping.serviceName} (฿${Number(order.shipping.fee || 0).toLocaleString()})`
                            : "-" },
                ]} />
            <Card size="small" title={<><TruckOutlined /> พัสดุและ Tracking</>}
                extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openTracking(order)}>เพิ่มพัสดุ</Button>}
                style={{ marginTop: 16 }}>
                <Table rowKey="_id" size="small" pagination={false} dataSource={order.packages || []}
                    locale={{ emptyText: "ยังไม่มีข้อมูลพัสดุ" }}
                    columns={[
                        { title: "พัสดุ", dataIndex: "name" },
                        { title: "เลข Tracking", dataIndex: "trackingNumber", render: (v, p) => p.trackingUrl ? <a href={p.trackingUrl} target="_blank" rel="noreferrer">{v}</a> : v || "-" },
                        { title: "สถานะ", dataIndex: "status", render: (v) => <Tag color={v === "delivered" ? "green" : "blue"}>{v}</Tag> },
                        { title: "น้ำหนัก", dataIndex: "weightKg", render: (v) => v ? `${v} kg` : "-" },
                        { title: "", render: (_, parcel) => <Button size="small" onClick={() => openTracking(order, parcel)}>อัปเดต</Button> },
                    ]} />
            </Card>
            <Table
                className="order-product-table"
                rowKey={(item) => item._id || item.product?._id}
                pagination={false}
                dataSource={order.products}
                columns={[
                    {
                        title: "สินค้า",
                        render: (_, item) => (
                            <Space>
                                <Image width={48} height={48} preview={false}
                                    src={item.product?.images?.[0]?.url}
                                    fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f0f0f0'/%3E%3C/svg%3E" />
                                {item.product?.title || "สินค้าถูกลบแล้ว"}
                            </Space>
                        ),
                    },
                    { title: "สี", dataIndex: "color" },
                    { title: "จำนวน", dataIndex: "count" },
                    {
                        title: "ราคา",
                        render: (_, item) => Number(item.product?.price || 0)
                            .toLocaleString("th-TH", { style: "currency", currency: "THB" }),
                    },
                ]}
            />
        </div>
    );

    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <main>
                <Title level={2}><ShoppingCartOutlined /> คำสั่งซื้อ</Title>
                <Card>
                    <Input size="large" allowClear prefix={<SearchOutlined />}
                        placeholder="ค้นหาเลขคำสั่งซื้อ ชื่อ Username หรืออีเมล"
                        value={keyword} onChange={(event) => setKeyword(event.target.value)} />
                    <Table
                        className="admin-data-table"
                        rowKey="_id"
                        loading={loading}
                        columns={columns}
                        dataSource={filteredOrders}
                        expandable={{ expandedRowRender: expandedRow }}
                        locale={{ emptyText: <Empty description="ไม่พบคำสั่งซื้อ" /> }}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        scroll={{ x: 900 }}
                    />
                </Card>
            </main>
            <Modal open={trackingOpen} title="ข้อมูลพัสดุและ Tracking"
                onCancel={() => setTrackingOpen(false)} onOk={saveTracking} width={680}>
                <Form form={trackingForm} layout="vertical">
                    <Form.Item name="packageId" hidden><Input /></Form.Item>
                    <Form.Item name="name" label="ชื่อพัสดุ" rules={[{ required: true }]}><Input placeholder="กล่องที่ 1" /></Form.Item>
                    <Form.Item name="trackingNumber" label="เลข Tracking"><Input /></Form.Item>
                    <Form.Item name="status" label="สถานะ" rules={[{ required: true }]}>
                        <Select options={[
                            ["preparing", "กำลังจัดเตรียม"], ["ready", "พร้อมส่ง"], ["picked_up", "บริษัทขนส่งรับแล้ว"],
                            ["in_transit", "อยู่ระหว่างขนส่ง"], ["out_for_delivery", "กำลังนำจ่าย"],
                            ["delivered", "ส่งสำเร็จ"], ["exception", "เกิดปัญหา"], ["returned", "ตีกลับ"],
                        ].map(([value, label]) => ({ value, label }))} />
                    </Form.Item>
                    <Row gutter={12}>
                        <Col span={6}><Form.Item name="weightKg" label="น้ำหนัก (kg)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
                        <Col span={6}><Form.Item name="lengthCm" label="ยาว (cm)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
                        <Col span={6}><Form.Item name="widthCm" label="กว้าง (cm)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
                        <Col span={6}><Form.Item name="heightCm" label="สูง (cm)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="eventDescription" label="รายละเอียดสถานะ"><Input placeholder="เช่น เข้าศูนย์คัดแยกแล้ว" /></Form.Item>
                    <Form.Item name="location" label="ตำแหน่ง"><Input placeholder="เช่น ศูนย์กระจายสินค้า กรุงเทพฯ" /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminOrders;
