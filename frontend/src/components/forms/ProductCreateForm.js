import React from "react";
import { Button, Col, Form, Input, InputNumber, Row, Select } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import RichTextEditor from "./RichTextEditor";
import ProductCatalogFields from "./ProductCatalogFields";
import ColorSelect from "./ColorSelect";

const ProductCreateForm = ({
  handleSubmit,
  handleChange,
  setValues,
  values,
  handleCategoryChange,
  subOptions,
  showSub,
  handleBrandChange,
  brandOptions,
  generationOptions,
  showGeneration,
}) => {
  const {
    title, description, price, categories, category, subs, shipping,
    quantity, colors, color, brandRef, generations,
  } = values;

  const change = (name, value) => handleChange({ target: { name, value } });

  return (
    <Form layout="vertical" onSubmitCapture={handleSubmit}>
      <Form.Item label="ชื่อสินค้า" required>
        <Input size="large" name="title" value={title} onChange={handleChange} />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={24} md={showSub ? 12 : 24}>
          <Form.Item label={`ประเภทหลัก (${categories.length})`} required>
            <Select
              size="large"
              value={category || undefined}
              placeholder="เลือกประเภทหลัก"
              onChange={(value) => handleCategoryChange({ target: { value } })}
              options={categories.map((item) => ({ value: item._id, label: item.name }))}
            />
          </Form.Item>
        </Col>
        {showSub && (
          <Col xs={24} md={12}>
            <Form.Item label={`ประเภทย่อย (${subOptions.length})`}>
              <Select
                mode="multiple"
                size="large"
                value={subs}
                placeholder="เลือกประเภทย่อย"
                onChange={(value) => setValues((current) => ({
                  ...current,
                  subs: value,
                  productType: "",
                }))}
                options={subOptions.map((item) => ({ value: item._id, label: item.name }))}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="ราคา" required>
            <InputNumber size="large" min={0} value={price}
              onChange={(value) => change("price", value)} className="full-width" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="จำนวน" required>
            <InputNumber size="large" min={0} value={quantity}
              onChange={(value) => change("quantity", value)} className="full-width" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Form.Item label="สี">
            <ColorSelect size="large" colors={colors} value={color} placeholder="เลือกสี"
              onChange={(value) => change("color", value)}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label={`ยี่ห้อ (${brandOptions.length})`}>
            <Select size="large" value={brandRef || undefined} placeholder="เลือกยี่ห้อ"
              onChange={(value) => handleBrandChange({ target: { value } })}
              options={brandOptions.map((item) => ({ value: item._id, label: item.name }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item label="การจัดส่ง">
            <Select size="large" value={shipping || undefined} placeholder="เลือก"
              onChange={(value) => change("shipping", value)}
              options={[
                { value: "No", label: "ไม่จัดส่ง" },
                { value: "Yes", label: "จัดส่ง" },
              ]} />
          </Form.Item>
        </Col>
      </Row>

      {showGeneration && (
        <Form.Item label={`รุ่นสินค้า (${generationOptions.length})`}>
          <Select mode="multiple" size="large" value={generations}
            placeholder="เลือกรุ่นสินค้า"
            onChange={(value) => setValues((current) => ({ ...current, generations: value }))}
            options={generationOptions.map((item) => ({ value: item._id, label: item.name }))} />
        </Form.Item>
      )}

      <Form.Item label="รายละเอียดสินค้า">
        <RichTextEditor
          value={description}
          onChange={(value) => change("description", value)}
          placeholder="กรอกรายละเอียด คุณสมบัติ และข้อมูลสินค้า"
        />
      </Form.Item>
      <ProductCatalogFields values={values} setValues={setValues} />
      <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />}>
        บันทึกสินค้า
      </Button>
    </Form>
  );
};

export default ProductCreateForm;
