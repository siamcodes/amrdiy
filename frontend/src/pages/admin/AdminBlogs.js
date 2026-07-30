import React, { useCallback, useEffect, useState } from "react";
import {
  Button, Card, Col, Form, Image, Input, Modal, Popconfirm, Row, Select,
  Space, Switch, Table, Tag, Typography, Upload, message,
} from "antd";
import {
  DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined,
  SaveOutlined, UploadOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import AdminNav from "../../components/nav/AdminNav";
import RichTextEditor from "../../components/forms/RichTextEditor";
import { getProductsByCount } from "../../functions/product";
import { uploadUserImage } from "../../functions/user";
import { createBlog, deleteBlog, getAdminBlogs, updateBlog } from "../../functions/blog";

const { Title, Text } = Typography;
const emptyBlog = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  heroImage: {},
  tags: [],
  featuredProducts: [],
  status: "draft",
  featured: false,
  seoTitle: "",
  seoDescription: "",
};
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const AdminBlogs = () => {
  const user = useSelector((state) => state.user);
  const [blogs, setBlogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [values, setValues] = useState(emptyBlog);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [blogRes, productRes] = await Promise.all([
        getAdminBlogs(user?.token),
        getProductsByCount(1000),
      ]);
      setBlogs(blogRes.data);
      setProducts(productRes.data);
    } catch {
      message.error("โหลดข้อมูลบทความไม่สำเร็จ");
    }
  }, [user?.token]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setValues(emptyBlog); setEditorOpen(true); };
  const openEdit = (blog) => {
    setValues({
      ...blog,
      featuredProducts: (blog.featuredProducts || []).map((item) => item._id || item),
    });
    setEditorOpen(true);
  };
  const save = async () => {
    if (!values.title.trim() || !values.content || values.content === "<p><br></p>") {
      return message.warning("กรุณากรอกหัวข้อและเนื้อหาบทความ");
    }
    setSaving(true);
    try {
      if (values._id) await updateBlog(values._id, values, user.token);
      else await createBlog(values, user.token);
      message.success("บันทึกบทความแล้ว");
      setEditorOpen(false);
      load();
    } catch (error) {
      message.error(error.response?.data?.message || "บันทึกบทความไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };
  const uploadHero = async (file) => {
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
      message.error("รองรับรูปภาพขนาดไม่เกิน 4 MB");
      return Upload.LIST_IGNORE;
    }
    setUploading(true);
    try {
      const { data } = await uploadUserImage(
        await fileToDataUrl(file),
        "blog-hero",
        user.token
      );
      setValues((current) => ({ ...current, heroImage: { ...data, alt: current.title } }));
      message.success("อัปโหลด Hero image แล้ว");
    } catch {
      message.error("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE;
  };

  return <div className="admin-page-grid">
    <Card className="admin-sidebar-card"><AdminNav /></Card>
    <main>
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col><Title level={2}><FileTextOutlined /> บทความ Blog</Title><Text type="secondary">สร้าง Content Marketing และเชื่อมสินค้าเพื่อส่งเสริมการขาย</Text></Col>
        <Col><Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>เขียนบทความ</Button></Col>
      </Row>
      <Card style={{ marginTop: 16 }}>
        <Table rowKey="_id" dataSource={blogs} scroll={{ x: 900 }} columns={[
          { title: "Hero", dataIndex: "heroImage", width: 100, render: (image) => <Image width={72} height={48} style={{ objectFit: "cover" }} src={image?.url} preview={false} /> },
          { title: "หัวข้อ", render: (_, item) => <Space direction="vertical" size={0}><Text strong>{item.title}</Text><Text type="secondary">/{item.slug}</Text></Space> },
          { title: "Tag", dataIndex: "tags", render: (tags) => <Space wrap>{tags?.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space> },
          { title: "สินค้าโปรโมต", dataIndex: "featuredProducts", render: (items) => items?.length || 0 },
          { title: "สถานะ", dataIndex: "status", render: (status) => <Tag color={status === "published" ? "green" : "default"}>{status === "published" ? "เผยแพร่" : "ฉบับร่าง"}</Tag> },
          { title: "ยอดอ่าน", dataIndex: "views" },
          { title: "", render: (_, item) => <Space><Button icon={<EditOutlined />} onClick={() => openEdit(item)}>แก้ไข</Button><Popconfirm title="ลบบทความนี้?" onConfirm={async () => { await deleteBlog(item._id, user.token); message.success("ลบบทความแล้ว"); load(); }}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space> },
        ]} />
      </Card>
    </main>

    <Modal open={editorOpen} onCancel={() => setEditorOpen(false)} width={1100}
      title={values._id ? "แก้ไขบทความ" : "เขียนบทความใหม่"}
      footer={<Space><Button onClick={() => setEditorOpen(false)}>ยกเลิก</Button><Button type="primary" loading={saving} icon={<SaveOutlined />} onClick={save}>บันทึกบทความ</Button></Space>}>
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Form layout="vertical">
            <Form.Item label="หัวข้อบทความ" required><Input size="large" value={values.title} maxLength={240} showCount onChange={(e) => setValues({ ...values, title: e.target.value })} /></Form.Item>
            <Form.Item label="คำโปรย"><Input.TextArea rows={3} maxLength={500} showCount value={values.excerpt} onChange={(e) => setValues({ ...values, excerpt: e.target.value })} /></Form.Item>
            <Form.Item label="เนื้อหาบทความ" required>
              <RichTextEditor value={values.content} onChange={(content) => setValues((current) => ({ ...current, content }))} placeholder="เขียนบทความ รีวิวสินค้า หรือคู่มือการใช้งาน..." />
            </Form.Item>
          </Form>
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small" title="Hero image">
            {values.heroImage?.url && <Image src={values.heroImage.url} style={{ width: "100%", maxHeight: 200, objectFit: "cover" }} />}
            <Upload accept="image/*" showUploadList={false} beforeUpload={uploadHero}>
              <Button block loading={uploading} icon={<UploadOutlined />} style={{ marginTop: 12 }}>เลือกรูป Hero</Button>
            </Upload>
            <Input style={{ marginTop: 12 }} placeholder="Alt text" value={values.heroImage?.alt} onChange={(e) => setValues({ ...values, heroImage: { ...values.heroImage, alt: e.target.value } })} />
          </Card>
          <Card size="small" title="การเผยแพร่" style={{ marginTop: 16 }}>
            <Form layout="vertical">
              <Form.Item label="Slug"><Input value={values.slug} placeholder="สร้างอัตโนมัติจากหัวข้อ" onChange={(e) => setValues({ ...values, slug: e.target.value })} /></Form.Item>
              <Form.Item label="Tag"><Select mode="tags" tokenSeparators={[","]} value={values.tags} onChange={(tags) => setValues({ ...values, tags })} placeholder="พิมพ์แล้วกด Enter" /></Form.Item>
              <Form.Item label="สินค้าที่ต้องการโปรโมต"><Select mode="multiple" showSearch optionFilterProp="label" value={values.featuredProducts} onChange={(featuredProducts) => setValues({ ...values, featuredProducts })} options={products.map((p) => ({ value: p._id, label: `${p.title}${p.sku ? ` · ${p.sku}` : ""}` }))} /></Form.Item>
              <Form.Item label="สถานะ"><Select value={values.status} onChange={(status) => setValues({ ...values, status })} options={[{ value: "draft", label: "ฉบับร่าง" }, { value: "published", label: "เผยแพร่" }]} /></Form.Item>
              <Space><Switch checked={values.featured} onChange={(featured) => setValues({ ...values, featured })} /> บทความแนะนำ</Space>
            </Form>
          </Card>
          <Card size="small" title="SEO" style={{ marginTop: 16 }}>
            <Form layout="vertical">
              <Form.Item label="SEO Title">
                <Input
                  placeholder="ชื่อบทความสำหรับผลการค้นหา"
                  maxLength={150}
                  showCount
                  value={values.seoTitle || ""}
                  onChange={(e) => setValues({ ...values, seoTitle: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="Meta Description" style={{ marginBottom: 0 }}>
                <Input.TextArea
                  rows={4}
                  placeholder="คำอธิบายบทความสำหรับผลการค้นหา"
                  maxLength={250}
                  showCount
                  value={values.seoDescription || ""}
                  onChange={(e) => setValues({ ...values, seoDescription: e.target.value })}
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Modal>
  </div>;
};

export default AdminBlogs;
