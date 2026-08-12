import React, { useEffect, useState } from "react";
import { Card, Empty, Input, Pagination, Select, Space, Tag, Typography, message } from "antd";
import {
  CalendarOutlined,
  EyeOutlined,
  LockOutlined,
  ReadOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getBlogs } from "../../functions/blog";

const { Title, Paragraph, Text } = Typography;

const BlogList = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    const timer = setTimeout(() => {
      getBlogs({ page, limit: 12, search: search.trim() || undefined, sort })
        .then(({ data }) => { setItems(data.items); setTotal(data.total); })
        .catch(() => message.error("โหลดบทความไม่สำเร็จ"));
    }, 250);
    return () => clearTimeout(timer);
  }, [page, search, sort]);

  return <>
    <div className="blog-list-hero">
      <div className="blog-list-heading">
        <ReadOutlined className="blog-list-icon" />
        <Title>บทความและไอเดีย</Title>
      </div>
      <Paragraph>คู่มือ รีวิว เทคนิค และสินค้าแนะนำจาก AMR DIY</Paragraph>
      <Input.Search
        aria-label="ค้นหาบทความ"
        size="large"
        allowClear
        enterButton
        placeholder="ค้นหาจากหัวข้อ เนื้อหา หรือแท็ก..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
    </div>
    <div className="blog-list-controls">
      <Text type="secondary">พบบทความ {total.toLocaleString("th-TH")} เรื่อง</Text>
      <Space>
        <Text type="secondary">เรียงตาม</Text>
        <Select
          aria-label="เรียงลำดับบทความ"
          className="blog-sort-select"
          value={sort}
          onChange={(value) => {
            setSort(value);
            setPage(1);
          }}
          options={[
            {
              value: "latest",
              label: <Space size={8}><SortDescendingOutlined />ล่าสุด → เก่าสุด</Space>,
            },
            {
              value: "oldest",
              label: <Space size={8}><SortAscendingOutlined />เก่าสุด → ล่าสุด</Space>,
            },
          ]}
        />
      </Space>
    </div>
    {!items.length ? <Card><Empty description={search.trim() ? `ไม่พบบทความสำหรับ “${search.trim()}”` : "ไม่พบบทความ"} /></Card> : <div className="blog-grid">
      {items.map((blog) => <div className="blog-grid-item" key={blog._id}>
        <Card hoverable className="blog-card" cover={<Link to={`/blog/${blog.slug}`}>
          <img className="blog-card-image" src={blog.heroImage?.url || "/amrdiy-logo.svg"} alt={blog.heroImage?.alt || blog.title} />
        </Link>}>
          <Space wrap>{blog.featured && <Tag color="orange">บทความแนะนำ</Tag>}{blog.visibility === "members" && <Tag color="blue" icon={<LockOutlined />}>เฉพาะสมาชิก</Tag>}{blog.tags?.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
          <Link to={`/blog/${blog.slug}`}><Title level={3} ellipsis={{ rows: 2 }}>{blog.title}</Title></Link>
          <Paragraph type="secondary" ellipsis={{ rows: 3 }}>{blog.excerpt}</Paragraph>
          <Space split="·"><Text type="secondary"><CalendarOutlined /> {new Date(blog.publishedAt).toLocaleDateString("th-TH")}</Text><Text type="secondary"><EyeOutlined /> {blog.views || 0}</Text></Space>
        </Card>
      </div>)}
    </div>}
    {total > 12 && <Pagination current={page} total={total} pageSize={12} onChange={setPage} style={{ marginTop: 32, textAlign: "center" }} />}
  </>;
};

export default BlogList;
