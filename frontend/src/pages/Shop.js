import React, { useEffect, useMemo, useState } from "react";
import {
    Button, Card, Cascader, Col, Empty, Input, Rate, Row, Select, Skeleton,
    Slider, Space, Typography,
} from "antd";
import {
    AppstoreOutlined, ClearOutlined, SearchOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/cards/ProductCard";
import ColorSelect from "../components/forms/ColorSelect";
import { fetchProductsByFilter } from "../functions/product";
import { getCategories } from "../functions/category";
import { getSubs } from "../functions/sub";
import { getProductTypes } from "../functions/productType";
import { getBrands } from "../functions/brand";

const { Paragraph, Title } = Typography;
const colors = [
    "Black", "White", "Gray", "Silver", "Brown", "Red", "Orange", "Yellow",
    "Green", "Blue", "Navy", "Teal", "Purple", "Pink", "Gold", "Beige",
    "Clear", "Multicolor",
];

const Shop = () => {
    const navbarSearch = useSelector((state) => state.search?.text || "");
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState(searchParams.get("query") || navbarSearch);
    const [categoryPath, setCategoryPath] = useState(() => [
        searchParams.get("category") && `category:${searchParams.get("category")}`,
        searchParams.get("sub") && `sub:${searchParams.get("sub")}`,
        searchParams.get("productType") && `productType:${searchParams.get("productType")}`,
    ].filter(Boolean));
    const [price, setPrice] = useState([
        Number(searchParams.get("minPrice")) || 0,
        Number(searchParams.get("maxPrice")) || 50000,
    ]);
    const [brandRef, setBrandRef] = useState(searchParams.get("brandRef") || "");
    const [color, setColor] = useState("");
    const [shipping, setShipping] = useState("");
    const [stars, setStars] = useState(0);
    const [categories, setCategories] = useState([]);
    const [subs, setSubs] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        Promise.all([getCategories(), getSubs(), getProductTypes(), getBrands()])
            .then(([categoryResponse, subResponse, typeResponse, brandResponse]) => {
                setCategories(categoryResponse.data);
                setSubs(subResponse.data);
                setProductTypes(typeResponse.data);
                setBrands(brandResponse.data.filter((item) => item.active !== false));
            });
        try {
            setRecentProducts(JSON.parse(localStorage.getItem("recently-viewed-products") || "[]"));
        } catch {
            setRecentProducts([]);
        }
    }, []);

    useEffect(() => {
        if (searchParams.has("query")) {
            setKeyword(searchParams.get("query") || "");
        } else {
            setKeyword(navbarSearch);
        }
    }, [navbarSearch, searchParams]);

    const selectedCategory = categoryPath.find((value) => value.startsWith("category:"))?.split(":")[1];
    const selectedSub = categoryPath.find((value) => value.startsWith("sub:"))?.split(":")[1];
    const selectedProductType = categoryPath.find((value) => value.startsWith("productType:"))?.split(":")[1];

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(true);
            fetchProductsByFilter({
                query: keyword.trim() || undefined,
                category: selectedCategory ? [selectedCategory] : undefined,
                sub: selectedSub || undefined,
                productType: selectedProductType || undefined,
                price: price[0] > 0 || price[1] < 50000 ? price : undefined,
                brandRef: brandRef || undefined,
                color: color || undefined,
                shipping: shipping || undefined,
                stars: stars || undefined,
            })
                .then((response) => setProducts(response.data))
                .finally(() => setLoading(false));
        }, 350);
        return () => clearTimeout(timer);
    }, [
        brandRef, color, keyword, price, selectedCategory, selectedProductType,
        selectedSub, shipping, stars,
    ]);

    const categoryOptions = useMemo(() => categories.map((category) => ({
        value: `category:${category._id}`,
        label: category.name,
        children: subs
            .filter((sub) => String(sub.parent?._id || sub.parent) === String(category._id))
            .map((sub) => ({
                value: `sub:${sub._id}`,
                label: sub.name,
                children: productTypes
                    .filter((type) => String(type.parent?._id || type.parent) === String(sub._id))
                    .map((type) => ({
                        value: `productType:${type._id}`,
                        label: type.name,
                    })),
            })),
    })), [categories, productTypes, subs]);

    const resetFilters = () => {
        setKeyword("");
        setCategoryPath([]);
        setPrice([0, 50000]);
        setBrandRef("");
        setColor("");
        setShipping("");
        setStars(0);
    };

    return (
        <div className="shop-page">
            <div className="shop-heading">
                <div className="shop-title-row">
                    <Title level={2}><AppstoreOutlined /> สินค้าทั้งหมด</Title>
                    <Typography.Text type="secondary" className="shop-product-count">
                        {products.length} รายการ
                    </Typography.Text>
                </div>
            </div>

            <Row gutter={[20, 20]} align="top">
                <Col xs={24} lg={6}>
                    <Card title="ค้นหาและกรองสินค้า" className="shop-filter-card"
                        extra={<Button type="text" icon={<ClearOutlined />} onClick={resetFilters}>ล้าง</Button>}>
                        <Space direction="vertical" size="large" className="full-width">
                            <div>
                                <Typography.Text strong>ค้นหาสินค้า</Typography.Text>
                                <Input allowClear size="large" prefix={<SearchOutlined />}
                                    placeholder="ชื่อสินค้า รุ่น หรือคำสำคัญ"
                                    value={keyword}
                                    onChange={(event) => setKeyword(event.target.value)} />
                            </div>
                            <div>
                                <Typography.Text strong>ประเภทสินค้า</Typography.Text>
                                <Cascader
                                    className="full-width"
                                    size="large"
                                    allowClear
                                    changeOnSelect
                                    showSearch={{
                                        filter: (input, path) => path.some((option) =>
                                            String(option.label).toLowerCase().includes(input.toLowerCase())),
                                    }}
                                    value={categoryPath}
                                    options={categoryOptions}
                                    onChange={(value) => setCategoryPath(value || [])}
                                    placeholder="เลือกหรือพิมพ์ค้นหาหมวดสินค้า"
                                    displayRender={(labels) => labels.join(" / ")}
                                />
                            </div>
                            <div>
                                <Typography.Text strong>ช่วงราคา</Typography.Text>
                                <Slider range min={0} max={50000} step={100} value={price}
                                    onChange={setPrice}
                                    tooltip={{ formatter: (value) => `฿${Number(value).toLocaleString("th-TH")}` }} />
                                <Typography.Text type="secondary">
                                    ฿{price[0].toLocaleString("th-TH")} – ฿{price[1].toLocaleString("th-TH")}
                                </Typography.Text>
                            </div>
                            <div>
                                <Typography.Text strong>ผู้ผลิต / Brand</Typography.Text>
                                <Select allowClear showSearch className="full-width"
                                    optionFilterProp="label" placeholder="เลือกหรือค้นหา Brand"
                                    value={brandRef || undefined} onChange={setBrandRef}
                                    options={brands.map((item) => ({ value: item._id, label: item.name }))} />
                            </div>
                            <div>
                                <Typography.Text strong>สี</Typography.Text>
                                <ColorSelect allowClear className="full-width" colors={colors}
                                    value={color} onChange={setColor} placeholder="เลือกสี" />
                            </div>
                            <div>
                                <Typography.Text strong>การจัดส่ง</Typography.Text>
                                <Select allowClear className="full-width" value={shipping || undefined}
                                    onChange={setShipping} placeholder="เลือกการจัดส่ง"
                                    options={[
                                        { value: "Yes", label: "มีบริการจัดส่ง" },
                                        { value: "No", label: "ไม่มีบริการจัดส่ง" },
                                    ]} />
                            </div>
                            <div>
                                <Typography.Text strong>คะแนนรีวิว</Typography.Text><br />
                                <Rate value={stars} onChange={setStars} />
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={18}>
                    {loading ? (
                        <Row gutter={[16, 16]}>
                            {Array.from({ length: 8 }, (_, index) => (
                                <Col xs={24} sm={12} xl={8} key={index}>
                                    <Card><Skeleton active /></Card>
                                </Col>
                            ))}
                        </Row>
                    ) : products.length ? (
                        <Row gutter={[16, 16]}>
                            {products.map((product) => (
                                <Col xs={24} sm={12} xl={8} key={product._id}>
                                    <ProductCard product={product} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Card><Empty description="ไม่พบสินค้าที่ตรงกับเงื่อนไข" /></Card>
                    )}
                </Col>
            </Row>

            {recentProducts.length > 0 && (
                <section className="recent-products-section">
                    <Title level={4}>สินค้าที่คุณดูล่าสุด</Title>
                    <div className="recent-products-scroll">
                        {recentProducts.map((product) => (
                            <div className="recent-product-item" key={product._id}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Shop;
