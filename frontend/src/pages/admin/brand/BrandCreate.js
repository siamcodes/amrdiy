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
    createBrand, getBrands, removeBrand, updateBrand,
} from "../../../functions/brand";
import {
    createGeneration, getGenerations, removeGeneration, updateGeneration,
} from "../../../functions/generation";

const { Paragraph, Title } = Typography;

const BrandCreate = () => {
    const user = useSelector((state) => state.user);
    const [brandForm] = Form.useForm();
    const [generationForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [brands, setBrands] = useState([]);
    const [generations, setGenerations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [brandResponse, generationResponse] = await Promise.all([
                getBrands(),
                getGenerations(),
            ]);
            setBrands(brandResponse.data);
            setGenerations(generationResponse.data);
        } catch (error) {
            toast.error("โหลดข้อมูลยี่ห้อและรุ่นสินค้าไม่สำเร็จ");
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

    const submitBrand = async ({ name }) => {
        setLoading(true);
        try {
            const response = await createBrand({ name }, user?.token);
            brandForm.resetFields();
            toast.success(`เพิ่มยี่ห้อ "${response.data.name}" แล้ว`);
            await loadData();
        } catch (error) {
            setLoading(false);
            toast.error(errorMessage(error, "เพิ่มยี่ห้อไม่สำเร็จ"));
        }
    };

    const submitGeneration = async ({ name, parent }) => {
        setLoading(true);
        try {
            const response = await createGeneration({ name, parent }, user?.token);
            generationForm.resetFields(["name"]);
            toast.success(`เพิ่มรุ่นสินค้า "${response.data.name}" แล้ว`);
            await loadData();
        } catch (error) {
            setLoading(false);
            toast.error(errorMessage(error, "เพิ่มรุ่นสินค้าไม่สำเร็จ"));
        }
    };

    const openEdit = (type, record) => {
        setEditing({ type, record });
        editForm.setFieldsValue({
            name: record.name,
            parent: type === "generation" ? record.parent?._id || record.parent : undefined,
        });
    };

    const submitEdit = async (values) => {
        setLoading(true);
        try {
            const response = editing.type === "brand"
                ? await updateBrand(editing.record.slug, { name: values.name }, user?.token)
                : await updateGeneration(editing.record.slug, {
                    name: values.name,
                    parent: values.parent,
                }, user?.token);
            toast.success(`แก้ไข "${response.data.name}" แล้ว`);
            setEditing(null);
            editForm.resetFields();
            await loadData();
        } catch (error) {
            setLoading(false);
            toast.error(errorMessage(error, "แก้ไขยี่ห้อหรือรุ่นสินค้าไม่สำเร็จ"));
        }
    };

    const deleteBrand = async (record) => {
        try {
            await removeBrand(record.slug, user?.token);
            toast.success(`ลบ "${record.name}" แล้ว`);
            await loadData();
        } catch (error) {
            toast.error(errorMessage(error, "ลบยี่ห้อไม่สำเร็จ"));
        }
    };

    const deleteGeneration = async (record) => {
        try {
            await removeGeneration(record.slug, user?.token);
            toast.success(`ลบ "${record.name}" แล้ว`);
            await loadData();
        } catch (error) {
            toast.error(errorMessage(error, "ลบรุ่นสินค้าไม่สำเร็จ"));
        }
    };

    const rows = useMemo(() => brands.map((brand) => ({
        ...brand,
        children: generations
            .filter((generation) => (generation.parent?._id || generation.parent) === brand._id)
            .map((generation) => ({ ...generation, isGeneration: true })),
    })), [brands, generations]);

    const columns = [
        {
            title: "ยี่ห้อ / รุ่นสินค้า",
            dataIndex: "name",
            render: (name, record) => (
                <Space>
                    <span>{name}</span>
                    <Tag color={record.isGeneration ? "cyan" : "blue"}>
                        {record.isGeneration ? "ระดับ 2" : "ระดับ 1"}
                    </Tag>
                </Space>
            ),
        },
        {
            title: "ยี่ห้อ",
            render: (_, record) => record.isGeneration ? record.parent?.name || "-" : "-",
            responsive: ["sm"],
        },
        {
            title: "จัดการ",
            width: 150,
            align: "right",
            render: (_, record) => (
                <Space>
                    <Button type="text" aria-label="แก้ไข" icon={<EditOutlined />}
                        onClick={() => openEdit(record.isGeneration ? "generation" : "brand", record)} />
                    <Popconfirm
                        title={`ยืนยันการลบ "${record.name}"?`}
                        description={!record.isGeneration && record.children?.length
                            ? "ต้องลบรุ่นสินค้าภายในก่อน"
                            : "รายการที่ลบแล้วไม่สามารถกู้คืนได้"}
                        okText="ลบ"
                        cancelText="ยกเลิก"
                        disabled={!record.isGeneration && Boolean(record.children?.length)}
                        onConfirm={() => record.isGeneration ? deleteGeneration(record) : deleteBrand(record)}
                    >
                        <Button type="text" danger aria-label="ลบ" icon={<DeleteOutlined />}
                            disabled={!record.isGeneration && Boolean(record.children?.length)} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <main>
                <Title level={2}>จัดการยี่ห้อและรุ่นสินค้า 2 ระดับ</Title>
                <Paragraph type="secondary">
                    เพิ่มยี่ห้อก่อน จากนั้นเลือกยี่ห้อเพื่อเพิ่มรุ่นสินค้า
                </Paragraph>

                <Row gutter={[20, 20]}>
                    <Col xs={24} lg={12}>
                        <Card title="ระดับ 1: ยี่ห้อ" extra={<FolderAddOutlined />}>
                            <Form form={brandForm} layout="vertical" onFinish={submitBrand}>
                                <Form.Item name="name" label="ชื่อยี่ห้อ"
                                    rules={[
                                        { required: true, message: "กรุณากรอกชื่อยี่ห้อ" },
                                        { min: 2, max: 32, message: "กรอกข้อมูล 2-32 ตัวอักษร" },
                                    ]}>
                                    <Input size="large" placeholder="เช่น Bosch" />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}
                                    loading={loading} block>
                                    เพิ่มยี่ห้อ
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="ระดับ 2: รุ่นสินค้า" extra={<FolderAddOutlined />}>
                            <Form form={generationForm} layout="vertical" onFinish={submitGeneration}>
                                <Form.Item name="parent" label="ยี่ห้อ"
                                    rules={[{ required: true, message: "กรุณาเลือกยี่ห้อ" }]}>
                                    <Select size="large" placeholder="เลือกยี่ห้อ"
                                        options={brands.map((item) => ({
                                            value: item._id,
                                            label: item.name,
                                        }))} />
                                </Form.Item>
                                <Form.Item name="name" label="ชื่อรุ่นสินค้า"
                                    rules={[
                                        { required: true, message: "กรุณากรอกชื่อรุ่นสินค้า" },
                                        { min: 2, max: 32, message: "กรอกข้อมูล 2-32 ตัวอักษร" },
                                    ]}>
                                    <Input size="large" placeholder="เช่น GSB 13 RE" />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}
                                    loading={loading} disabled={!brands.length} block>
                                    เพิ่มรุ่นสินค้า
                                </Button>
                            </Form>
                        </Card>
                    </Col>
                </Row>

                <Card title="รายการยี่ห้อและรุ่นสินค้า" className="category-list-card">
                    <Table
                        rowKey="_id"
                        columns={columns}
                        dataSource={rows}
                        loading={loading}
                        pagination={false}
                        locale={{ emptyText: <Empty description="ยังไม่มียี่ห้อสินค้า" /> }}
                        expandable={{ defaultExpandAllRows: true }}
                    />
                </Card>
            </main>

            <Modal
                title={editing?.type === "generation" ? "แก้ไขรุ่นสินค้า" : "แก้ไขยี่ห้อ"}
                open={Boolean(editing)}
                onCancel={() => setEditing(null)}
                onOk={() => editForm.submit()}
                confirmLoading={loading}
                okText="บันทึก"
                cancelText="ยกเลิก"
                destroyOnHidden
            >
                <Form form={editForm} layout="vertical" onFinish={submitEdit}>
                    {editing?.type === "generation" && (
                        <Form.Item name="parent" label="ยี่ห้อ"
                            rules={[{ required: true, message: "กรุณาเลือกยี่ห้อ" }]}>
                            <Select options={brands.map((item) => ({
                                value: item._id,
                                label: item.name,
                            }))} />
                        </Form.Item>
                    )}
                    <Form.Item name="name" label={editing?.type === "generation" ? "ชื่อรุ่นสินค้า" : "ชื่อยี่ห้อ"}
                        rules={[
                            { required: true, message: "กรุณากรอกชื่อ" },
                            { min: 2, max: 32, message: "กรอกข้อมูล 2-32 ตัวอักษร" },
                        ]}>
                        <Input autoFocus />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BrandCreate;
