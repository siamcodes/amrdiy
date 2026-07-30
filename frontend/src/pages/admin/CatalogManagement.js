import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row,
    Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography,
} from "antd";
import {
    ApartmentOutlined, DeleteOutlined, EditOutlined, FilterOutlined,
    PlusOutlined, TagsOutlined, TrademarkOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import AdminNav from "../../components/nav/AdminNav";
import RichTextEditor from "../../components/forms/RichTextEditor";
import {
    createCatalogItem, getCatalogItems, getCatalogOverview,
    removeCatalogItem, updateCatalogItem,
} from "../../functions/catalog";

const { Paragraph, Title } = Typography;
const resources = {
    brand: { title: "Brand / ผู้ผลิต", icon: <TrademarkOutlined /> },
    tag: { title: "Tag", icon: <TagsOutlined /> },
    attribute: { title: "Attribute & Filter", icon: <ApartmentOutlined /> },
};

const CatalogManagement = () => {
    const [form] = Form.useForm();
    const [activeKey, setActiveKey] = useState("brand");
    const [items, setItems] = useState([]);
    const [overview, setOverview] = useState({});
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const dataType = Form.useWatch("dataType", form);

    const load = useCallback(async (resource = activeKey) => {
        setLoading(true);
        try {
            const [list, summary] = await Promise.all([
                getCatalogItems(resource),
                getCatalogOverview(),
            ]);
            setItems(list.data);
            setOverview(summary.data);
        } catch (error) {
            toast.error("โหลดข้อมูล Catalog ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [activeKey]);

    useEffect(() => {
        load();
    }, [load]);

    const changeTab = (key) => {
        setActiveKey(key);
        setEditing(null);
        form.resetFields();
    };

    const openForm = (item = null) => {
        setEditing(item || {});
        form.setFieldsValue(item ? { ...item } : {
            active: true,
            dataType: "text",
            group: "General",
            filterable: true,
            comparable: true,
            required: false,
            sortOrder: 0,
        });
    };

    const submit = async (values) => {
        const payload = {
            ...values,
            options: values.options,
        };
        setLoading(true);
        try {
            if (editing?._id) {
                await updateCatalogItem(activeKey, editing._id, payload);
                toast.success("แก้ไขข้อมูลแล้ว");
            } else {
                await createCatalogItem(activeKey, payload);
                toast.success("เพิ่มข้อมูลแล้ว");
            }
            setEditing(null);
            form.resetFields();
            await load(activeKey);
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ");
        }
    };

    const remove = async (item) => {
        try {
            await removeCatalogItem(activeKey, item._id);
            toast.success(`ลบ "${item.name}" แล้ว`);
            await load(activeKey);
        } catch (error) {
            toast.error(error.response?.data?.message || "ลบข้อมูลไม่สำเร็จ");
        }
    };

    const columns = useMemo(() => {
        const common = [
            { title: "ชื่อ", dataIndex: "name" },
            {
                title: "สถานะ",
                dataIndex: "active",
                render: (value) => <Tag color={value !== false ? "green" : "default"}>
                    {value !== false ? "ใช้งาน" : "ปิด"}
                </Tag>,
            },
        ];
        if (activeKey === "brand") {
            common.splice(1, 0,
                { title: "รหัส", dataIndex: "code", responsive: ["sm"] },
                { title: "เว็บไซต์", dataIndex: "website", ellipsis: true, responsive: ["lg"] });
        }
        if (activeKey === "tag") {
            common.splice(1, 0, {
                title: "สี",
                dataIndex: "color",
                render: (color, item) => <Tag color={color}>{item.name}</Tag>,
            });
        }
        if (activeKey === "attribute") {
            common.splice(1, 0,
                { title: "กลุ่ม", dataIndex: "group" },
                { title: "ชนิดข้อมูล", dataIndex: "dataType" },
                { title: "หน่วย", dataIndex: "unit" },
                {
                    title: "Filter",
                    dataIndex: "filterable",
                    render: (value) => value ? <FilterOutlined style={{ color: "#1677ff" }} /> : "-",
                });
        }
        common.push({
            title: "จัดการ",
            align: "right",
            width: 110,
            render: (_, item) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => openForm(item)} />
                    <Popconfirm title={`ลบ "${item.name}"?`} onConfirm={() => remove(item)}
                        okText="ลบ" cancelText="ยกเลิก">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        });
        return common;
    }, [activeKey]);

    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <main>
                <Title level={2}>Catalog Management</Title>
                <Paragraph type="secondary">
                    จัดการผู้ผลิต คำค้นหา คุณสมบัติสำหรับเปรียบเทียบ และตัวกรองสินค้า
                </Paragraph>
                <Row gutter={[16, 16]}>
                    {[
                        ["Brand", overview.brands, <TrademarkOutlined />],
                        ["Tag", overview.tags, <TagsOutlined />],
                        ["Attribute", overview.attributes, <ApartmentOutlined />],
                        ["Filter", overview.filters, <FilterOutlined />],
                    ].map(([title, value, icon]) => (
                        <Col xs={12} lg={6} key={title}>
                            <Card><Statistic title={title} value={value || 0} prefix={icon} /></Card>
                        </Col>
                    ))}
                </Row>
                <Card className="catalog-management-card">
                    <Tabs activeKey={activeKey} onChange={changeTab}
                        items={Object.entries(resources).map(([key, item]) => ({
                            key,
                            label: <Space>{item.icon}{item.title}</Space>,
                        }))}
                        tabBarExtraContent={
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
                                เพิ่มข้อมูล
                            </Button>
                        } />
                    <Table rowKey="_id" columns={columns} dataSource={items}
                        loading={loading} scroll={{ x: 760 }}
                        pagination={{ pageSize: 10, showSizeChanger: true }} />
                </Card>
            </main>

            <Modal open={Boolean(editing)}
                title={`${editing?._id ? "แก้ไข" : "เพิ่ม"} ${resources[activeKey].title}`}
                onCancel={() => setEditing(null)}
                onOk={() => form.submit()}
                confirmLoading={loading}
                okText="บันทึก" cancelText="ยกเลิก"
                width={activeKey === "attribute" ? 680 : 520}
                destroyOnHidden>
                <Form form={form} layout="vertical" onFinish={submit}>
                    <Form.Item name="name" label="ชื่อ"
                        rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}>
                        <Input />
                    </Form.Item>
                    {activeKey === "brand" && (
                        <>
                            <Form.Item name="code" label="รหัสผู้ผลิต"><Input /></Form.Item>
                            <Form.Item name="website" label="เว็บไซต์"><Input type="url" /></Form.Item>
                            <Form.Item name="logo" label="URL โลโก้"><Input type="url" /></Form.Item>
                            <Form.Item name="description" label="รายละเอียด">
                                <RichTextEditor />
                            </Form.Item>
                        </>
                    )}
                    {activeKey === "tag" && (
                        <>
                            <Form.Item name="color" label="สี Tag">
                                <Select options={["blue", "cyan", "green", "gold", "orange", "red", "purple"]
                                    .map((value) => ({ value, label: value }))} />
                            </Form.Item>
                            <Form.Item name="description" label="คำอธิบาย">
                                <RichTextEditor />
                            </Form.Item>
                        </>
                    )}
                    {activeKey === "attribute" && (
                        <>
                            <Row gutter={16}>
                                <Col span={12}><Form.Item name="group" label="กลุ่ม"><Input /></Form.Item></Col>
                                <Col span={12}><Form.Item name="dataType" label="ชนิดข้อมูล">
                                    <Select options={[
                                        ["text", "ข้อความ"], ["number", "ตัวเลข"], ["boolean", "ใช่/ไม่ใช่"],
                                        ["select", "เลือกค่าเดียว"], ["multiselect", "เลือกหลายค่า"],
                                    ].map(([value, label]) => ({ value, label }))} />
                                </Form.Item></Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}><Form.Item name="unit" label="หน่วย"><Input placeholder="V, A, mm, °C" /></Form.Item></Col>
                                <Col span={12}><Form.Item name="sortOrder" label="ลำดับ"><InputNumber className="full-width" /></Form.Item></Col>
                            </Row>
                            {["select", "multiselect"].includes(dataType) && (
                                <Form.Item name="options" label="ตัวเลือก">
                                    <Select mode="tags" tokenSeparators={[","]}
                                        placeholder="พิมพ์ค่าแล้วกด Enter" />
                                </Form.Item>
                            )}
                            <Space size="large" wrap>
                                <Form.Item name="filterable" label="ใช้เป็น Filter" valuePropName="checked"><Switch /></Form.Item>
                                <Form.Item name="comparable" label="ใช้เปรียบเทียบ" valuePropName="checked"><Switch /></Form.Item>
                                <Form.Item name="required" label="จำเป็น" valuePropName="checked"><Switch /></Form.Item>
                            </Space>
                        </>
                    )}
                    <Form.Item name="active" label="เปิดใช้งาน" valuePropName="checked"><Switch /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CatalogManagement;
