import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Input,
  List,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
  Upload,
  message,
} from "antd";
import {
  BankOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  PayCircleOutlined,
  QrcodeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  applyCoupon,
  createCashOrderForUser,
  createManualPaymentOrder,
  emptyUserCart,
  getProfile,
  getShippingOptions,
  getUserCart,
  uploadUserImage,
} from "../functions/user";

const { Title, Text } = Typography;
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const addressText = (a = {}) =>
  [a.addressLine1, a.addressLine2, a.subdistrict, a.district, a.province, a.postalCode, a.country]
    .filter(Boolean).join(" ");

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => ({ ...state }));
  const couponApplied = useSelector((state) => state.coupon);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [discounted, setDiscounted] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [profile, setProfile] = useState({});
  const [addressIndex, setAddressIndex] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [slip, setSlip] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingMethodId, setShippingMethodId] = useState();

  useEffect(() => {
    Promise.all([getUserCart(user.token), getProfile(user.token), getShippingOptions(user.token)])
      .then(([cartRes, profileRes, shippingRes]) => {
        setProducts(cartRes.data.products || []);
        setTotal(cartRes.data.cartTotal || 0);
        const loadedProfile = profileRes.data.user || {};
        setProfile(loadedProfile);
        setPaymentMethod(loadedProfile.preferredPaymentMethod || "card");
        const defaultIndex = loadedProfile.shippingAddresses?.findIndex((item) => item.isDefault);
        setAddressIndex(defaultIndex >= 0 ? defaultIndex : 0);
        setShippingOptions(shippingRes.data || []);
        if (shippingRes.data?.length) setShippingMethodId(String(shippingRes.data[0].methodId));
      })
      .catch(() => message.error("โหลดข้อมูล Checkout ไม่สำเร็จ"));
  }, [user.token]);

  const shippingAddress = profile.shippingAddresses?.[addressIndex];
  const selectedShipping = shippingOptions.find((item) => String(item.methodId) === shippingMethodId);
  const payable = useMemo(
    () => Number(discounted || total) + Number(selectedShipping?.fee || 0),
    [discounted, total, selectedShipping]
  );

  const resetCart = async () => {
    localStorage.removeItem("cart");
    dispatch({ type: "ADD_TO_CART", payload: [] });
    dispatch({ type: "COUPON_APPLIED", payload: false });
    await emptyUserCart(user.token);
  };

  const emptyCart = async () => {
    await resetCart();
    setProducts([]);
    setTotal(0);
    message.success("ล้างตะกร้าแล้ว");
  };

  const useCoupon = async () => {
    const { data } = await applyCoupon(user.token, coupon);
    if (data?.err) return message.error("คูปองไม่ถูกต้อง");
    setDiscounted(Number(data));
    dispatch({ type: "COUPON_APPLIED", payload: true });
    message.success("ใช้คูปองแล้ว");
  };

  const uploadSlip = async (file) => {
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
      message.error("รองรับรูปสลิปขนาดไม่เกิน 4 MB");
      return Upload.LIST_IGNORE;
    }
    setBusy(true);
    try {
      const image = await fileToDataUrl(file);
      const { data } = await uploadUserImage(
        image,
        "payment-slip",
        user.token,
        slip?.public_id
      );
      setSlip(data);
      message.success("แนบสลิปเรียบร้อย");
    } catch {
      message.error("อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
    return Upload.LIST_IGNORE;
  };

  const placeOrder = async () => {
    if (!shippingAddress) return message.warning("กรุณาเพิ่มที่อยู่จัดส่งในหน้าโปรไฟล์");
    if (!shippingMethodId) return message.warning("กรุณาเลือกวิธีจัดส่ง");
    if (paymentMethod === "cod" && !selectedShipping?.supportsCod) {
      return message.warning("บริการจัดส่งที่เลือกไม่รองรับเก็บเงินปลายทาง");
    }
    if (paymentMethod === "paypal") {
      return message.info("PayPal ต้องตั้งค่า Client ID และ Server API ก่อนเปิดรับเงินจริง");
    }
    if (paymentMethod === "card") {
      sessionStorage.setItem("checkoutContext", JSON.stringify({
        shippingAddress,
        billingAddress: profile.billingProfile || {},
        shippingMethodId,
      }));
      return navigate("/payment");
    }
    setBusy(true);
    try {
      if (paymentMethod === "cod") {
        await createCashOrderForUser(user.token, true, couponApplied, {
          shippingAddress,
          billingAddress: profile.billingProfile || {},
          shippingMethodId,
        });
      } else {
        if (!slip) throw new Error("กรุณาแนบสลิปการชำระเงิน");
        await createManualPaymentOrder({
          method: paymentMethod,
          slip,
          shippingAddress,
          billingAddress: profile.billingProfile || {},
          couponApplied,
          shippingMethodId,
        }, user.token);
      }
      await resetCart();
      message.success(paymentMethod === "cod" ? "สร้างคำสั่งซื้อแล้ว" : "ส่งหลักฐานแล้ว รอเจ้าหน้าที่ตรวจสอบ");
      navigate("/user/history");
    } catch (error) {
      message.error(error.response?.data?.err || error.message || "สร้างคำสั่งซื้อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (!products.length) return <Card><Empty description="ไม่มีสินค้าในตะกร้า" /></Card>;

  return (
    <Row gutter={[20, 20]} className="checkout-page">
      <Col xs={24} lg={15}>
        <Card title="1. ที่อยู่จัดส่ง" extra={<Button onClick={() => navigate("/user/profile")}>จัดการที่อยู่</Button>}>
          <Select
            style={{ width: "100%", marginBottom: 16 }}
            value={addressIndex}
            onChange={setAddressIndex}
            options={(profile.shippingAddresses || []).map((item, index) => ({
              value: index,
              label: `${item.label || `ที่อยู่ ${index + 1}`} — ${item.recipientName || ""}`,
            }))}
            placeholder="เลือกที่อยู่จัดส่ง"
          />
          {shippingAddress
            ? <Descriptions column={1} size="small">
                <Descriptions.Item label="ผู้รับ">{shippingAddress.recipientName} · {shippingAddress.phone}</Descriptions.Item>
                <Descriptions.Item label="ที่อยู่">{addressText(shippingAddress)}</Descriptions.Item>
              </Descriptions>
            : <Alert type="warning" showIcon message="ยังไม่มีที่อยู่จัดส่ง กรุณาเพิ่มในหน้าโปรไฟล์" />}
        </Card>

        <Card title="2. วิธีจัดส่ง" style={{ marginTop: 16 }}>
          {shippingOptions.length ? (
            <Radio.Group value={shippingMethodId} onChange={(e) => setShippingMethodId(e.target.value)} style={{ width: "100%" }}>
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {shippingOptions.map((option) => (
                  <Radio key={option.methodId} value={String(option.methodId)} style={{ width: "100%" }}>
                    <Space direction="vertical" size={0}>
                      <Text strong>{option.providerName} · {option.serviceName}</Text>
                      <Text type="secondary">
                        {option.methodName} · ประมาณ {option.estimatedDelivery?.minDays}–{option.estimatedDelivery?.maxDays} วัน
                        {" · "}{option.fee ? `฿${Number(option.fee).toLocaleString()}` : "ส่งฟรี"}
                      </Text>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          ) : (
            <Alert type="warning" showIcon message="ยังไม่มีวิธีจัดส่งที่เปิดใช้งาน" description="ผู้ดูแลระบบต้องตั้งค่าบริษัทและบริการจัดส่งก่อน" />
          )}
        </Card>

        <Card title="3. วิธีชำระเงิน" style={{ marginTop: 16 }}>
          <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <Space direction="vertical" size="middle">
              <Radio value="card"><CreditCardOutlined /> บัตร ATM/เดบิต/เครดิต ผ่าน Stripe</Radio>
              <Radio value="paypal"><PayCircleOutlined /> PayPal</Radio>
              <Radio value="bank_transfer"><BankOutlined /> โอนผ่านธนาคารและแนบสลิป</Radio>
              <Radio value="qr"><QrcodeOutlined /> สแกน QR Code และแนบสลิป</Radio>
              <Radio value="cod">เก็บเงินปลายทาง</Radio>
            </Space>
          </Radio.Group>

          {paymentMethod === "bank_transfer" && <Alert style={{ marginTop: 16 }} type="info" showIcon
            message="ข้อมูลบัญชีธนาคาร"
            description={import.meta.env.VITE_BANK_ACCOUNT || "กรุณากำหนด VITE_BANK_ACCOUNT ในไฟล์ .env"} />}
          {paymentMethod === "qr" && <div style={{ marginTop: 16, textAlign: "center" }}>
            {import.meta.env.VITE_PAYMENT_QR_IMAGE
              ? <img alt="QR สำหรับชำระเงิน" src={import.meta.env.VITE_PAYMENT_QR_IMAGE} style={{ width: 220, maxWidth: "100%" }} />
              : <Alert type="warning" showIcon message="ยังไม่ได้กำหนดรูป QR" description="กำหนด VITE_PAYMENT_QR_IMAGE ใน frontend/.env" />}
          </div>}
          {["bank_transfer", "qr"].includes(paymentMethod) && <div style={{ marginTop: 16 }}>
            <Upload accept="image/*" showUploadList={false} beforeUpload={uploadSlip}>
              <Button loading={busy} icon={<UploadOutlined />}>{slip ? "เปลี่ยนสลิป" : "แนบสลิปการชำระเงิน"}</Button>
            </Upload>
            {slip && <img alt="หลักฐานการชำระเงิน" src={slip.url} style={{ display: "block", marginTop: 12, maxWidth: 240, maxHeight: 300, objectFit: "contain" }} />}
          </div>}
          {paymentMethod === "paypal" && <Alert style={{ marginTop: 16 }} type="warning" showIcon message="PayPal ยังไม่เปิดใช้งาน"
            description="ต้องเชื่อม PayPal REST API ฝั่ง Server และกำหนด Client ID/Secret ก่อนรับเงินจริง" />}
        </Card>
      </Col>

      <Col xs={24} lg={9}>
        <Card title="สรุปคำสั่งซื้อ">
          <List dataSource={products} renderItem={(item) => <List.Item>
            <List.Item.Meta title={item.product?.title} description={`${item.color || "-"} × ${item.count}`} />
            <Text strong>฿{Number(item.product?.price * item.count).toLocaleString()}</Text>
          </List.Item>} />
          <Divider />
          <Space.Compact style={{ width: "100%" }}>
            <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="รหัสคูปอง" />
            <Button onClick={useCoupon}>ใช้คูปอง</Button>
          </Space.Compact>
          <Divider />
          {discounted > 0 && <Text delete type="secondary">฿{Number(total).toLocaleString()}</Text>}
          <Descriptions size="small" column={1} style={{ marginTop: 12 }}>
            <Descriptions.Item label="ค่าสินค้า">฿{Number(discounted || total).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="ค่าจัดส่ง">{selectedShipping?.fee ? `฿${Number(selectedShipping.fee).toLocaleString()}` : "ฟรี"}</Descriptions.Item>
          </Descriptions>
          <Statistic title="ยอดชำระ" value={payable} precision={2} prefix="฿" />
          <Button block type="primary" size="large" className="checkout-action"
            loading={busy} onClick={placeOrder} style={{ marginTop: 20 }}>
            ยืนยันคำสั่งซื้อ
          </Button>
          <Button block danger type="text" icon={<DeleteOutlined />} onClick={emptyCart} style={{ marginTop: 8 }}>ล้างตะกร้า</Button>
        </Card>
      </Col>
    </Row>
  );
};

export default Checkout;
