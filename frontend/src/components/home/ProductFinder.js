import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Cascader, Col, Input, Row, Select, Slider, Space, Typography } from "antd";
import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getBrands } from "../../functions/brand";
import { getCategories } from "../../functions/category";
import { getProductTypes } from "../../functions/productType";
import { getSubs } from "../../functions/sub";

const ProductFinder = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState("");
    const [categoryPath, setCategoryPath] = useState([]);
    const [brandRef, setBrandRef] = useState("");
    const [price, setPrice] = useState([0, 50000]);
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
    }, []);

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
                    .map((type) => ({ value: `productType:${type._id}`, label: type.name })),
            })),
    })), [categories, productTypes, subs]);

    const reset = () => {
        setKeyword("");
        setCategoryPath([]);
        setBrandRef("");
        setPrice([0, 50000]);
    };

    const search = () => {
        const params = new URLSearchParams();
        if (keyword.trim()) params.set("query", keyword.trim());
        categoryPath.forEach((item) => {
            const [key, value] = item.split(":");
            if (key && value) params.set(key, value);
        });
        if (brandRef) params.set("brandRef", brandRef);
        if (price[0] > 0) params.set("minPrice", String(price[0]));
        if (price[1] < 50000) params.set("maxPrice", String(price[1]));
        navigate(`/shop${params.size ? `?${params.toString()}` : ""}`);
    };

    return (
        <Card className="home-product-finder" title="ค้นหาและกรองสินค้า"
            extra={<Button type="text" icon={<ClearOutlined />} onClick={reset}>ล้าง</Button>}>
            <Row gutter={[16, 16]} align="bottom">
                <Col xs={24} md={12} xl={7}>
                    <Typography.Text strong>ค้นหาสินค้า</Typography.Text>
                    <Input allowClear size="large" prefix={<SearchOutlined />} value={keyword}
                        onChange={(event) => setKeyword(event.target.value)} onPressEnter={search}
                        placeholder="ชื่อสินค้า รุ่น หรือคำสำคัญ" />
                </Col>
                <Col xs={24} md={12} xl={7}>
                    <Typography.Text strong>ประเภทสินค้า</Typography.Text>
                    <Cascader className="full-width" size="large" allowClear changeOnSelect
                        showSearch value={categoryPath} options={categoryOptions}
                        onChange={(value) => setCategoryPath(value || [])}
                        placeholder="เลือกหรือค้นหาหมวดสินค้า"
                        displayRender={(labels) => labels.join(" / ")} />
                </Col>
                <Col xs={24} md={12} xl={5}>
                    <Typography.Text strong>ผู้ผลิต / Brand</Typography.Text>
                    <Select allowClear showSearch className="full-width" size="large"
                        optionFilterProp="label" value={brandRef || undefined} onChange={setBrandRef}
                        placeholder="เลือก Brand"
                        options={brands.map((item) => ({ value: item._id, label: item.name }))} />
                </Col>
                <Col xs={24} md={12} xl={5}>
                    <Button type="primary" size="large" block icon={<SearchOutlined />} onClick={search}>
                        ค้นหาสินค้า
                    </Button>
                </Col>
                <Col span={24}>
                    <Space direction="vertical" size={0} className="full-width">
                        <Typography.Text strong>ช่วงราคา</Typography.Text>
                        <Slider range min={0} max={50000} step={100} value={price} onChange={setPrice} />
                        <Typography.Text type="secondary">
                            ฿{price[0].toLocaleString("th-TH")} – ฿{price[1].toLocaleString("th-TH")}
                        </Typography.Text>
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default ProductFinder;
