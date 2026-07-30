import React, { useEffect, useState } from "react";
import { Button, Card, Form, Input, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import UserNav from "../../components/nav/UserNav";
import { saveContact } from "../../functions/user";
import RichTextEditor from "../../components/forms/RichTextEditor";

const { Paragraph, Title } = Typography;

const Contact = () => {
    const [form] = Form.useForm();
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedTitle = localStorage.getItem("contact-title");
        const savedDescription = localStorage.getItem("contact-description");
        if (savedTitle) form.setFieldValue("title", JSON.parse(savedTitle));
        if (savedDescription) setDescription(JSON.parse(savedDescription));
    }, [form]);

    const submit = async ({ title }) => {
        if (!description || description === "<p><br></p>") {
            toast.error("กรุณากรอกรายละเอียด");
            return;
        }
        setLoading(true);
        try {
            await saveContact(title, description);
            localStorage.removeItem("contact-title");
            localStorage.removeItem("contact-description");
            form.resetFields();
            setDescription("");
            toast.success("ส่งข้อความเรียบร้อยแล้ว");
        } catch (error) {
            toast.error(error.response?.data?.message || "ส่งข้อความไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><UserNav /></Card>
            <Card>
                <Title level={2}>ติดต่อสอบถาม / แจ้งปัญหาการใช้งาน</Title>
                <Paragraph type="secondary">กรอกหัวข้อและรายละเอียดที่ต้องการติดต่อทีมงาน</Paragraph>
                <Form form={form} layout="vertical" onFinish={submit}
                    onValuesChange={(_, values) =>
                        localStorage.setItem("contact-title", JSON.stringify(values.title || ""))}>
                    <Form.Item name="title" label="หัวข้อ"
                        rules={[
                            { required: true, message: "กรุณากรอกหัวข้อ" },
                            { max: 150, message: "หัวข้อต้องไม่เกิน 150 ตัวอักษร" },
                        ]}>
                        <Input size="large" placeholder="หัวข้อที่ต้องการสอบถาม" />
                    </Form.Item>
                    <Form.Item label="รายละเอียด" required>
                        <RichTextEditor value={description}
                            onChange={(value) => {
                                setDescription(value);
                                localStorage.setItem("contact-description", JSON.stringify(value));
                            }}
                            placeholder="อธิบายรายละเอียดหรือปัญหาที่พบ" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" size="large"
                        icon={<SendOutlined />} loading={loading}>
                        ส่งข้อความ
                    </Button>
                </Form>
            </Card>
        </div>
    );
};

export default Contact;
