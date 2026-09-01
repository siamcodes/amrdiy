import React, { useEffect, useState } from "react";
import { Breadcrumb, Button, Card, Col, Empty, Result, Row, Skeleton, Space, Tag, Typography, message } from "antd";
import { CalendarOutlined, EyeOutlined, HomeOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { Link, useLocation, useParams } from "react-router-dom";
import { getBlog } from "../../functions/blog";
import ProductCard from "../../components/cards/ProductCard";
import { renderRichContent } from "../../helpers/richContent";

const { Title, Paragraph, Text } = Typography;

const youtubeSrc = (input) => {
  try {
    const url = new URL(input);
    const allowedHosts = [
      "www.youtube.com", "youtube.com", "m.youtube.com",
      "www.youtube-nocookie.com", "youtube-nocookie.com", "youtu.be",
    ];
    if (!allowedHosts.includes(url.hostname)) return null;
    let videoId = "";
    if (url.hostname === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
    else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
      videoId = url.pathname.split("/")[2] || "";
    }
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return null;
  }
};

const YoutubeEmbed = ({ src, title }) => (
  <span className="youtube-embed">
    <iframe
      src={src}
      title={`YouTube: ${title}`}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  </span>
);

const renderBlogContent = (html, title) => renderRichContent(html, (node) => {
  if (node.type !== "tag") return undefined;

  if (node.name === "iframe") {
    const src = youtubeSrc(node.attribs?.src);
    return src ? <YoutubeEmbed src={src} title={title} /> : <></>;
  }

  if (node.name === "a") {
    const src = youtubeSrc(node.attribs?.href);
    if (src) return <YoutubeEmbed src={src} title={title} />;
  }

  return undefined;
});

const BlogDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const [blog, setBlog] = useState(null);
  const [membersOnly, setMembersOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    setBlog(null);
    setMembersOnly(false);
    getBlog(slug).then(({ data }) => setBlog(data))
      .catch((error) => {
        if (error.response?.status === 401 && error.response?.data?.code === "MEMBERS_ONLY") {
          setMembersOnly(true);
          return;
        }
        message.error("ไม่พบบทความ");
      })
      .finally(() => setLoading(false));
  }, [slug]);
  if (loading) return <Card><Skeleton active /></Card>;
  if (membersOnly) return <Card><Result
    icon={<LockOutlined />}
    status="info"
    title="บทความนี้สำหรับสมาชิกเท่านั้น"
    subTitle="กรุณาเข้าสู่ระบบเพื่ออ่านเนื้อหาบทความฉบับเต็ม"
    extra={<Button type="primary" icon={<LoginOutlined />}><Link to="/login" state={{ from: location.pathname }}>เข้าสู่ระบบ</Link></Button>}
  /></Card>;
  if (!blog) return <Card><Empty description="ไม่พบบทความ" /></Card>;

  return <article className="blog-detail">
    <Breadcrumb items={[
      { title: <Link to="/"><HomeOutlined /> หน้าหลัก</Link> },
      { title: <Link to="/blog">บทความ</Link> },
      { title: blog.title },
    ]} />
    <header className="blog-detail-header">
      <Space wrap>{blog.tags?.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
      <Title>{blog.title}</Title>
      <Paragraph className="blog-lead">{blog.excerpt}</Paragraph>
      <Space split="·">
        <Text type="secondary"><CalendarOutlined /> {new Date(blog.publishedAt).toLocaleDateString("th-TH")}</Text>
        <Text type="secondary"><EyeOutlined /> อ่านแล้ว {blog.views || 0} ครั้ง</Text>
      </Space>
    </header>
    {blog.heroImage?.url && <img className="blog-hero-image" src={blog.heroImage.url} alt={blog.heroImage.alt || blog.title} />}
    <Card className="blog-content">{renderBlogContent(blog.content, blog.title)}</Card>
    {!!blog.featuredProducts?.length && <section className="blog-products">
      <Title level={2}>สินค้าที่เกี่ยวข้อง</Title>
      <Paragraph type="secondary">สินค้าที่เลือกมาเพื่อประกอบบทความและโปรโมชั่นนี้</Paragraph>
      <Row gutter={[20, 20]}>{blog.featuredProducts.map((product) => <Col xs={24} sm={12} lg={8} xl={6} key={product._id}><ProductCard product={product} /></Col>)}</Row>
    </section>}
  </article>;
};

export default BlogDetail;
