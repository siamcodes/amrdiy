import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Button, Card, Col, Empty, Form, Input, Modal, Popconfirm, Row,
    Select, Space, Table, Tag, Typography,
} from "antd";
import {
    DeleteOutlined, EditOutlined, FolderAddOutlined, PlusOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import AdminNav from "../../../components/nav/AdminNav";
import {
    createCategory, getCategories, removeCategory, updateCategory,
} from "../../../functions/category";
import {
    createSub, getSubs, removeSub, updateSub,
} from "../../../functions/sub";
import {
    createProductType, getProductTypes, removeProductType, updateProductType,
} from "../../../functions/productType";

const { Paragraph, Title } = Typography;

const CategoryCreate = () => {
    const user = useSelector((state) => state.user);
    const [categoryForm] = Form.useForm();
    const [subForm] = Form.useForm();
    const [productTypeForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [subs, setSubs] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [categoryResponse, subResponse, productTypeResponse] = await Promise.all([
                getCategories(),
                getSubs(),
                getProductTypes(),
            ]);
            setCategories(categoryResponse.data);
            setSubs(subResponse.data);
            setProductTypes(productTypeResponse.data);
        } catch (error) {
            toast.error("โหลดข้อมูลประเภทสินค้าไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const errorMessage = (error, fallback) =>
        typeof error.response?.data === "string"
            ? error.response.data
            : error.response?.data?.message || fallback;

    const submitCategory = async ({ name }) => {
        setLoading(true);
        try {
            const response = await createCategory({ name }, user?.token);
            categoryForm.resetFields();
            toast.success(`เพิ่มประเภทหลัก "${response.data.name}" แล้ว`);
            await loadData();
        } catch (error) {
            setLoading(false);
            toast.error(errorMessage(error, "เพิ่มประเภทหลักไม่สำเร็จ"));
        }
    };

    const submitSub = async ({ name, parent }) => {
        setLoading(true);
        try {
            const response = await createSub({ name, parent }, user?.token);
            subForm.resetFields(["name"]);
            toast.success(`เพิ่มประเภทย่อย "${response.data.name}" แล้ว`);
            await loadData();
        } catch (error) {
            setLoading(false);
            toast.error(errorMessage(error, "เพิ่มประเภทย่อยไม่สำเร็จ"));
        }
    };

    const submitProductType = async ({ name, parent }) => {
        setLoading(true);
        try {
            const response = await createProductType({ name, parent }, user?.token);
            productTypeForm.resetFields(["name"]);
            toast.success(`เพิ่มประเภทสินค้า "${response.data.name}" แล้ว`);
            await loadData();
        } catch (error) {
            setLoading(false);
            toast.error(errorMessage(error, "เพิ่มประเภทสินค้าไม่สำเร็จ"));
        }
    };

    const openEdit = (type, record) => {
        setEditing({ type, record });
        editForm.setFieldsValue({
            name: record.name,
            parent: type !== "category" ? record.parent?._id || record.parent : undefined,
        });
    };

    const submitEdit = async (values) => {
        setLoading(true);
        try {
            let response;
            if (editing.type === "category") {
                response = await updateCategory(editing.record.slug, { name: values.name }, user?.token);
            } else if (editing.type === "sub") {
                response = await updateSub(editing.record.slug, {
                    name: values.name,
                    parent: values.parent,
                }, user?.token);
            } else {
                response = await updateProductType(editing.record.slug, {
                    name: values.name,
                    parent: values.parent,
                }, user?.token);
            }
            toast.success(`แก้ไข "${response.data.name}" แล้ว`);
            setEditing(null);
            editForm.resetFields();
            await loadData();
        } catch (error) {
            setLoading(false);
            toast.error(errorMessage(error, "แก้ไขประเภทสินค้าไม่สำเร็จ"));
        }
    };

    const deleteCategory = async (record) => {
        try {
            await removeCategory(record.slug, user?.token);
            toast.success(`ลบ "${record.name}" แล้ว`);
            await loadData();
        } catch (error) {
            toast.error(errorMessage(error, "ลบประเภทหลักไม่สำเร็จ"));
        }
    };

    const deleteSub = async (record) => {
        try {
            await removeSub(record.slug, user?.token);
            toast.success(`ลบ "${record.name}" แล้ว`);
            await loadData();
        } catch (error) {
            toast.error(errorMessage(error, "ลบประเภทย่อยไม่สำเร็จ"));
        }
    };

    const deleteProductType = async (record) => {
        try {
            await removeProductType(record.slug, user?.token);
            toast.success(`ลบ "${record.name}" แล้ว`);
            await loadData();
        } catch (error) {
            toast.error(errorMessage(error, "ลบประเภทสินค้าไม่สำเร็จ"));
        }
    };

    const rows = useMemo(() => categories.map((category) => ({
        ...category,
        children: subs
            .filter((sub) => (sub.parent?._id || sub.parent) === category._id)
            .map((sub) => ({
                ...sub,
                isSub: true,
                children: productTypes
                    .filter((type) => (type.parent?._id || type.parent) === sub._id)
                    .map((type) => ({ ...type, isProductType: true })),
            })),
    })), [categories, productTypes, subs]);

    const columns = [
        {
            title: "ชื่อประเภทสินค้า",
            dataIndex: "name",
            render: (name, record) => (
                <Space>
                    <span>{name}</span>
                    <Tag color={record.isProductType ? "purple" : record.isSub ? "cyan" : "blue"}>
                        {record.isProductType ? "ระดับ 3" : record.isSub ? "ระดับ 2" : "ระดับ 1"}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "อยู่ภายใต้",
            render: (_, record) => (record.isSub || record.isProductType)
                ? record.parent?.name || "-"
                : "-",
            responsive: ["sm"],
        },
        {
            title: "จัดการ",
            width: 150,
            align: "right",
            render: (_, record) => (
                <Space>
                    <Button type="text" aria-label="แก้ไข" icon={<EditOutlined />}
                        onClick={() => openEdit(
                            record.isProductType ? "productType" : record.isSub ? "sub" : "category",
                            record
                        )} />
                    <Popconfirm
                        title={`ยืนยันการลบ "${record.name}"?`}
                        description={!record.isProductType && record.children?.length
                            ? "ต้องลบรายการระดับถัดไปภายในก่อน"
                            : "รายการที่ลบแล้วไม่สามารถกู้คืนได้"}
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        disabled={!record.isProductType && Boolean(record.children?.length)}
                        onConfirm={() => record.isProductType
                            ? deleteProductType(record)
                            : record.isSub ? deleteSub(record) : deleteCategory(record)}
                    >
                        <Button type="text" danger aria-label="ลบ" icon={<DeleteOutlined />}
                            disabled={!record.isProductType && Boolean(record.children?.length)} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <main>
                <Title level={2}>จัดการ Category 3 ระดับ</Title>
                <Paragraph type="secondary">
                    หมวดหลัก → หมวดย่อย → ประเภทสินค้า
                </Paragraph>

                <Row gutter={[20, 20]}>
                    <Col xs={24} xl={8}>
                        <Card title="Level 1: หมวดหลัก" extra={<FolderAddOutlined />}>
                            <Form form={categoryForm} layout="vertical" onFinish={submitCategory}>
                                <Form.Item name="name" label="ชื่อหมวดหลัก"
                                    rules={[
                                        { required: true, message: "กรุณากรอกชื่อหมวดหลัก" },
                                        { min: 2, max: 50, message: "กรอกข้อมูล 2-50 ตัวอักษร" },
                                    ]}>
                                    <Input size="large" placeholder="เช่น เครื่องมือช่าง" />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}
                                    loading={loading} block>
                                    เพิ่มหมวดหลัก
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Card title="Level 2: หมวดย่อย" extra={<FolderAddOutlined />}>
                            <Form form={subForm} layout="vertical" onFinish={submitSub}>
                                <Form.Item name="parent" label="หมวดหลัก"
                                    rules={[{ required: true, message: "กรุณาเลือกหมวดหลัก" }]}>
                                    <Select size="large" placeholder="เลือกหมวดหลัก"
                                        options={categories.map((item) => ({
                                            value: item._id,
                                            label: item.name,
                                        }))} />
                                </Form.Item>
                                <Form.Item name="name" label="ชื่อหมวดย่อย"
                                    rules={[
                                        { required: true, message: "กรุณากรอกชื่อประเภทย่อย" },
                                        { min: 2, max: 50, message: "กรอกข้อมูล 2-50 ตัวอักษร" },
                                    ]}>
                                    <Input size="large" placeholder="เช่น สว่านไฟฟ้า" />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}
                                    loading={loading} disabled={!categories.length} block>
                                    เพิ่มหมวดย่อย
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                    <Col xs={24} xl={8}>
                        <Card title="Level 3: ประเภทสินค้า" extra={<FolderAddOutlined />}>
                            <Form form={productTypeForm} layout="vertical" onFinish={submitProductType}>
                                <Form.Item name="parent" label="หมวดย่อย"
                                    rules={[{ required: true, message: "กรุณาเลือกหมวดย่อย" }]}>
                                    <Select size="large" placeholder="เลือกหมวดย่อย"
                                        options={subs.map((item) => ({
                                            value: item._id,
                                            label: `${item.parent?.name ? `${item.parent.name} / ` : ""}${item.name}`,
                                        }))} />
                                </Form.Item>
                                <Form.Item name="name" label="ชื่อประเภทสินค้า"
                                    rules={[
                                        { required: true, message: "กรุณากรอกชื่อประเภทสินค้า" },
                                        { min: 2, max: 50, message: "กรอกข้อมูล 2-50 ตัวอักษร" },
                                    ]}>
                                    <Input size="large" placeholder="เช่น สว่านไร้สาย" />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}
                                    loading={loading} disabled={!subs.length} block>
                                    เพิ่มประเภทสินค้า
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                </Row>

                <Card title="รายการประเภทสินค้า" className="category-list-card">
                    <Table
                        rowKey="_id"
                        columns={columns}
                        dataSource={rows}
                        loading={loading}
                        pagination={false}
                        locale={{ emptyText: <Empty description="ยังไม่มีประเภทสินค้า" /> }}
                        expandable={{ defaultExpandAllRows: true }}
                    />
                </Card>
            </main>

            <Modal
                title={editing?.type === "productType"
                    ? "แก้ไขประเภทสินค้า"
                    : editing?.type === "sub" ? "แก้ไขหมวดย่อย" : "แก้ไขหมวดหลัก"}
                open={Boolean(editing)}
                onCancel={() => setEditing(null)}
                onOk={() => editForm.submit()}
                confirmLoading={loading}
                okText="บันทึก"
                cancelText="ยกเลิก"
                destroyOnHidden
            >
                <Form form={editForm} layout="vertical" onFinish={submitEdit}>
                    {editing?.type === "sub" && (
                        <Form.Item name="parent" label="หมวดหลัก"
                            rules={[{ required: true, message: "กรุณาเลือกหมวดหลัก" }]}>
                            <Select options={categories.map((item) => ({
                                value: item._id,
                                label: item.name,
                            }))} />
                        </Form.Item>
                    )}
                    {editing?.type === "productType" && (
                        <Form.Item name="parent" label="หมวดย่อย"
                            rules={[{ required: true, message: "กรุณาเลือกหมวดย่อย" }]}>
                            <Select options={subs.map((item) => ({
                                value: item._id,
                                label: `${item.parent?.name ? `${item.parent.name} / ` : ""}${item.name}`,
                            }))} />
                        </Form.Item>
                    )}
                    <Form.Item name="name" label="ชื่อประเภท"
                        rules={[
                            { required: true, message: "กรุณากรอกชื่อประเภท" },
                            { min: 2, max: 50, message: "กรอกข้อมูล 2-50 ตัวอักษร" },
                        ]}>
                        <Input autoFocus />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CategoryCreate;
