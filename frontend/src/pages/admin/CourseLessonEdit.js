import React, { useEffect, useState } from "react";
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Form, Input, InputNumber, Progress, Row, Space, Switch, Typography, Upload, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import AdminNav from "../../components/nav/AdminNav";
import RichTextEditor from "../../components/forms/RichTextEditor";
import { getAdminCourse, updateCourse, uploadCourseVideo } from "../../functions/course";

const { Text, Title } = Typography;

const CourseLessonEdit = () => {
  const { id, sectionIndex, lessonIndex } = useParams();
  const navigate = useNavigate();
  const sIndex = Number(sectionIndex);
  const lIndex = Number(lessonIndex);
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    getAdminCourse(id).then(({ data }) => {
      setCourse(data);
      setLesson(data.sections?.[sIndex]?.lessons?.[lIndex] || null);
    }).catch(() => message.error("โหลดคอร์สไม่สำเร็จ")).finally(() => setLoading(false));
  }, [id, sIndex, lIndex]);

  const update = (patch) => setLesson((current) => ({ ...current, ...patch }));

  const sendVideo = async (file) => {
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
    if (!allowed.includes(file.type) || file.size > 2 * 1024 * 1024 * 1024) { message.error("รองรับ MP4, WebM, MOV, M4V ขนาดไม่เกิน 2 GB"); return Upload.LIST_IGNORE; }
    setUploading(true); setUploadProgress(0);
    try {
      const { data } = await uploadCourseVideo(file, (event) => setUploadProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0));
      update({ video: data });
      message.success("อัปโหลดวิดีโอไปยัง MinIO แล้ว");
    } catch (error) { message.error(error.response?.data?.message || "อัปโหลดวิดีโอไม่สำเร็จ"); }
    finally { setUploading(false); setUploadProgress(0); }
    return Upload.LIST_IGNORE;
  };

  const save = async () => {
    if (!lesson.title.trim()) return message.warning("กรุณากรอกชื่อบทเรียน");
    setSaving(true);
    try {
      const sections = course.sections.map((section, index) => index === sIndex
        ? { ...section, lessons: section.lessons.map((item, itemIndex) => itemIndex === lIndex ? lesson : item) }
        : section);
      const { data } = await updateCourse(course._id, { ...course, sections });
      message.success("บันทึกเนื้อหาบทเรียนแล้ว");
      setCourse(data);
      navigate(`/admin/course/${course._id}`);
    } catch (error) { message.error(error.response?.data?.message || "บันทึกไม่สำเร็จ"); } finally { setSaving(false); }
  };

  return <div className="admin-page-grid"><Card className="admin-sidebar-card"><AdminNav /></Card><main>
    <Row justify="space-between" align="middle">
      <Col><Title level={2}>แก้ไขเนื้อหาบทเรียน</Title><Text type="secondary">{course?.title}</Text></Col>
      <Col><Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/admin/course/${id}`)}>กลับ</Button><Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={!lesson} onClick={save}>บันทึก</Button></Space></Col>
    </Row>
    <Card style={{ marginTop: 16 }} loading={loading}>
      {!loading && !lesson && <Text>ไม่พบบทเรียนนี้</Text>}
      {lesson && <Form layout="vertical">
        <Row gutter={[8, 8]}>
          <Col xs={24} md={12}><Form.Item label="ชื่อบทเรียน" required><Input value={lesson.title} onChange={(e) => update({ title: e.target.value })} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item label="ระยะเวลา"><InputNumber min={0} className="full-width" value={lesson.durationMinutes} onChange={(value) => update({ durationMinutes: value })} addonAfter="นาที" /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item label="เปิดให้ดูตัวอย่างฟรี"><Switch checked={lesson.preview} onChange={(value) => update({ preview: value })} /></Form.Item></Col>
        </Row>
        <Form.Item label="คำอธิบายสั้น"><Input value={lesson.description} onChange={(e) => update({ description: e.target.value })} /></Form.Item>
        <Card size="small" title="วิดีโอบทเรียน (MinIO)">
          <Text>{lesson.video?.fileName || "ยังไม่มีวิดีโอ"}</Text>
          <Upload accept="video/mp4,video/webm,video/quicktime,video/x-m4v" showUploadList={false} beforeUpload={sendVideo}><Button block icon={<UploadOutlined />} loading={uploading} style={{ marginTop: 12 }}>อัปโหลดวิดีโอบทเรียน</Button></Upload>
          {uploading && <Progress percent={uploadProgress} />}
        </Card>
        <Form.Item label="เนื้อหาบทเรียน" style={{ marginTop: 16 }}>
          <RichTextEditor value={lesson.content || ""} onChange={(content) => update({ content })} placeholder="เพิ่มเนื้อหา รูปภาพ ตัวอย่างโค้ด และคำอธิบายบทเรียน..." />
        </Form.Item>
      </Form>}
    </Card>
  </main></div>;
};
export default CourseLessonEdit;
