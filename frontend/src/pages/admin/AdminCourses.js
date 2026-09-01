import React, { useEffect, useState } from "react";
import { BookOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Popconfirm, Row, Space, Table, Tag, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../components/nav/AdminNav";
import { deleteCourse, getAdminCourses } from "../../functions/course";

const { Text, Title } = Typography;

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const load = () => getAdminCourses().then(({ data }) => setCourses(data)).catch(() => message.error("โหลดคอร์สไม่สำเร็จ"));
  useEffect(() => { load(); }, []);
  return <div className="admin-page-grid"><Card className="admin-sidebar-card"><AdminNav /></Card><main>
    <Row justify="space-between" align="middle"><Col><Title level={2}><BookOutlined /> Course</Title><Text type="secondary">สร้างหลักสูตร บทเรียน และกำหนดราคาจำหน่าย</Text></Col><Col><Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate("/admin/course")}>เพิ่มคอร์ส</Button></Col></Row>
    <Card style={{ marginTop: 16 }}><Table rowKey="_id" dataSource={courses} scroll={{ x: 900 }} columns={[
      { title: "คอร์ส", render: (_, item) => <Space direction="vertical" size={0}><Text strong>{item.title}</Text><Text type="secondary">/{item.slug}</Text></Space> },
      { title: "หมวด", dataIndex: "category" }, { title: "ราคา", dataIndex: "price", render: (price) => price ? `฿${price.toLocaleString("th-TH")}` : "ฟรี" },
      { title: "บทเรียน", render: (_, item) => item.sections.reduce((sum, section) => sum + section.lessons.length, 0) },
      { title: "ผู้เรียน", dataIndex: "enrollmentCount" }, { title: "สถานะ", dataIndex: "status", render: (status) => <Tag color={status === "published" ? "green" : "default"}>{status === "published" ? "เผยแพร่" : "ฉบับร่าง"}</Tag> },
      { title: "", render: (_, item) => <Space><Button icon={<EditOutlined />} onClick={() => navigate(`/admin/course/${item._id}`)}>แก้ไข</Button><Popconfirm title="ลบคอร์สนี้?" onConfirm={async () => { try { await deleteCourse(item._id); message.success("ลบแล้ว"); load(); } catch (error) { message.error(error.response?.data?.message || "ลบไม่ได้"); } }}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space> },
    ]} /></Card>
  </main></div>;
};
export default AdminCourses;
