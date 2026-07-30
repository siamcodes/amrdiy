import React, { useEffect, useMemo, useState } from "react";
import {
    Button, Card, Col, Form, Input, InputNumber, Row, Select, Space,
    Switch, Table, Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { getCatalogItems } from "../../functions/catalog";
import { getProductTypes } from "../../functions/productType";

const { Paragraph, Text } = Typography;

const ProductCatalogFields = ({ values, setValues }) => {
    const [tags, setTags] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [productTypes, setProductTypes] = useState([]);

    useEffect(() => {
        Promise.all([
            getCatalogItems("tag"),
            getCatalogItems("attribute"),
            getProductTypes(),
        ]).then(([tagResponse, attributeResponse, typeResponse]) => {
            setTags(tagResponse.data.filter((item) => item.active !== false));
            setAttributes(attributeResponse.data.filter((item) => item.active !== false));
            setProductTypes(typeResponse.data);
        });
    }, []);

    const update = (field, value) => setValues((current) => ({ ...current, [field]: value }));
    const specifications = values.specifications || [];
    const options = values.options || [];
    const variants = values.variants || [];
    const selectedSubIds = (values.subs || []).map((item) => String(item._id || item));
    const availableProductTypes = productTypes.filter((item) =>
        selectedSubIds.includes(String(item.parent?._id || item.parent)));

    const setSpecification = (index, patch) => {
        const next = [...specifications];
        next[index] = { ...next[index], ...patch };
        update("specifications", next);
    };

    const setOption = (index, patch) => {
        const next = [...options];
        next[index] = { ...next[index], ...patch };
        update("options", next);
    };

    const combinations = useMemo(() => options.reduce(
        (result, option) => result.flatMap((combination) =>
            (option.values || []).map((value) => [
                ...combination,
                { name: option.name, value },
            ])),
        [[]]
    ), [options]);

    const generateVariants = () => {
        const existing = new Map(variants.map((variant) => [
            variant.optionValues?.map((item) => `${item.name}:${item.value}`).join("|"),
            variant,
        ]));
        update("variants", combinations
            .filter((item) => item.length)
            .map((optionValues, index) => {
                const key = optionValues.map((item) => `${item.name}:${item.value}`).join("|");
                return existing.get(key) || {
                    sku: `${values.sku || "SKU"}-${index + 1}`,
                    optionValues,
                    price: Number(values.price || 0),
                    quantity: 0,
                    active: true,
                };
            }));
    };

    const setVariant = (index, patch) => {
        const next = [...variants];
        next[index] = { ...next[index], ...patch };
        update("variants", next);
    };

    return (
        <Space direction="vertical" size="large" className="full-width product-catalog-fields">
            <Card size="small" title="ข้อมูล Catalog">
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item label="รหัสสินค้า (SKU)">
                            <Input value={values.sku}
                                onChange={(event) => update("sku", event.target.value)} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="Manufacturer Part Number">
                            <Input value={values.manufacturerPartNumber}
                                onChange={(event) => update("manufacturerPartNumber", event.target.value)} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item label="Product Type (Level 3)">
                            <Select allowClear value={values.productType?._id || values.productType}
                                disabled={!selectedSubIds.length}
                                placeholder={selectedSubIds.length ? "เลือกประเภทสินค้า" : "เลือกหมวดย่อยก่อน"}
                                onChange={(value) => update("productType", value)}
                                options={availableProductTypes.map((item) => ({
                                    value: item._id,
                                    label: `${item.parent?.name ? `${item.parent.name} / ` : ""}${item.name}`,
                                }))} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label="Tag สำหรับค้นหาและเชื่อมโยงสินค้า">
                    <Select mode="multiple" value={(values.tags || []).map((item) => item._id || item)}
                        onChange={(value) => update("tags", value)}
                        options={tags.map((item) => ({ value: item._id, label: item.name }))} />
                </Form.Item>
            </Card>

            <Card size="small" title="ข้อมูลสำหรับคำนวณการจัดส่ง">
                <Paragraph type="secondary">
                    น้ำหนักและขนาดต่อสินค้า 1 ชิ้น ระบบจะนำไปคำนวณค่าขนส่งตามจำนวนในตะกร้า
                </Paragraph>
                <Row gutter={16}>
                    {[
                        ["weightKg", "น้ำหนัก (kg)"],
                        ["lengthCm", "ยาว (cm)"],
                        ["widthCm", "กว้าง (cm)"],
                        ["heightCm", "สูง (cm)"],
                    ].map(([field, label]) => (
                        <Col xs={12} md={6} key={field}>
                            <Form.Item label={label}>
                                <InputNumber min={0} precision={field === "weightKg" ? 3 : 1}
                                    className="full-width"
                                    value={values.shippingProfile?.[field]}
                                    onChange={(value) => update("shippingProfile", {
                                        ...(values.shippingProfile || {}),
                                        [field]: value,
                                    })} />
                            </Form.Item>
                        </Col>
                    ))}
                </Row>
                <Space size="large" wrap>
                    <Space><Switch checked={values.shippingProfile?.fragile}
                        onChange={(value) => update("shippingProfile", { ...(values.shippingProfile || {}), fragile: value })} /> สินค้าแตกหักง่าย</Space>
                    <Space><Switch checked={values.shippingProfile?.shipsSeparately}
                        onChange={(value) => update("shippingProfile", { ...(values.shippingProfile || {}), shipsSeparately: value })} /> ต้องแยกกล่อง</Space>
                </Space>
            </Card>

            <Card size="small" title="Specification / Attribute">
                <Paragraph type="secondary">
                    ค่าเหล่านี้ใช้สร้าง Filter และตารางเปรียบเทียบสินค้าโดยอัตโนมัติ
                </Paragraph>
                {specifications.map((spec, index) => {
                    const attributeId = spec.attribute?._id || spec.attribute;
                    const definition = attributes.find((item) => item._id === attributeId);
                    return (
                        <Row gutter={12} key={`${attributeId || "new"}-${index}`} align="middle">
                            <Col xs={24} md={8}>
                                <Form.Item>
                                    <Select placeholder="เลือก Attribute" value={attributeId}
                                        onChange={(value) => setSpecification(index, {
                                            attribute: value,
                                            value: undefined,
                                            numericValue: undefined,
                                            booleanValue: undefined,
                                            optionValues: [],
                                        })}
                                        options={attributes.map((item) => ({
                                            value: item._id,
                                            label: `${item.group} / ${item.name}${item.unit ? ` (${item.unit})` : ""}`,
                                        }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={20} md={14}>
                                <Form.Item>
                                    {definition?.dataType === "number" ? (
                                        <InputNumber className="full-width" value={spec.numericValue}
                                            addonAfter={definition.unit}
                                            onChange={(value) => setSpecification(index, { numericValue: value })} />
                                    ) : definition?.dataType === "boolean" ? (
                                        <Switch checked={spec.booleanValue}
                                            onChange={(value) => setSpecification(index, { booleanValue: value })} />
                                    ) : ["select", "multiselect"].includes(definition?.dataType) ? (
                                        <Select mode={definition.dataType === "multiselect" ? "multiple" : undefined}
                                            value={definition.dataType === "multiselect" ? spec.optionValues : spec.value}
                                            onChange={(value) => setSpecification(index,
                                                definition.dataType === "multiselect"
                                                    ? { optionValues: value }
                                                    : { value })}
                                            options={(definition.options || []).map((value) => ({ value, label: value }))} />
                                    ) : (
                                        <Input value={spec.value}
                                            onChange={(event) => setSpecification(index, { value: event.target.value })} />
                                    )}
                                </Form.Item>
                            </Col>
                            <Col xs={4} md={2}>
                                <Button type="text" danger icon={<DeleteOutlined />}
                                    onClick={() => update("specifications",
                                        specifications.filter((_, itemIndex) => itemIndex !== index))} />
                            </Col>
                        </Row>
                    );
                })}
                <Button icon={<PlusOutlined />}
                    onClick={() => update("specifications", [...specifications, {}])}>
                    เพิ่ม Specification
                </Button>
            </Card>

            <Card size="small" title="Product Option & Variant">
                <Paragraph type="secondary">
                    ตัวอย่าง Option: แพ็กเกจ = DIP/SMD, ขนาด = 8/16/32 GB จากนั้นสร้าง SKU แยกแต่ละ Variant
                </Paragraph>
                {options.map((option, index) => (
                    <Row gutter={12} key={index} align="middle">
                        <Col xs={24} md={7}>
                            <Form.Item><Input placeholder="ชื่อ Option" value={option.name}
                                onChange={(event) => setOption(index, { name: event.target.value })} /></Form.Item>
                        </Col>
                        <Col xs={20} md={15}>
                            <Form.Item><Select mode="tags" placeholder="พิมพ์ค่าแล้วกด Enter"
                                value={option.values}
                                onChange={(value) => setOption(index, { values: value })} /></Form.Item>
                        </Col>
                        <Col xs={4} md={2}>
                            <Button type="text" danger icon={<DeleteOutlined />}
                                onClick={() => update("options", options.filter((_, itemIndex) => itemIndex !== index))} />
                        </Col>
                    </Row>
                ))}
                <Space wrap>
                    <Button icon={<PlusOutlined />} onClick={() =>
                        update("options", [...options, { name: "", values: [] }])}>
                        เพิ่ม Option
                    </Button>
                    <Button type="primary" ghost icon={<ThunderboltOutlined />}
                        disabled={!combinations.some((item) => item.length)}
                        onClick={generateVariants}>
                        สร้าง Variant
                    </Button>
                </Space>
                {variants.length > 0 && (
                    <Table className="variant-table" rowKey={(_, index) => index}
                        pagination={false} dataSource={variants}
                        columns={[
                            {
                                title: "ตัวเลือก",
                                render: (_, item) => item.optionValues?.map((value) =>
                                    <Text key={`${value.name}:${value.value}`}>{value.name}: {value.value}<br /></Text>),
                            },
                            {
                                title: "SKU",
                                render: (_, item, index) => <Input value={item.sku}
                                    onChange={(event) => setVariant(index, { sku: event.target.value })} />,
                            },
                            {
                                title: "ราคา",
                                render: (_, item, index) => <InputNumber min={0} value={item.price}
                                    onChange={(value) => setVariant(index, { price: value })} />,
                            },
                            {
                                title: "สต็อก",
                                render: (_, item, index) => <InputNumber min={0} value={item.quantity}
                                    onChange={(value) => setVariant(index, { quantity: value })} />,
                            },
                            {
                                title: "ใช้งาน",
                                render: (_, item, index) => <Switch checked={item.active !== false}
                                    onChange={(value) => setVariant(index, { active: value })} />,
                            },
                        ]} />
                )}
            </Card>
        </Space>
    );
};

export default ProductCatalogFields;
