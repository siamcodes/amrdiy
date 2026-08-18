import React, { useEffect, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined, LockOutlined, PlayCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { Button, Card, Collapse, Col, Empty, Row, Space, Tag, Typography, message } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { confirmCoursePayment, courseMediaUrl, createCoursePaymentIntent, enrollFreeCourse, getCourse } from "../../functions/course";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY);
const { Paragraph, Title, Text } = Typography;

const PaidEnrollButton = ({ course, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const pay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    try {
      const { data } = await createCoursePaymentIntent(course._id);
      const result = await stripe.confirmCardPayment(data.clientSecret, { payment_method: { card: elements.getElement(CardElement) } });
      if (result.error) throw new Error(result.error.message);
      await confirmCoursePayment(course._id, result.paymentIntent.id);
      message.success("ชำระเงินและลงทะเบียนคอร์สแล้ว");
      onSuccess();
    } catch (error) { message.error(error.response?.data?.message || error.message || "ชำระเงินไม่สำเร็จ"); }
    finally { setPaying(false); }
  };
  return <Space direction="vertical" size="middle" className="full-width">
    <CardElement options={{ hidePostalCode: true }} />
    <Button type="primary" size="large" block loading={paying} onClick={pay}>ชำระ ฿{course.price.toLocaleString("th-TH")} และเริ่มเรียน</Button>
  </Space>;
};

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = () => getCourse(slug).then(({ data: response }) => setData(response)).finally(() => setLoading(false));
  useEffect(() => { setLoading(true); load().catch(() => setData(null)); }, [slug]);
  if (loading) return <Card loading />;
  if (!data) return <Card><Empty description="ไม่พบคอร์ส" /></Card>;
  const { course, enrolled } = data;
  const lessonCount = course.sections.reduce((total, section) => total + section.lessons.length, 0);
  const duration = course.sections.reduce((total, section) => total + section.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0), 0);
  const enrollFree = async () => {
    if (!user) return navigate("/login", { state: { from: `/courses/${slug}` } });
    try { await enrollFreeCourse(course._id); message.success("ลงทะเบียนคอร์สแล้ว"); load(); }
    catch (error) { message.error(error.response?.data?.message || "ลงทะเบียนไม่สำเร็จ"); }
  };

  return <div className="course-detail-page">
    <Row gutter={[28, 28]}>
      <Col xs={24} lg={16}>
        {course.introVideo?.playbackUrl && <div className="course-video course-intro-video"><video controls crossOrigin="use-credentials" preload="metadata" src={courseMediaUrl(course.introVideo.playbackUrl)} /></div>}
        <Tag color="blue">{course.category || "COURSE"}</Tag>
        <Title>{course.title}</Title><Paragraph className="course-subtitle">{course.subtitle}</Paragraph>
        <Space wrap split="·"><Text><BookOutlined /> {lessonCount} บทเรียน</Text><Text><ClockCircleOutlined /> {duration} นาที</Text><Text><TeamOutlined /> {course.enrollmentCount || 0} ผู้เรียน</Text></Space>
        <Card className="course-description"><div dangerouslySetInnerHTML={{ __html: course.description }} /></Card>
        {!!course.learningOutcomes.length && <section><Title level={3}>สิ่งที่จะได้เรียนรู้</Title><Row gutter={[12, 12]}>{course.learningOutcomes.map((item) => <Col xs={24} md={12} key={item}><CheckCircleOutlined className="course-check" /> {item}</Col>)}</Row></section>}
        <section><Title level={3}>เนื้อหาหลักสูตร</Title><Collapse items={course.sections.map((section) => ({
          key: section._id, label: `${section.title} · ${section.lessons.length} บทเรียน`, children: <Space direction="vertical" className="full-width">
            {section.lessons.map((lesson) => <div className="course-lesson-row" key={lesson._id}><span>{lesson.video?.playbackUrl ? <PlayCircleOutlined /> : <LockOutlined />} {lesson.title}</span><Text type="secondary">{lesson.durationMinutes} นาที</Text></div>)}
          </Space>,
        }))} /></section>
      </Col>
      <Col xs={24} lg={8}><Card className="course-enroll-card" cover={<img src={course.thumbnail?.url || "/amrdiy-logo.svg"} alt={course.thumbnail?.alt || course.title} />}>
        <Title level={2}>{course.price > 0 ? `฿${course.price.toLocaleString("th-TH")}` : "เรียนฟรี"}</Title>
        {enrolled ? <Button type="primary" size="large" block onClick={() => navigate(`/courses/${slug}/learn`)}>เข้าเรียนต่อ</Button>
          : !user ? <Button type="primary" size="large" block onClick={() => navigate("/login")}>เข้าสู่ระบบเพื่อลงทะเบียน</Button>
            : course.price <= 0 ? <Button type="primary" size="large" block onClick={enrollFree}>ลงทะเบียนเรียนฟรี</Button>
              : <Elements stripe={stripePromise}><PaidEnrollButton course={course} onSuccess={load} /></Elements>}
      </Card></Col>
    </Row>
  </div>;
};

export default CourseDetail;
