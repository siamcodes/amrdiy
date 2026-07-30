import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm,
  Row, Select, Space, Switch, Table, Tabs, Tag, Typography, message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, TruckOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import AdminNav from "../../components/nav/AdminNav";
import { deleteShippingConfig, getShippingConfig, saveShippingConfig } from "../../functions/admin";

const { Title, Text } = Typography;
const labels = {
  providers: "บริษัทขนส่ง",
  services: "บริการขนส่ง",
  methods: "วิธีจัดส่ง",
  packages: "รูปแบบบรรจุภัณฑ์",
};

const ShippingManagement = () => {
  const user = useSelector((state) => state.user);
  const [data, setData] = useState({ providers: [], services: [], methods: [], packages: [] });
  const [resource, setResource] = useState("providers");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    try {
      const response = await getShippingConfig(user?.token);
      setData(response.data);
    } catch {
      message.error("โหลดการตั้งค่าขนส่งไม่สำเร็จ");
    }
  }, [user?.token]);
  useEffect(() => { load(); }, [load]);

  const edit = (record) => {
    form.setFieldsValue({
      ...record,
      provider: record.provider?._id || record.provider,
      service: record.service?._id || record.service,
    });
    setOpen(true);
  };
  const create = () => {
    form.resetFields();
    form.setFieldsValue({ active: true, minDeliveryDays: 1, maxDeliveryDays: 3 });
    setOpen(true);
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await saveShippingConfig(resource, values, user?.token);
      message.success("บันทึกข้อมูลแล้ว");
      setOpen(false);
      load();
    } catch (error) {
      if (error.response) message.error(error.response.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    await deleteShippingConfig(resource, id, user?.token);
    message.success("ลบข้อมูลแล้ว");
    load();
  };

  const columns = useMemo(() => ({
    providers: [
      { title: "บริษัท", dataIndex: "name" },
      { title: "รหัส", dataIndex: "code", render: (v) => <Tag>{v}</Tag> },
      { title: "เว็บไซต์", dataIndex: "website", render: (v) => v ? <a href={v} target="_blank" rel="noreferrer">{v}</a> : "-" },
    ],
    services: [
      { title: "บริษัท", render: (_, r) => r.provider?.name || "-" },
      { title: "บริการ", dataIndex: "name" },
      { title: "ระยะเวลา", render: (_, r) => `${r.minDeliveryDays}–${r.maxDeliveryDays} วัน` },
      { title: "น้ำหนักสูงสุด", dataIndex: "maxWeightKg", render: (v) => `${v} kg` },
      { title: "COD", dataIndex: "supportsCod", render: (v) => v ? <Tag color="green">รองรับ</Tag> : "-" },
    ],
    methods: [
      { title: "ชื่อที่ลูกค้าเห็น", dataIndex: "name" },
      { title: "บริษัท/บริการ", render: (_, r) => `${r.provider?.name || "-"} / ${r.service?.name || "-"}` },
      { title: "ราคาเริ่มต้น", dataIndex: "baseRate", render: (v) => `฿${Number(v).toLocaleString()}` },
      { title: "ต่อ kg", dataIndex: "perKgRate", render: (v) => `฿${Number(v).toLocaleString()}` },
      { title: "ส่งฟรีเมื่อ", dataIndex: "freeShippingThreshold", render: (v) => v ? `฿${Number(v).toLocaleString()}` : "-" },
    ],
    packages: [
      { title: "บรรจุภัณฑ์", dataIndex: "name" },
      { title: "ขนาด", render: (_, r) => `${r.lengthCm} × ${r.widthCm} × ${r.heightCm} cm` },
      { title: "น้ำหนักสูงสุด", dataIndex: "maxWeightKg", render: (v) => `${v} kg` },
      { title: "ค่าบรรจุเพิ่ม", dataIndex: "extraFee", render: (v) => `฿${Number(v).toLocaleString()}` },
    ],
  }), []);

  const activeColumn = { title: "สถานะ", dataIndex: "active", render: (v) => <Tag color={v ? "green" : "default"}>{v ? "เปิด" : "ปิด"}</Tag> };
  const actionColumn = {
    title: "", width: 100, render: (_, record) => <Space>
      <Button type="text" icon={<EditOutlined />} onClick={() => edit(record)} />
      <Popconfirm title="ยืนยันการลบ?" onConfirm={() => remove(record._id)}>
        <Button type="text" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </Space>,
  };

  const commonFields = <>
    <Row gutter={16}>
      <Col span={16}><Form.Item name="name" label="ชื่อ" rules={[{ required: true }]}><Input /></Form.Item></Col>
      <Col span={8}><Form.Item name="code" label="รหัส" rules={[{ required: true }]}><Input /></Form.Item></Col>
    </Row>
    <Form.Item name="active" label="เปิดใช้งาน" valuePropName="checked"><Switch /></Form.Item>
  </>;

  const formFields = {
    providers: <>{commonFields}<Form.Item name="logo" label="URL โลโก้"><Input /></Form.Item><Form.Item name="website" label="เว็บไซต์"><Input /></Form.Item><Form.Item name="trackingUrlTemplate" label="Tracking URL Template" extra="ใช้ {trackingNumber} แทนเลขพัสดุ"><Input placeholder="https://provider.com/track/{trackingNumber}" /></Form.Item><Form.Item name="contactPhone" label="เบอร์ติดต่อ"><Input /></Form.Item></>,
    services: <>{commonFields}<Form.Item name="provider" label="บริษัทขนส่ง" rules={[{ required: true }]}><Select options={data.providers.map((p) => ({ value: p._id, label: p.name }))} /></Form.Item><Form.Item name="description" label="รายละเอียด"><Input.TextArea /></Form.Item><Row gutter={16}><Col span={8}><Form.Item name="minDeliveryDays" label="เร็วสุด (วัน)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="maxDeliveryDays" label="ช้าสุด (วัน)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="maxWeightKg" label="สูงสุด (kg)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col></Row><Form.Item name="supportsCod" label="รองรับ COD" valuePropName="checked"><Switch /></Form.Item></>,
    methods: <>{commonFields}<Row gutter={16}><Col span={12}><Form.Item name="provider" label="บริษัทขนส่ง" rules={[{ required: true }]}><Select options={data.providers.map((p) => ({ value: p._id, label: p.name }))} /></Form.Item></Col><Col span={12}><Form.Item name="service" label="บริการ" rules={[{ required: true }]}><Select options={data.services.map((s) => ({ value: s._id, label: `${s.provider?.name} · ${s.name}` }))} /></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item name="baseRate" label="ราคาเริ่มต้น"><InputNumber min={0} prefix="฿" style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="perKgRate" label="ราคาต่อ kg"><InputNumber min={0} prefix="฿" style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="freeShippingThreshold" label="ส่งฟรีขั้นต่ำ"><InputNumber min={0} prefix="฿" style={{ width: "100%" }} /></Form.Item></Col></Row><Form.Item name="sortOrder" label="ลำดับ"><InputNumber min={0} /></Form.Item></>,
    packages: <>{commonFields}<Row gutter={16}>{["lengthCm", "widthCm", "heightCm"].map((name) => <Col span={8} key={name}><Form.Item name={name} label={{ lengthCm: "ยาว (cm)", widthCm: "กว้าง (cm)", heightCm: "สูง (cm)" }[name]} rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>)}</Row><Row gutter={16}><Col span={8}><Form.Item name="maxWeightKg" label="น้ำหนักสูงสุด (kg)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="packagingWeightKg" label="น้ำหนักกล่อง (kg)"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col><Col span={8}><Form.Item name="extraFee" label="ค่าบรรจุเพิ่ม"><InputNumber min={0} prefix="฿" style={{ width: "100%" }} /></Form.Item></Col></Row></>,
  };

  return <div className="admin-page-grid">
    <Card className="admin-sidebar-card"><AdminNav /></Card>
    <main>
      <Space direction="vertical" size={4}><Title level={2}><TruckOutlined /> การจัดส่ง</Title><Text type="secondary">กำหนดบริษัท บริการ ราคาที่ลูกค้าเลือก และมาตรฐานบรรจุภัณฑ์</Text></Space>
      <Card style={{ marginTop: 16 }}>
        <Tabs activeKey={resource} onChange={setResource} items={Object.keys(labels).map((key) => ({ key, label: labels[key] }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={create} style={{ marginBottom: 16 }}>เพิ่ม{labels[resource]}</Button>
        <Table rowKey="_id" dataSource={data[resource]} columns={[...columns[resource], activeColumn, actionColumn]} scroll={{ x: 800 }} />
      </Card>
    </main>
    <Modal open={open} title={`${form.getFieldValue("_id") ? "แก้ไข" : "เพิ่ม"}${labels[resource]}`} onCancel={() => setOpen(false)} onOk={save} confirmLoading={saving} width={720} destroyOnHidden>
      <Form form={form} layout="vertical"><Form.Item name="_id" hidden><Input /></Form.Item>{formFields[resource]}</Form>
    </Modal>
  </div>;
};

export default ShippingManagement;
