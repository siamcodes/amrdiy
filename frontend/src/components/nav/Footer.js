import React from "react";
import {
    BookOutlined,
    CreditCardOutlined,
    CustomerServiceOutlined,
    EnvironmentOutlined,
    FacebookOutlined,
    GithubOutlined,
    InstagramOutlined,
    LockOutlined,
    MailOutlined,
    PhoneOutlined,
    QrcodeOutlined,
    SafetyCertificateOutlined,
    ShoppingOutlined,
    ThunderboltOutlined,
    TruckOutlined,
} from "@ant-design/icons";
import { Col, Divider, Layout, Row, Space, Tag, Typography } from "antd";
import { Link } from "react-router-dom";

const { Footer: AntFooter } = Layout;
const { Paragraph, Text, Title } = Typography;

const FooterLink = ({ to, children }) => <Link className="footer-link" to={to}>{children}</Link>;

const Footer = () => {
    const year = new Date().getFullYear();
    return <AntFooter className="site-footer">
        <div className="footer-inner">
            <section className="footer-benefits" aria-label="จุดเด่นของร้าน">
                <div className="footer-benefit">
                    <span className="footer-benefit-icon"><TruckOutlined /></span>
                    <div><Text strong>จัดส่งทั่วประเทศ</Text><Text>เลือกบริการและติดตามพัสดุได้</Text></div>
                </div>
                <div className="footer-benefit">
                    <span className="footer-benefit-icon"><SafetyCertificateOutlined /></span>
                    <div><Text strong>สินค้าคุณภาพ</Text><Text>ข้อมูลสินค้าและสเปกชัดเจน</Text></div>
                </div>
                <div className="footer-benefit">
                    <span className="footer-benefit-icon"><LockOutlined /></span>
                    <div><Text strong>ชำระเงินปลอดภัย</Text><Text>ระบบไม่จัดเก็บเลขบัตรและ CVV</Text></div>
                </div>
                <div className="footer-benefit">
                    <span className="footer-benefit-icon"><CustomerServiceOutlined /></span>
                    <div><Text strong>พร้อมให้คำแนะนำ</Text><Text>ช่วยเลือกอุปกรณ์ให้เหมาะกับงาน</Text></div>
                </div>
            </section>

            <Divider className="footer-divider" />

            <Row gutter={[48, 40]}>
                <Col xs={24} md={12} xl={7}>
                    <Link to="/" className="footer-brand" aria-label="AMR DIY หน้าหลัก">
                        <img src="/amrdiy-logo.svg" alt="AMR DIY" className="footer-logo" />
                    </Link>
                    <Paragraph className="footer-description">
                        แหล่งรวมอุปกรณ์อิเล็กทรอนิกส์ ไมโครคอนโทรลเลอร์ เซนเซอร์
                        โมดูล IoT และเครื่องมือสำหรับนักพัฒนา นักเรียน และ Maker
                    </Paragraph>
                    <Space size="middle" className="footer-socials">
                        <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><FacebookOutlined /></a>
                        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramOutlined /></a>
                        <a href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub"><GithubOutlined /></a>
                    </Space>
                </Col>

                <Col xs={12} sm={8} md={6} xl={4}>
                    <Title level={5}><ShoppingOutlined /> เลือกซื้อสินค้า</Title>
                    <Space direction="vertical" size="middle">
                        <FooterLink to="/shop">สินค้าทั้งหมด</FooterLink>
                        <FooterLink to="/#categories">ประเภทสินค้า</FooterLink>
                        <FooterLink to="/#new-arrivals">สินค้าใหม่</FooterLink>
                        <FooterLink to="/#best-sellers">สินค้าขายดี</FooterLink>
                    </Space>
                </Col>

                <Col xs={12} sm={8} md={6} xl={4}>
                    <Title level={5}><CustomerServiceOutlined /> ช่วยเหลือลูกค้า</Title>
                    <Space direction="vertical" size="middle">
                        <FooterLink to="/shipping">การจัดส่งสินค้า</FooterLink>
                        <FooterLink to="/return-refund">การคืนสินค้าและคืนเงิน</FooterLink>
                        <FooterLink to="/order-cancel">การยกเลิกคำสั่งซื้อ</FooterLink>
                        <FooterLink to="/policy">นโยบายและเงื่อนไข</FooterLink>
                    </Space>
                </Col>

                <Col xs={12} sm={8} md={6} xl={4}>
                    <Title level={5}><ThunderboltOutlined /> เรียนรู้และบริการ</Title>
                    <Space direction="vertical" size="middle">
                        <FooterLink to="/blog"><BookOutlined /> บทความและไอเดีย</FooterLink>
                        <FooterLink to="/user/contact">ติดต่อเรา</FooterLink>
                        <FooterLink to="/user/history">ติดตามคำสั่งซื้อ</FooterLink>
                        <FooterLink to="/user/profile">บัญชีของฉัน</FooterLink>
                    </Space>
                </Col>

                <Col xs={24} md={12} xl={5}>
                    <Title level={5}>ติดต่อ AMR DIY</Title>
                    <Space direction="vertical" size="middle" className="footer-contact">
                        <a href="https://maps.google.com/?q=Bangkok+10160" target="_blank" rel="noreferrer">
                            <EnvironmentOutlined /> กรุงเทพฯ 10160
                        </a>
                        <a href="mailto:eleclabs@gmail.com"><MailOutlined /> eleclabs@gmail.com</a>
                        <a href="tel:+66928064949"><PhoneOutlined /> 092-806-4949</a>
                        <Text><ThunderboltOutlined /> LINE: mcu.bz</Text>
                    </Space>
                    <div className="footer-payment">
                        <Text>ช่องทางชำระเงิน</Text>
                        <Space wrap>
                            <Tag icon={<CreditCardOutlined />}>บัตร</Tag>
                            <Tag icon={<QrcodeOutlined />}>QR</Tag>
                            <Tag>โอนธนาคาร</Tag>
                            <Tag>PayPal</Tag>
                        </Space>
                    </div>
                </Col>
            </Row>

            <Divider className="footer-divider" />

            <div className="footer-bottom">
                <Text>© {year} AMR DIY. สงวนลิขสิทธิ์</Text>
                <Space wrap split={<span className="footer-dot">•</span>}>
                    <FooterLink to="/policy">ความเป็นส่วนตัว</FooterLink>
                    <FooterLink to="/policy">ข้อกำหนดการใช้งาน</FooterLink>
                    <Text>ออกแบบเพื่อ Maker ในประเทศไทย</Text>
                </Space>
            </div>
        </div>
    </AntFooter>;
};

export default Footer;
