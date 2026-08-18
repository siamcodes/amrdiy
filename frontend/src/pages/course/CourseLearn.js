import React, { useEffect, useMemo, useState } from "react";
import { CheckCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Button, Card, Col, Collapse, Empty, Progress, Row, Space, Typography, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { completeCourseLesson, courseMediaUrl, getCourse } from "../../functions/course";
import parse from "html-react-parser";

const { Paragraph, Title, Text } = Typography;

const CourseLearn = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const load = () => getCourse(slug).then(({ data: response }) => {
    if (!response.enrolled) { navigate(`/courses/${slug}`, { replace: true }); return; }
    setData(response);
    const lessons = response.course.sections.flatMap((section) => section.lessons);
    setSelectedId((current) => current || String(lessons[0]?._id || ""));
  });
  useEffect(() => { load().catch(() => navigate(`/courses/${slug}`, { replace: true })); }, [slug]);
  const lessons = useMemo(() => data?.course.sections.flatMap((section) => section.lessons) || [], [data]);
  const selected = lessons.find((lesson) => String(lesson._id) === selectedId);
  const completed = data?.enrollment?.completedLessons?.map(String) || [];
  const progress = lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0;
  const markComplete = async () => {
    try { await completeCourseLesson(data.course._id, selected._id); message.success("บันทึกความคืบหน้าแล้ว"); await load(); }
    catch (error) { message.error(error.response?.data?.message || "บันทึกไม่สำเร็จ"); }
  };
  if (!data) return <Card loading />;
  if (!lessons.length) return <Card><Empty description="คอร์สนี้ยังไม่มีบทเรียน" /></Card>;
  return <div className="course-learn-page">
    <div className="course-learn-header"><div><Title level={2}>{data.course.title}</Title><Text type="secondary">ความคืบหน้า {progress}%</Text></div><Progress percent={progress} style={{ maxWidth: 320 }} /></div>
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={7}><Card title="บทเรียนในคอร์ส" className="course-learning-sidebar"><Collapse defaultActiveKey={data.course.sections.map((section) => String(section._id))}
        items={data.course.sections.map((section) => ({ key: section._id, label: section.title, children: <Space direction="vertical" className="full-width">
          {section.lessons.map((lesson) => <Button key={lesson._id} type={String(lesson._id) === selectedId ? "primary" : "text"} block className="course-lesson-button" onClick={() => setSelectedId(String(lesson._id))}
            icon={completed.includes(String(lesson._id)) ? <CheckCircleOutlined /> : <PlayCircleOutlined />}>{lesson.title}</Button>)}
        </Space> }))} /></Card></Col>
      <Col xs={24} lg={17}><Card className="course-player-card">
        {selected?.video?.playbackUrl ? <div className="course-video"><video controls crossOrigin="use-credentials" preload="metadata" src={courseMediaUrl(selected.video.playbackUrl)} /></div> : <Empty description="บทเรียนนี้ยังไม่มีวิดีโอ" />}
        <Title level={3}>{selected?.title}</Title><Paragraph>{selected?.description}</Paragraph>
        {selected?.content && <div className="blog-content course-lesson-content">{parse(selected.content)}</div>}
        <Button type="primary" icon={<CheckCircleOutlined />} disabled={completed.includes(String(selected?._id))} onClick={markComplete}>เรียนบทนี้จบแล้ว</Button>
      </Card></Col>
    </Row>
  </div>;
};

export default CourseLearn;
