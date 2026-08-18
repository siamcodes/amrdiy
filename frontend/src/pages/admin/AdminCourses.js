import React, { useEffect, useState } from "react";
import { BookOutlined, DeleteOutlined, EditOutlined, PlusOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Image, Input, InputNumber, Modal, Popconfirm, Progress, Row, Select, Space, Switch, Table, Tag, Typography, Upload, message } from "antd";
import AdminNav from "../../components/nav/AdminNav";
import RichTextEditor from "../../components/forms/RichTextEditor";
import { createCourse, deleteCourse, getAdminCourses, updateCourse, uploadCourseVideo } from "../../functions/course";
import { uploadUserImage } from "../../functions/user";
import { useSelector } from "react-redux";

const { Text, Title } = Typography;
const emptyCourse = { title: "", slug: "", subtitle: "", description: "", thumbnail: { url: "", public_id: "", alt: "" }, introVideo: {}, price: 0, status: "draft", level: "all", category: "", learningOutcomes: [], requirements: [], sections: [] };
const fileToDataUrl = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });

const AdminCourses = () => {
  const user = useSelector((state) => state.user);
  const [courses, setCourses] = useState([]);
  const [values, setValues] = useState(emptyCourse);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const categoryOptions = [...new Set(courses.map((course) => course.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "th"))
    .map((category) => ({ value: category, label: category }));
  const load = () => getAdminCourses().then(({ data }) => setCourses(data)).catch(() => message.error("โหลดคอร์สไม่สำเร็จ"));
  useEffect(() => { load(); }, []);
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const addSection = () => update("sections", [...values.sections, { title: "", description: "", lessons: [] }]);
  const changeSection = (index, patch) => update("sections", values.sections.map((section, itemIndex) => itemIndex === index ? { ...section, ...patch } : section));
  const addLesson = (sectionIndex) => changeSection(sectionIndex, { lessons: [...values.sections[sectionIndex].lessons, { title: "", description: "", content: "", video: {}, durationMinutes: 0, preview: false }] });
  const changeLesson = (sectionIndex, lessonIndex, patch) => changeSection(sectionIndex, { lessons: values.sections[sectionIndex].lessons.map((lesson, itemIndex) => itemIndex === lessonIndex ? { ...lesson, ...patch } : lesson) });
  const uploadCover = async (file) => {
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) { message.error("รองรับรูปภาพขนาดไม่เกิน 4 MB"); return Upload.LIST_IGNORE; }
    setUploading("cover");
    try { const { data } = await uploadUserImage(await fileToDataUrl(file), "course-cover", user?.token, values.thumbnail?.public_id); update("thumbnail", { ...data, alt: values.title }); message.success("อัปโหลดรูปปกแล้ว"); }
    catch { message.error("อัปโหลดรูปปกไม่สำเร็จ"); } finally { setUploading(""); }
    return Upload.LIST_IGNORE;
  };
  const sendVideo = async (file, target, sectionIndex, lessonIndex) => {
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
    if (!allowed.includes(file.type) || file.size > 2 * 1024 * 1024 * 1024) { message.error("รองรับ MP4, WebM, MOV, M4V ขนาดไม่เกิน 2 GB"); return Upload.LIST_IGNORE; }
    const uploadKey = target === "intro" ? "intro" : `${sectionIndex}-${lessonIndex}`;
    setUploading(uploadKey); setUploadProgress(0);
    try {
      const { data } = await uploadCourseVideo(file, (event) => setUploadProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0));
      if (target === "intro") update("introVideo", data); else changeLesson(sectionIndex, lessonIndex, { video: data });
      message.success("อัปโหลดวิดีโอไปยัง MinIO แล้ว");
    } catch (error) { message.error(error.response?.data?.message || "อัปโหลดวิดีโอไม่สำเร็จ"); }
    finally { setUploading(""); setUploadProgress(0); }
    return Upload.LIST_IGNORE;
  };
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
        <Row gutter={16}><Col xs={12} md={6}><Form.Item label="ราคา"><InputNumber min={0} className="full-width" value={values.price} onChange={(value) => update("price", value)} /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="ระดับ"><Select value={values.level} onChange={(value) => update("level", value)} options={[{ value: "all", label: "ทุกระดับ" }, { value: "beginner", label: "เริ่มต้น" }, { value: "intermediate", label: "ปานกลาง" }, { value: "advanced", label: "ขั้นสูง" }]} /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="หมวด"><Select mode="tags" maxCount={1} allowClear showSearch className="full-width" value={values.category ? [values.category] : []} onChange={(items) => update("category", items.at(-1) || "")} options={categoryOptions} placeholder="เลือกหรือพิมพ์หมวดใหม่" tokenSeparators={[","]} /></Form.Item></Col><Col xs={12} md={6}><Form.Item label="สถานะ"><Select value={values.status} onChange={(value) => update("status", value)} options={[{ value: "draft", label: "ฉบับร่าง" }, { value: "published", label: "เผยแพร่" }]} /></Form.Item></Col></Row>
        <Row gutter={16}><Col xs={24} md={12}><Card size="small" title="รูปปก Course (Cloudinary)">{values.thumbnail?.url && <Image src={values.thumbnail.url} style={{ maxHeight: 220, objectFit: "cover" }} />}<Upload accept="image/*" showUploadList={false} beforeUpload={uploadCover}><Button block icon={<UploadOutlined />} loading={uploading === "cover"} style={{ marginTop: 12 }}>อัปโหลดรูปปก</Button></Upload></Card></Col>
          <Col xs={24} md={12}><Card size="small" title="วิดีโอแนะนำ Course (MinIO)"><Text>{values.introVideo?.fileName || "ยังไม่มีวิดีโอแนะนำ"}</Text><Upload accept="video/mp4,video/webm,video/quicktime,video/x-m4v" showUploadList={false} beforeUpload={(file) => sendVideo(file, "intro")}><Button block icon={<UploadOutlined />} loading={uploading === "intro"} style={{ marginTop: 12 }}>อัปโหลดวิดีโอแนะนำ</Button></Upload>{uploading === "intro" && <Progress percent={uploadProgress} />}</Card></Col></Row>
        <Form.Item label="สิ่งที่จะได้เรียนรู้"><Select mode="tags" value={values.learningOutcomes} onChange={(value) => update("learningOutcomes", value)} /></Form.Item>
        <Card title="โครงสร้างบทเรียน" extra={<Button icon={<PlusOutlined />} onClick={addSection}>เพิ่ม Section</Button>}>
          <Space direction="vertical" className="full-width" size="large">{values.sections.map((section, sectionIndex) => <Card size="small" key={section._id || sectionIndex} title={`Section ${sectionIndex + 1}`} extra={<Button danger type="text" onClick={() => update("sections", values.sections.filter((_, index) => index !== sectionIndex))}>ลบ</Button>}>
            <Input value={section.title} onChange={(e) => changeSection(sectionIndex, { title: e.target.value })} placeholder="ชื่อ Section" />
            <Space direction="vertical" className="full-width" style={{ marginTop: 12 }}>{section.lessons.map((lesson, lessonIndex) => <Card size="small" key={lesson._id || lessonIndex}>
              <Row gutter={[8, 8]}><Col xs={24} md={10}><Input value={lesson.title} onChange={(e) => changeLesson(sectionIndex, lessonIndex, { title: e.target.value })} placeholder="ชื่อบทเรียน" /></Col><Col xs={12} md={5}><InputNumber min={0} value={lesson.durationMinutes} onChange={(value) => changeLesson(sectionIndex, lessonIndex, { durationMinutes: value })} addonAfter="นาที" /></Col><Col xs={12} md={4}><Space><Switch checked={lesson.preview} onChange={(value) => changeLesson(sectionIndex, lessonIndex, { preview: value })} /> Preview</Space></Col><Col xs={24} md={5}><Upload accept="video/mp4,video/webm,video/quicktime,video/x-m4v" showUploadList={false} beforeUpload={(file) => sendVideo(file, "lesson", sectionIndex, lessonIndex)}><Button block icon={<UploadOutlined />} loading={uploading === `${sectionIndex}-${lessonIndex}`}>วิดีโอบทเรียน</Button></Upload></Col></Row>
              {lesson.video?.fileName && <Text type="secondary">ไฟล์: {lesson.video.fileName}</Text>}
              {uploading === `${sectionIndex}-${lessonIndex}` && <Progress percent={uploadProgress} />}
              <div style={{ marginTop: 12 }}><Text strong>เนื้อหาบทเรียน</Text><RichTextEditor value={lesson.content || ""} onChange={(content) => changeLesson(sectionIndex, lessonIndex, { content })} placeholder="เพิ่มเนื้อหา รูปภาพ ตัวอย่างโค้ด และคำอธิบายบทเรียน..." /></div>
            </Card>)}</Space><Button block type="dashed" icon={<PlusOutlined />} style={{ marginTop: 12 }} onClick={() => addLesson(sectionIndex)}>เพิ่มบทเรียน</Button>
          </Card>)}</Space>
        </Card>
      </Form>
    </Modal>
  </main></div>;
};
export default AdminCourses;
