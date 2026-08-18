import React, { useEffect, useMemo, useState } from "react";
import {
    Breadcrumb, Button, Card, Col, Empty, Input, Row, Segmented, Select,
    Skeleton, Space, Statistic, Switch, Tag, Typography, message,
} from "antd";
import {
    ApartmentOutlined, FilterOutlined, HomeOutlined, RightOutlined,
    SearchOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getSub, getSubs } from "../../functions/sub";
import ProductCard from "../../components/cards/ProductCard";

const { Title, Paragraph, Text } = Typography;

const SubHome = ({ match }) => {
    const { slug } = match.params;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [sub, setSub] = useState(null);
    const [siblings, setSiblings] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState(searchParams.get("query") || "");
    const [sort, setSort] = useState("featured");
    const [stockOnly, setStockOnly] = useState(false);
    const [typeId, setTypeId] = useState("all");

    useEffect(() => {
        setKeyword(searchParams.get("query") || "");
    }, [searchParams]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setTypeId("all");
        Promise.all([getSub(slug), getSubs()])
            .then(([subResponse, subsResponse]) => {
                if (!active) return;
                const selected = subResponse.data.sub;
                if (!selected) throw new Error("ไม่พบหมวดย่อย");
                setSub(selected);
                setProducts(subResponse.data.products || []);
                setProductTypes(subResponse.data.productTypes || []);
                const parentId = selected.parent?._id || selected.parent;
                setSiblings((subsResponse.data || []).filter(
                    (item) => String(item.parent?._id || item.parent) === String(parentId)
                ));
            })
            .catch((error) => {
                if (active) message.error(error.response?.data?.message || error.message || "โหลดข้อมูลไม่สำเร็จ");
            })
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [slug]);

    const visibleProducts = useMemo(() => {
        const query = keyword.trim().toLowerCase();
        const result = products.filter((product) => {
            const searchMatched = !query || [
                product.title, product.brand, product.sku, product.manufacturerPartNumber,
            ].some((value) => String(value || "").toLowerCase().includes(query));
            const productTypeId = product.productType?._id || product.productType;
            return searchMatched
                && (!stockOnly || Number(product.quantity) > 0)
                && (typeId === "all" || String(productTypeId) === String(typeId));
        });
        return [...result].sort((a, b) => {
            if (sort === "price-low") return Number(a.price) - Number(b.price);
            if (sort === "price-high") return Number(b.price) - Number(a.price);
            if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
            if (sort === "best-selling") return Number(b.sold || 0) - Number(a.sold || 0);
            return Number(b.quantity > 0) - Number(a.quantity > 0);
        });
    }, [keyword, products, sort, stockOnly, typeId]);

    if (loading) return <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Skeleton active paragraph={{ rows: 3 }} />
        <Row gutter={[20, 20]}>{Array.from({ length: 8 }).map((_, index) =>
            <Col xs={24} sm={12} lg={8} xl={6} key={index}><Card><Skeleton active /></Card></Col>)}</Row>
    </Space>;
    if (!sub) return <Card><Empty description="ไม่พบหมวดย่อย" /></Card>;

    return <div className="modern-category-page modern-sub-page">
        <Breadcrumb className="category-breadcrumb" items={[
            { title: <Link to="/"><HomeOutlined /> หน้าหลัก</Link> },
            { title: <Link to="/shop">สินค้า</Link> },
            ...(sub.parent ? [{ title: <Link to={`/category/${sub.parent.slug}`}>{sub.parent.name}</Link> }] : []),
            { title: sub.name },
        ]} />

        <section className="category-hero subcategory-hero">
            <div className="category-hero-copy">
                <Tag color="orange"><ApartmentOutlined /> SUB CATEGORY</Tag>
                <Title>{sub.name}</Title>
                <Paragraph>
                    คัดสรรสินค้าในกลุ่ม {sub.name} พร้อมข้อมูลทางเทคนิค
                    เพื่อค้นหาอุปกรณ์ที่ตรงกับโปรเจกต์ได้รวดเร็วยิ่งขึ้น
                </Paragraph>
                <Space size="large" wrap>
                    <Statistic title="สินค้าในหมวด" value={products.length} suffix="รายการ" />
                    <Statistic title="พร้อมจำหน่าย" value={products.filter((item) => Number(item.quantity) > 0).length} suffix="รายการ" />
                </Space>
            </div>
            <div className="category-hero-art" aria-hidden="true">
                <ThunderboltOutlined />
                <span className="category-orbit category-orbit-one" />
                <span className="category-orbit category-orbit-two" />
            </div>
        </section>

        {!!siblings.length && <Card className="category-switcher" styles={{ body: { padding: 12 } }}>
            <Segmented block value={slug} onChange={(value) => navigate(`/sub/${value}`)}
                options={siblings.map((item) => ({ value: item.slug, label: item.name, icon: <ApartmentOutlined /> }))} />
        </Card>}

        {!!productTypes.length && <section className="category-subcategory-section">
            <Title level={4}>เลือกประเภทสินค้า</Title>
            <Space wrap>
                <Button size="large" type={typeId === "all" ? "primary" : "default"} onClick={() => setTypeId("all")}>ทั้งหมด</Button>
                {productTypes.map((type) => <Button key={type._id} size="large"
                    type={typeId === type._id ? "primary" : "default"}
                    onClick={() => setTypeId(type._id)}>
                    {type.name} <RightOutlined />
                </Button>)}
            </Space>
        </section>}

        <Card className="category-toolbar">
            <Row gutter={[12, 12]} align="middle">
                <Col xs={24} lg={12}><Input size="large" allowClear prefix={<SearchOutlined />}
                    placeholder={`ค้นหาใน ${sub.name}`} value={keyword}
                    onChange={(event) => setKeyword(event.target.value)} /></Col>
                <Col xs={24} sm={12} lg={7}><Select size="large" value={sort} onChange={setSort} style={{ width: "100%" }}
                    options={[
                        { value: "featured", label: "สินค้าแนะนำ" },
                        { value: "newest", label: "สินค้าใหม่ล่าสุด" },
                        { value: "best-selling", label: "ขายดีที่สุด" },
                        { value: "price-low", label: "ราคา: ต่ำไปสูง" },
                        { value: "price-high", label: "ราคา: สูงไปต่ำ" },
                    ]} /></Col>
                <Col xs={24} sm={12} lg={5}><Space className="stock-filter"><FilterOutlined /><Switch checked={stockOnly} onChange={setStockOnly} /><Text>พร้อมส่งเท่านั้น</Text></Space></Col>
            </Row>
        </Card>

        <div className="category-result-heading">
            <div><Title level={3}>สินค้าใน {sub.name}</Title><Text type="secondary">พบ {visibleProducts.length} จาก {products.length} รายการ</Text></div>
        </div>
        {visibleProducts.length ? <Row gutter={[20, 24]}>
            {visibleProducts.map((product) => <Col xs={24} sm={12} lg={8} xl={6} key={product._id}><ProductCard product={product} /></Col>)}
        </Row> : <Card><Empty description="ไม่พบสินค้าที่ตรงกับเงื่อนไข">
            <Button type="primary" onClick={() => { setKeyword(""); setStockOnly(false); setTypeId("all"); }}>ล้างตัวกรอง</Button>
        </Empty></Card>}
    </div>;
};

export default SubHome;
