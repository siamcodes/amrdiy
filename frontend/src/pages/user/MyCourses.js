import React, { useEffect, useState } from "react";
import { BookOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Progress, Row, Typography, message } from "antd";
import { Link } from "react-router-dom";
import { getMyCourses } from "../../functions/course";

const { Paragraph, Title } = Typography;
const MyCourses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getMyCourses().then(({ data }) => setItems(data)).catch(() => message.error("โหลดคอร์สของฉันไม่สำเร็จ")).finally(() => setLoading(false)); }, []);
  return <div><Title level={2}><BookOutlined /> คอร์สของฉัน</Title>
    {loading ? <Card loading /> : !items.length ? <Card><Empty description="ยังไม่มีคอร์สที่ลงทะเบียน"><Link to="/courses"><Button type="primary">เลือกดูคอร์ส</Button></Link></Empty></Card>
      : <Row gutter={[20, 20]}>{items.map((item) => <Col xs={24} md={12} xl={8} key={item._id}><Card className="course-card" cover={<img src={item.course?.thumbnail?.url || "/amrdiy-logo.svg"} alt={item.course?.title} />}>
        <Title level={3}>{item.course?.title}</Title><Paragraph type="secondary">{item.course?.subtitle}</Paragraph><Progress percent={item.progress} />
        <Link to={`/courses/${item.course?.slug}/learn`}><Button type="primary" block>{item.progress ? "เรียนต่อ" : "เริ่มเรียน"}</Button></Link>
      </Card></Col>)}</Row>}
  </div>;
};
export default MyCourses;
