import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Spin,
  Tabs,
  Typography,
  Upload,
  message,
} from "antd";
import {
  BankOutlined,
  CameraOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  QrcodeOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import UserNav from "../../components/nav/UserNav";
import { getProfile, updateProfile, uploadUserImage } from "../../functions/user";

const { Title, Text } = Typography;
const emptyAddress = {
  label: "ที่อยู่หลัก",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  subdistrict: "",
  district: "",
  province: "",
  postalCode: "",
  country: "ประเทศไทย",
  isDefault: true,
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const AddressFields = ({
  prefix,
  contactNameField = "recipientName",
  contactNameLabel = "ชื่อผู้รับ",
  showContact = true,
}) => (
  <div style={{ maxWidth: 1040 }}>
    {showContact && (
      <Row gutter={[20, 0]}>
        <Col xs={24} md={15}>
          <Form.Item
            name={[...prefix, contactNameField]}
            label={contactNameLabel}
            rules={[{ required: true, message: `กรุณากรอก${contactNameLabel}` }]}
          >
            <Input size="large" placeholder={contactNameLabel} />
          </Form.Item>
        </Col>
        <Col xs={24} md={9}>
          <Form.Item
            name={[...prefix, "phone"]}
            label="เบอร์โทรศัพท์"
            rules={[
              { required: true, message: "กรุณากรอกเบอร์โทรศัพท์" },
              { pattern: /^[0-9+\-\s]{9,15}$/, message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" },
            ]}
          >
            <Input size="large" inputMode="tel" maxLength={15} placeholder="08x-xxx-xxxx" />
          </Form.Item>
        </Col>
      </Row>
    )}

    <Row gutter={[20, 0]}>
      <Col span={24}>
        <Form.Item
          name={[...prefix, "addressLine1"]}
          label="บ้านเลขที่ อาคาร ถนน"
          rules={[{ required: true, message: "กรุณากรอกที่อยู่" }]}
        >
          <Input size="large" placeholder="บ้านเลขที่ หมู่ อาคาร ซอย และถนน" />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item
          name={[...prefix, "addressLine2"]}
          label="รายละเอียดเพิ่มเติม"
          extra="เช่น ชั้น ห้อง จุดสังเกต หรือคำแนะนำสำหรับขนส่ง"
        >
          <Input size="large" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={[20, 0]}>
      <Col xs={24} sm={12} xl={6}>
        <Form.Item
          name={[...prefix, "subdistrict"]}
          label="ตำบล/แขวง"
          rules={[{ required: true, message: "กรุณากรอกตำบล/แขวง" }]}
        >
          <Input size="large" placeholder="ตำบล/แขวง" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Form.Item
          name={[...prefix, "district"]}
          label="อำเภอ/เขต"
          rules={[{ required: true, message: "กรุณากรอกอำเภอ/เขต" }]}
        >
          <Input size="large" placeholder="อำเภอ/เขต" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12} xl={7}>
        <Form.Item
          name={[...prefix, "province"]}
          label="จังหวัด"
          rules={[{ required: true, message: "กรุณากรอกจังหวัด" }]}
        >
          <Input size="large" placeholder="จังหวัด" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={12} xl={5}>
        <Form.Item
          name={[...prefix, "postalCode"]}
          label="รหัสไปรษณีย์"
          rules={[
            { required: true, message: "กรุณากรอกรหัสไปรษณีย์" },
            { pattern: /^\d{5}$/, message: "กรุณากรอกตัวเลข 5 หลัก" },
          ]}
        >
          <Input size="large" inputMode="numeric" maxLength={5} placeholder="10110" />
        </Form.Item>
      </Col>
    </Row>
  </div>
);

const Profile = () => {
  const { user } = useSelector((state) => ({ ...state }));
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const picture = Form.useWatch("picture", form);

  useEffect(() => {
    getProfile(user.token)
      .then(({ data }) => {
        const profile = data.user;
        form.setFieldsValue({
          ...profile,
          picture: profile.picture || profile.image,
          profileImage: profile.profileImage || {},
          shippingAddresses: profile.shippingAddresses?.length
            ? profile.shippingAddresses
            : [emptyAddress],
        });
      })
      .catch(() => message.error("โหลดข้อมูลโปรไฟล์ไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [form, user.token]);

  const save = async (values) => {
    setLoading(true);
    try {
      await updateProfile({ ...values, image: values.picture }, user.token);
      message.success("บันทึกโปรไฟล์เรียบร้อย");
    } catch (error) {
      message.error(error.response?.data?.err || "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const uploadPicture = async (file) => {
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      message.error("รองรับไฟล์รูปไม่เกิน 2 MB");
      return Upload.LIST_IGNORE;
    }
    setUploading(true);
    try {
      const image = await fileToDataUrl(file);
      const { data } = await uploadUserImage(image, "profile", user.token);
      form.setFieldsValue({
        picture: data.url,
        profileImage: data,
      });
      message.success("อัปโหลดรูปแล้ว กดบันทึกเพื่อยืนยัน");
    } catch {
      message.error("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE;
  };

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={5}><UserNav /></Col>
      <Col xs={24} lg={19}>
        <Spin spinning={loading}>
          <Card>
            <Space align="center" size="large" wrap>
              <Avatar size={96} src={picture} icon={<UserOutlined />} />
              <div>
                <Title level={3} style={{ margin: 0 }}>บัญชีและการชำระเงิน</Title>
                <Text type="secondary">จัดการข้อมูลผู้รับ ที่อยู่ออกบิล และวิธีชำระเงินที่ต้องการ</Text>
                <div style={{ marginTop: 12 }}>
                  <Upload accept="image/*" showUploadList={false} beforeUpload={uploadPicture}>
                    <Button loading={uploading} icon={<CameraOutlined />}>เปลี่ยนรูปโปรไฟล์</Button>
                  </Upload>
                </div>
              </div>
            </Space>
          </Card>

          <Form form={form} layout="vertical" onFinish={save} style={{ marginTop: 16 }}>
            <Form.Item name="picture" hidden><Input /></Form.Item>
            <Form.Item name="profileImage" hidden />
            <Tabs
              items={[
                {
                  key: "personal",
                  label: <span><UserOutlined /> ข้อมูลส่วนตัว</span>,
                  children: <Card>
                    <Row gutter={16}>
                      <Col xs={24} md={12}><Form.Item name="firstName" label="ชื่อ" rules={[{ required: true }]}><Input /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name="lastName" label="นามสกุล" rules={[{ required: true }]}><Input /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name="username" label="Username"><Input disabled /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name="email" label="Email"><Input disabled /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name="phone" label="เบอร์โทรศัพท์"><Input /></Form.Item></Col>
                    </Row>
                  </Card>,
                },
                {
                  key: "shipping",
                  label: <span><EnvironmentOutlined /> ที่อยู่จัดส่ง</span>,
                  children: <Form.List name="shippingAddresses">
                    {(fields, { add, remove }) => <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                      {fields.map(({ key, name }) => <Card key={key} title={`ที่อยู่จัดส่ง ${name + 1}`} styles={{ body: { padding: "24px clamp(16px, 3vw, 32px)" } }} extra={fields.length > 1 && <Button danger onClick={() => remove(name)}>ลบ</Button>}>
                        <Row gutter={[20, 0]} style={{ maxWidth: 1040 }}>
                          <Col xs={24} md={15}><Form.Item name={[name, "label"]} label="ชื่อเรียกที่อยู่"><Input size="large" placeholder="เช่น บ้าน ที่ทำงาน หรือโกดัง" /></Form.Item></Col>
                          <Col xs={24} md={9}><Form.Item name={[name, "isDefault"]} label="การใช้งาน"><Radio.Group options={[{ label: "ค่าเริ่มต้น", value: true }, { label: "ที่อยู่อื่น", value: false }]} /></Form.Item></Col>
                        </Row>
                        <AddressFields prefix={[name]} />
                      </Card>)}
                      <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ ...emptyAddress, isDefault: false })}>เพิ่มที่อยู่</Button>
                    </Space>}
                  </Form.List>,
                },
                {
                  key: "billing",
                  label: <span><BankOutlined /> ข้อมูลออกบิล</span>,
                  children: <Card styles={{ body: { padding: "24px clamp(16px, 3vw, 32px)" } }}>
                    <Form.Item name={["billingProfile", "type"]} label="ประเภทผู้เสียภาษี">
                      <Radio.Group options={[{ label: "บุคคลธรรมดา", value: "individual" }, { label: "นิติบุคคล", value: "company" }]} />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col xs={24} md={12}><Form.Item name={["billingProfile", "name"]} label="ชื่อบุคคล/บริษัท" rules={[{ required: true }]}><Input /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={["billingProfile", "taxId"]} label="เลขประจำตัวผู้เสียภาษี"><Input maxLength={13} /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={["billingProfile", "branch"]} label="สำนักงานใหญ่/สาขา"><Input /></Form.Item></Col>
                      <Col xs={24} md={12}><Form.Item name={["billingProfile", "phone"]} label="โทรศัพท์"><Input /></Form.Item></Col>
                    </Row>
                    <Divider orientation="left">ที่อยู่สำหรับออกเอกสาร</Divider>
                    <AddressFields
                      prefix={["billingProfile"]}
                      showContact={false}
                    />
                  </Card>,
                },
                {
                  key: "payment",
                  label: <span><CreditCardOutlined /> การชำระเงิน</span>,
                  children: <Card>
                    <Form.Item name="preferredPaymentMethod" label="วิธีชำระเงินที่ต้องการ">
                      <Radio.Group>
                        <Space direction="vertical">
                          <Radio value="card"><CreditCardOutlined /> บัตรเดบิต/ATM/บัตรเครดิต (Stripe)</Radio>
                          <Radio value="paypal">PayPal</Radio>
                          <Radio value="bank_transfer"><BankOutlined /> โอนผ่านธนาคารและแนบสลิป</Radio>
                          <Radio value="qr"><QrcodeOutlined /> สแกน QR Code และแนบสลิป</Radio>
                          <Radio value="cod">เก็บเงินปลายทาง</Radio>
                        </Space>
                      </Radio.Group>
                    </Form.Item>
                    <Text type="secondary">ระบบไม่จัดเก็บเลขบัตรหรือ CVV ข้อมูลบัตรจะถูกส่งตรงไปยังผู้ให้บริการชำระเงิน</Text>
                  </Card>,
                },
              ]}
            />
            <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} style={{ marginTop: 16 }}>บันทึกข้อมูลทั้งหมด</Button>
          </Form>
        </Spin>
      </Col>
    </Row>
  );
};

export default Profile;
