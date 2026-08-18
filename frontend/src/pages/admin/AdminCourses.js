import React, { useEffect, useState } from "react";
import { BookOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, Typography, message } from "antd";
import AdminNav from "../../components/nav/AdminNav";
import RichTextEditor from "../../components/forms/RichTextEditor";
import { createCourse, deleteCourse, getAdminCourses, updateCourse } from "../../functions/course";

const { Text, Title } = Typography;
const emptyCourse = { title: "", slug: "", subtitle: "", description: "", thumbnail: { url: "", alt: "" }, price: 0, status: "draft", level: "all", category: "", learningOutcomes: [], requirements: [], sections: [] };

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [values, setValues] = useState(emptyCourse);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = () => getAdminCourses().then(({ data }) => setCourses(data)).catch(() => message.error("โหลดคอร์สไม่สำเร็จ"));
  useEffect(() => { load(); }, []);
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const addSection = () => update("sections", [...values.sections, { title: "", description: "", lessons: [] }]);
  const changeSection = (index, patch) => update("sections", values.sections.map((section, itemIndex) => itemIndex === index ? { ...section, ...patch } : section));
  const addLesson = (sectionIndex) => changeSection(sectionIndex, { lessons: [...values.sections[sectionIndex].lessons, { title: "", description: "", videoUrl: "", durationMinutes: 0, preview: false }] });
  const changeLesson = (sectionIndex, lessonIndex, patch) => changeSection(sectionIndex, { lessons: values.sections[sectionIndex].lessons.map((lesson, itemIndex) => itemIndex === lessonIndex ? { ...lesson, ...patch } : lesson) });
  const save = async () => {
    if (!values.title.trim() || !values.description) return message.warning("กรุณากรอกชื่อและรายละเอียดคอร์ส");
    setSaving(true);
    try { if (values._id) await updateCourse(values._id, values); else await createCourse(values); message.success("บันทึกคอร์สแล้ว"); setOpen(false); load(); }
    catch (error) { message.error(error.response?.data?.message || "บันทึกไม่สำเร็จ"); } finally { setSaving(false); }
  };
  return <div className="admin-page-grid"><Card className="admin-sidebar-card"><AdminNav /></Card><main>
    <Row justify="space-between" align="middle"><Col><Title level={2}><BookOutlined /> Course</Title><Text type="secondary">สร้างหลักสูตร บทเรียน และกำหนดราคาจำหน่าย</Text></Col><Col><Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => { setValues(emptyCourse); setOpen(true); }}>เพิ่มคอร์ส</Button></Col></Row>
    <Card style={{ marginTop: 16 }}><Table rowKey="_id" dataSource={courses} scroll={{ x: 900 }} columns={[
      { title: "คอร์ส", render: (_, item) => <Space direction="vertical" size={0}><Text strong>{item.title}</Text><Text type="secondary">/{item.slug}</Text></Space> },
      { title: "หมวด", dataIndex: "category" }, { title: "ราคา", dataIndex: "price", render: (price) => price ? `฿${price.toLocaleString("th-TH")}` : "ฟรี" },
      { title: "บทเรียน", render: (_, item) => item.sections.reduce((sum, section) => sum + section.lessons.length, 0) },
      { title: "ผู้เรียน", dataIndex: "enrollmentCount" }, { title: "สถานะ", dataIndex: "status", render: (status) => <Tag color={status === "published" ? "green" : "default"}>{status === "published" ? "เผยแพร่" : "ฉบับร่าง"}</Tag> },
      { title: "", render: (_, item) => <Space><Button icon={<EditOutlined />} onClick={() => { setValues(item); setOpen(true); }}>แก้ไข</Button><Popconfirm title="ลบคอร์สนี้?" onConfirm={async () => { try { await deleteCourse(item._id); message.success("ลบแล้ว"); load(); } catch (error) { message.error(error.response?.data?.message || "ลบไม่ได้"); } }}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space> },
    ]} /></Card>
    <Modal open={open} onCancel={() => setOpen(false)} width={1100} title={values._id ? "แก้ไขคอร์ส" : "เพิ่มคอร์ส"} footer={<Space><Button onClick={() => setOpen(false)}>ยกเลิก</Button><Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>บันทึก</Button></Space>}>
      <Form layout="vertical"><Row gutter={16}><Col xs={24} md={16}><Form.Item label="ชื่อคอร์ส" required><Input value={values.title} onChange={(e) => update("title", e.target.value)} /></Form.Item></Col><Col xs={24} md={8}><Form.Item label="Slug"><Input value={values.slug} onChange={(e) => update("slug", e.target.value)} placeholder="สร้างอัตโนมัติ" /></Form.Item></Col></Row>
        <Form.Item label="คำโปรย"><Input value={values.subtitle} onChange={(e) => update("subtitle", e.target.value)} /></Form.Item>
        <Form.Item label="รายละเอียด" required><RichTextEditor value={values.description} onChange={(value) => update("description", value)} /></Form.Item>
        <Row gutter={16}><Col xs={12} md={6}><Form.Item label="ราคา"><InputNumber min={0} className="full-width" value={values.price} onChange={(value) => update("price", value)} /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="ระดับ"><Select value={values.level} onChange={(value) => update("level", value)} options={[{ value: "all", label: "ทุกระดับ" }, { value: "beginner", label: "เริ่มต้น" }, { value: "intermediate", label: "ปานกลาง" }, { value: "advanced", label: "ขั้นสูง" }]} /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="หมวด"><Input value={values.category} onChange={(e) => update("category", e.target.value)} /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="สถานะ"><Select value={values.status} onChange={(value) => update("status", value)} options={[{ value: "draft", label: "ฉบับร่าง" }, { value: "published", label: "เผยแพร่" }]} /></Form.Item></Col></Row>
        <Form.Item label="URL รูปปก"><Input value={values.thumbnail?.url} onChange={(e) => update("thumbnail", { ...values.thumbnail, url: e.target.value, alt: values.title })} /></Form.Item>
        <Form.Item label="สิ่งที่จะได้เรียนรู้"><Select mode="tags" value={values.learningOutcomes} onChange={(value) => update("learningOutcomes", value)} /></Form.Item>
        <Card title="โครงสร้างบทเรียน" extra={<Button icon={<PlusOutlined />} onClick={addSection}>เพิ่ม Section</Button>}>
          <Space direction="vertical" className="full-width" size="large">{values.sections.map((section, sectionIndex) => <Card size="small" key={section._id || sectionIndex} title={`Section ${sectionIndex + 1}`} extra={<Button danger type="text" onClick={() => update("sections", values.sections.filter((_, index) => index !== sectionIndex))}>ลบ</Button>}>
            <Input value={section.title} onChange={(e) => changeSection(sectionIndex, { title: e.target.value })} placeholder="ชื่อ Section" />
            <Space direction="vertical" className="full-width" style={{ marginTop: 12 }}>{section.lessons.map((lesson, lessonIndex) => <Card size="small" key={lesson._id || lessonIndex}>
              <Row gutter={[8, 8]}><Col xs={24} md={8}><Input value={lesson.title} onChange={(e) => changeLesson(sectionIndex, lessonIndex, { title: e.target.value })} placeholder="ชื่อบทเรียน" /></Col><Col xs={24} md={9}><Input value={lesson.videoUrl} onChange={(e) => changeLesson(sectionIndex, lessonIndex, { videoUrl: e.target.value })} placeholder="Video embed URL" /></Col><Col xs={12} md={4}><InputNumber min={0} value={lesson.durationMinutes} onChange={(value) => changeLesson(sectionIndex, lessonIndex, { durationMinutes: value })} addonAfter="นาที" /></Col><Col xs={12} md={3}><Space><Switch checked={lesson.preview} onChange={(value) => changeLesson(sectionIndex, lessonIndex, { preview: value })} /> Preview</Space></Col></Row>
            </Card>)}</Space><Button block type="dashed" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => addLesson(sectionIndex)}>เพิ่มบทเรียน</Button>
          </Card>)}</Space>
        </Card>
      </Form>
    </Modal>
  </main></div>;
};
export default AdminCourses;
