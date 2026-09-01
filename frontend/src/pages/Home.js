import React from "react";
import Jumbotron from "../components/cards/Jumbotron";
import NewArrivals from "../components/home/NewArrivals";
import BestSellers from "../components/home/BestSellers";
import CategoryTree from "../components/category/CategoryTree";
import ProductFinder from "../components/home/ProductFinder";
import { Card, Col, Row, Space, Typography } from "antd";
import { AppstoreOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Paragraph, Title } = Typography;

const Home = () => {
    return (
        <div className="home-page">
            <section className="hero-section">
                <Space direction="vertical" size="middle">
                    <Typography.Text className="hero-eyebrow">ELECTRONICS & IOT STORE</Typography.Text>
                    <Title level={1}>อุปกรณ์อิเล็กทรอนิกส์สำหรับนักสร้าง</Title>
                    <Paragraph>
                        ไมโครคอนโทรลเลอร์ เซนเซอร์ Arduino, ESP32, ESP8266 และอุปกรณ์ IoT
                        พร้อมส่งจากโกดังในไทยภายใน 1–3 วัน
                    </Paragraph>
                </Space>
                <div className="hero-typing">
                <Jumbotron text={[
                    "Arduino • ESP32 • ESP8266",
                    "Sensors • Modules • IoT",
                    "พร้อมส่งจากประเทศไทย"
                ]} />
                </div>
            </section>
            <Row gutter={[24, 24]} align="top">
                <Col xs={24} lg={6}>
                    <aside className="home-sidebar">
                        <ProductFinder />
                        <div id="categories">
                            <Card
                                title={<Space><AppstoreOutlined /> เลือกซื้อสินค้าตามหมวด</Space>}
                                extra={<Link to="/shop">ดูทั้งหมด <ArrowRightOutlined /></Link>}
                                className="category-card"
                            >
                                <CategoryTree />
                            </Card>
                        </div>
                    </aside>
                </Col>
                <Col xs={24} lg={18}>
                    <section id="new-arrivals" className="product-section">
                        <Title level={2}>สินค้าใหม่</Title>
                        <Paragraph type="secondary">สินค้าและโมดูลที่เพิ่งเข้าสต็อก</Paragraph>
                        <NewArrivals />
                    </section>
                    <section id="best-sellers" className="product-section">
                        <Title level={2}>สินค้าขายดี</Title>
                        <Paragraph type="secondary">รายการยอดนิยมจากลูกค้าของเรา</Paragraph>
                        <BestSellers />
                    </section>
                </Col>
            </Row>
        </div>
    );
};

export default Home;
