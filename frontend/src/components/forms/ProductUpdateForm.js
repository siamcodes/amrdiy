import React from "react";
import { Button, Col, Form, Input, InputNumber, Row, Select } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import RichTextEditor from "./RichTextEditor";
import ProductCatalogFields from "./ProductCatalogFields";
import ColorSelect from "./ColorSelect";

const ProductUpdateForm = ({
    handleSubmit, handleChange, values, setValues, handleCategoryChange, categories,
    subOptions, arrayOfSubs, setArrayOfSubs, selectedCategory,
    handleBrandChange, brandOptions, generationOptions,
    arrayOfGenerations, setArrayOfGenerations, selectedBrand,
}) => {
    const {
        title, description, price, category, shipping, quantity,
        colors, color, brandRef,
    } = values;
    const change = (name, value) => handleChange({ target: { name, value } });

    return (
        <Form layout="vertical" onSubmitCapture={handleSubmit}>
            <Form.Item label="ชื่อสินค้า" required>
                <Input size="large" name="title" value={title} onChange={handleChange} />
            </Form.Item>
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item label="ประเภทหลัก" required>
                        <Select size="large"
                            value={selectedCategory || category?._id}
                            onChange={(value) => handleCategoryChange({ target: { value } })}
                            options={categories.map((item) => ({ value: item._id, label: item.name }))} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="ประเภทย่อย">
                        <Select mode="multiple" size="large" value={arrayOfSubs}
                            onChange={(value) => {
                                setArrayOfSubs(value);
                                setValues((current) => ({ ...current, subs: value, productType: "" }));
                            }}
                            options={subOptions.map((item) => ({ value: item._id, label: item.name }))} />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col xs={24} sm={12} lg={6}>
                    <Form.Item label="ราคา">
                        <InputNumber size="large" min={0} value={price}
                            onChange={(value) => change("price", value)} className="full-width" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Form.Item label="จำนวน">
                        <InputNumber size="large" min={0} value={quantity}
                            onChange={(value) => change("quantity", value)} className="full-width" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={4}>
                    <Form.Item label="สี">
                        <ColorSelect size="large" colors={colors} value={color}
                            onChange={(value) => change("color", value)}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Form.Item label="ยี่ห้อ">
                        <Select size="large" value={selectedBrand || brandRef?._id || brandRef}
                            onChange={(value) => handleBrandChange({ target: { value } })}
                            options={brandOptions.map((item) => ({ value: item._id, label: item.name }))} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Form.Item label="การจัดส่ง">
                        <Select size="large" value={shipping === "Yes" ? "Yes" : "No"}
                            onChange={(value) => change("shipping", value)}
                            options={[
                                { value: "No", label: "ไม่จัดส่ง" },
                                { value: "Yes", label: "จัดส่ง" },
                            ]} />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item label="รุ่นสินค้า">
                <Select mode="multiple" size="large" value={arrayOfGenerations}
                    placeholder={selectedBrand || brandRef ? "เลือกรุ่นสินค้า" : "เลือกยี่ห้อก่อน"}
                    disabled={!selectedBrand && !brandRef}
                    onChange={(value) => {
                        setArrayOfGenerations(value);
                        setValues((current) => ({ ...current, generations: value }));
                    }}
                    options={generationOptions.map((item) => ({ value: item._id, label: item.name }))} />
            </Form.Item>
            <Form.Item label="รายละเอียดสินค้า">
                <RichTextEditor value={description}
                    onChange={(value) => change("description", value)}
                    placeholder="กรอกรายละเอียด คุณสมบัติ และข้อมูลสินค้า" />
            </Form.Item>
            <ProductCatalogFields values={values} setValues={setValues} />
            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />}>
                บันทึกการแก้ไข
            </Button>
        </Form>
    );
};

export default ProductUpdateForm;
