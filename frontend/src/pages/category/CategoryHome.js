import React, { useEffect, useMemo, useState } from "react";
import {
    Breadcrumb,
    Button,
    Card,
    Col,
    Empty,
    Input,
    Row,
    Segmented,
    Select,
    Skeleton,
    Space,
    Statistic,
    Switch,
    Tag,
    Typography,
    message,
} from "antd";
import {
    AppstoreOutlined,
    FilterOutlined,
    HomeOutlined,
    RightOutlined,
    SearchOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, getCategory, getCategorySubs } from "../../functions/category";
import ProductCard from "../../components/cards/ProductCard";

const { Title, Paragraph, Text } = Typography;

const CategoryHome = ({ match }) => {
    const { slug } = match.params;
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState(null);
    const [subs, setSubs] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [sort, setSort] = useState("featured");
    const [stockOnly, setStockOnly] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setKeyword("");
        Promise.all([getCategory(slug), getCategories()])
            .then(async ([categoryResponse, categoriesResponse]) => {
                if (!active) return;
                const selected = categoryResponse.data.category;
                if (!selected) throw new Error("ไม่พบประเภทสินค้านี้");
                setCategory(selected);
                setProducts(categoryResponse.data.products || []);
                setCategories(categoriesResponse.data || []);
                const subResponse = await getCategorySubs(selected._id);
                if (active) setSubs(subResponse.data || []);
            })
            .catch((error) => {
                if (active) message.error(error.message || "โหลดข้อมูลประเภทสินค้าไม่สำเร็จ");
            })
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [slug]);

    const visibleProducts = useMemo(() => {
        const query = keyword.trim().toLowerCase();
        const result = products.filter((product) => {
            const matchesSearch = !query || [
                product.title,
                product.brand,
                product.sku,
                product.manufacturerPartNumber,
            ].some((value) => String(value || "").toLowerCase().includes(query));
            return matchesSearch && (!stockOnly || Number(product.quantity) > 0);
        });
        return [...result].sort((a, b) => {
            if (sort === "price-low") return Number(a.price) - Number(b.price);
            if (sort === "price-high") return Number(b.price) - Number(a.price);
            if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
            if (sort === "best-selling") return Number(b.sold || 0) - Number(a.sold || 0);
            return Number(b.quantity > 0) - Number(a.quantity > 0);
        });
    }, [keyword, products, sort, stockOnly]);

    if (loading) return (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Skeleton active paragraph={{ rows: 2 }} />
            <Row gutter={[20, 20]}>{Array.from({ length: 8 }).map((_, index) =>
                <Col xs={24} sm={12} lg={8} xl={6} key={index}><Card><Skeleton active /></Card></Col>)}
            </Row>
        </Space>
    );

    if (!category) return <Card><Empty description="ไม่พบประเภทสินค้า" /></Card>;

    return <div className="modern-category-page">
        <Breadcrumb className="category-breadcrumb" items={[
            { title: <Link to="/"><HomeOutlined /> หน้าหลัก</Link> },
            { title: <Link to="/shop">สินค้า</Link> },
            { title: category.name },
        ]} />

        <section className="category-hero">
            <div className="category-hero-copy">
                <Tag color="blue"><AppstoreOutlined /> PRODUCT CATEGORY</Tag>
                <Title>{category.name}</Title>
                <Paragraph>
                    เลือกชมสินค้า อุปกรณ์ และโซลูชันที่เหมาะกับโปรเจกต์ของคุณ
                    พร้อมข้อมูลสินค้าสำหรับช่วยตัดสินใจ
                </Paragraph>
                <Space size="large" wrap>
                    <Statistic title="สินค้าทั้งหมด" value={products.length} suffix="รายการ" />
                    <Statistic title="พร้อมจำหน่าย" value={products.filter((item) => Number(item.quantity) > 0).length} suffix="รายการ" />
                </Space>
            </div>
            <div className="category-hero-art" aria-hidden="true">
                <ShoppingOutlined />
                <span className="category-orbit category-orbit-one" />
                <span className="category-orbit category-orbit-two" />
            </div>
        </section>

        <Card className="category-switcher" styles={{ body: { padding: 12 } }}>
            <Segmented
                block
                value={slug}
                onChange={(value) => navigate(`/category/${value}`)}
                options={categories.map((item) => ({
                    value: item.slug,
                    label: item.name,
                    icon: <AppstoreOutlined />,
                }))}
            />
        </Card>

        {!!subs.length && <section className="category-subcategory-section">
            <Title level={4}>เลือกตามหมวดย่อย</Title>
            <Space wrap>
                {subs.map((sub) => <Link key={sub._id} to={`/sub/${sub.slug}`}>
                    <Button size="large">{sub.name} <RightOutlined /></Button>
                </Link>)}
            </Space>
        </section>}

        <Card className="category-toolbar">
            <Row gutter={[12, 12]} align="middle">
                <Col xs={24} lg={12}>
                    <Input
                        size="large"
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder={`ค้นหาใน ${category.name}`}
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                    />
                </Col>
                <Col xs={24} sm={12} lg={7}>
                    <Select
                        size="large"
                        value={sort}
                        onChange={setSort}
                        style={{ width: "100%" }}
                        options={[
                            { value: "featured", label: "สินค้าแนะนำ" },
                            { value: "newest", label: "สินค้าใหม่ล่าสุด" },
                            { value: "best-selling", label: "ขายดีที่สุด" },
                            { value: "price-low", label: "ราคา: ต่ำไปสูง" },
                            { value: "price-high", label: "ราคา: สูงไปต่ำ" },
                        ]}
                    />
                </Col>
                <Col xs={24} sm={12} lg={5}>
                    <Space className="stock-filter">
                        <FilterOutlined />
                        <Switch checked={stockOnly} onChange={setStockOnly} />
                        <Text>พร้อมส่งเท่านั้น</Text>
                    </Space>
                </Col>
            </Row>
        </Card>

        <div className="category-result-heading">
            <div>
                <Title level={3}>สินค้าใน {category.name}</Title>
                <Text type="secondary">พบ {visibleProducts.length} จาก {products.length} รายการ</Text>
            </div>
        </div>

        {visibleProducts.length ? (
            <Row gutter={[20, 24]}>
                {visibleProducts.map((product) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={product._id}>
                        <ProductCard product={product} />
                    </Col>
                ))}
            </Row>
        ) : (
            <Card><Empty description="ไม่พบสินค้าที่ตรงกับเงื่อนไข">
                <Button type="primary" onClick={() => { setKeyword(""); setStockOnly(false); }}>ล้างตัวกรอง</Button>
            </Empty></Card>
        )}
    </div>;
};

export default CategoryHome;
