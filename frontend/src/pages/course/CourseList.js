import React, { useEffect, useState } from "react";
import { BookOutlined, ClockCircleOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import { Card, Col, Empty, Input, Row, Select, Skeleton, Space, Tag, Typography, message } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { getCourses } from "../../functions/course";

const { Paragraph, Title, Text } = Typography;
const levelLabels = { all: "ทุกระดับ", beginner: "เริ่มต้น", intermediate: "ปานกลาง", advanced: "ขั้นสูง" };

const CourseList = () => {
  const [params, setParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const search = params.get("search") || "";
  const category = params.get("category") || "";

  useEffect(() => {
    setLoading(true);
    getCourses({ search: search || undefined, category: category || undefined })
      .then(({ data }) => setCourses(data))
      .catch(() => message.error("โหลดคอร์สไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [category, search]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const categories = [...new Set(courses.map((item) => item.category).filter(Boolean))];

  return <div className="course-page">
    <section className="course-hero">
      <Tag color="blue"><BookOutlined /> AMR DIY ACADEMY</Tag>
      <Title>คอร์สเรียนสำหรับนักสร้างและนักพัฒนา</Title>
      <Paragraph>เรียนรู้ Electronics, IoT และการเขียนโปรแกรมผ่านบทเรียนที่นำไปทำโปรเจกต์จริงได้</Paragraph>
      <Row gutter={[12, 12]} className="course-filters">
        <Col xs={24} md={16}><Input size="large" allowClear prefix={<SearchOutlined />} value={search}
          onChange={(event) => setFilter("search", event.target.value)} placeholder="ค้นหาคอร์สที่สนใจ" /></Col>
        <Col xs={24} md={8}><Select size="large" allowClear className="full-width" value={category || undefined}
          onChange={(value) => setFilter("category", value)} placeholder="ทุกหมวดคอร์ส"
          options={categories.map((item) => ({ value: item, label: item }))} /></Col>
      </Row>
    </section>
    {loading ? <Row gutter={[20, 20]}>{Array.from({ length: 6 }, (_, index) => <Col xs={24} md={12} xl={8} key={index}><Card><Skeleton active /></Card></Col>)}</Row>
      : !courses.length ? <Card><Empty description="ไม่พบคอร์สที่ค้นหา" /></Card>
        : <Row gutter={[20, 20]}>{courses.map((course) => <Col xs={24} md={12} xl={8} key={course._id}>
          <Card hoverable className="course-card" cover={<Link to={`/courses/${course.slug}`}>
            <img src={course.thumbnail?.url || "/amrdiy-logo.svg"} alt={course.thumbnail?.alt || course.title} />
          </Link>}>
            <Space wrap><Tag color="geekblue">{course.category || "ทั่วไป"}</Tag><Tag>{levelLabels[course.level]}</Tag></Space>
            <Link to={`/courses/${course.slug}`}><Title level={3} ellipsis={{ rows: 2 }}>{course.title}</Title></Link>
            <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{course.subtitle}</Paragraph>
            <Space wrap split="·"><Text><BookOutlined /> {course.lessonCount} บท</Text><Text><ClockCircleOutlined /> {course.durationMinutes} นาที</Text><Text><TeamOutlined /> {course.enrollmentCount || 0}</Text></Space>
            <div className="course-card-price">{course.price > 0 ? `฿${course.price.toLocaleString("th-TH")}` : "เรียนฟรี"}</div>
          </Card>
        </Col>)}</Row>}
  </div>;
};

export default CourseList;
