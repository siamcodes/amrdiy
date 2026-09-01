import React, { useState } from "react";
import { Button, Card, Modal, Space, Typography } from "antd";
import { EyeOutlined, OrderedListOutlined, PlusOutlined, SafetyOutlined } from "@ant-design/icons";
import RichTextEditor from "./RichTextEditor";
import { renderRichContent } from "../../helpers/richContent";

const { Paragraph, Text } = Typography;
const templates = {
  basic: `<h2>ตัวอย่างการใช้งาน</h2>
<p>อธิบายว่าสินค้านี้เหมาะกับงานประเภทใด และช่วยแก้ปัญหาอะไร</p>
<h3>อุปกรณ์ที่ต้องใช้</h3>
<ul><li>สินค้าและอุปกรณ์หลัก</li><li>เครื่องมือหรืออุปกรณ์เสริม</li></ul>
<h3>ขั้นตอนการใช้งาน</h3>
<ol><li>เตรียมอุปกรณ์</li><li>เชื่อมต่อหรือติดตั้ง</li><li>ทดสอบการทำงาน</li></ol>
<h3>ผลลัพธ์ที่ได้</h3><p>อธิบายผลลัพธ์และสิ่งที่ผู้ใช้ควรตรวจสอบ</p>`,
  steps: `<h3>ขั้นตอนเพิ่มเติม</h3><ol><li>ขั้นตอนที่ 1</li><li>ขั้นตอนที่ 2</li><li>ขั้นตอนที่ 3</li></ol>`,
  safety: `<blockquote><strong>ข้อควรระวัง:</strong> ตรวจสอบแรงดันไฟฟ้า ขั้วต่อ และคู่มือของสินค้าก่อนใช้งานทุกครั้ง</blockquote>`,
};

const UsageExampleEditor = ({ value = "", onChange, minHeight = 300 }) => {
  const [preview, setPreview] = useState(false);
  const append = (html) => onChange(`${value || ""}${html}`);
  return <>
    <Card size="small" style={{ marginBottom: 12 }}>
      <Space wrap>
        <Button icon={<PlusOutlined />} onClick={() => {
          if (!value || value === "<p><br></p>") onChange(templates.basic);
          else append(templates.basic);
        }}>โครงสร้างตัวอย่าง</Button>
        <Button icon={<OrderedListOutlined />} onClick={() => append(templates.steps)}>เพิ่มขั้นตอน</Button>
        <Button icon={<SafetyOutlined />} onClick={() => append(templates.safety)}>เพิ่มข้อควรระวัง</Button>
        <Button icon={<EyeOutlined />} onClick={() => setPreview(true)}>ดูตัวอย่าง</Button>
      </Space>
      <Paragraph type="secondary" style={{ margin: "10px 0 0" }}>
        ใช้หัวข้อ รายการลำดับ และข้อควรระวังเพื่อให้ลูกค้าอ่านและทำตามได้ง่าย
      </Paragraph>
    </Card>
    <div style={{ "--usage-editor-height": `${minHeight}px` }} className="usage-example-editor">
      <RichTextEditor value={value} onChange={onChange}
        placeholder="อธิบายอุปกรณ์ ขั้นตอนการต่อ วิธีใช้งาน ผลลัพธ์ และข้อควรระวัง..." />
    </div>
    <Modal open={preview} onCancel={() => setPreview(false)} footer={null} width={900} title="ตัวอย่างที่ลูกค้าจะเห็น">
      <div className="blog-content" style={{ margin: 0 }}>{value ? renderRichContent(value) : <Text type="secondary">ยังไม่มีเนื้อหา</Text>}</div>
    </Modal>
  </>;
};

export default UsageExampleEditor;
