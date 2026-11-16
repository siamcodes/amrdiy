import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector, useDispatch } from "react-redux";
import { createPaymentIntent } from "../functions/stripe";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Spin, Result, Typography } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { createOrder, emptyUserCart } from "../functions/user";

const { Text } = Typography;

const StripeCheckout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, coupon } = useSelector((state) => ({ ...state }));
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [cartTotal, setCartTotal] = useState(0);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(0);
  const [payable, setPayable] = useState(0);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    let active = true;
    const loadIntent = async () => {
      try {
        const checkoutContext = JSON.parse(sessionStorage.getItem("checkoutContext") || "{}");
        const response = await createPaymentIntent(
          user?.token,
          coupon,
          checkoutContext.shippingMethodId,
          checkoutContext
        );
        if (!active) return;
        setClientSecret(response.data.clientSecret || "");
        setCartTotal(response.data.cartTotal || 0);
        setTotalAfterDiscount(response.data.totalAfterDiscount || 0);
        setPayable(response.data.payable || 0);
        if (!response.data.clientSecret) setError("ไม่สามารถเริ่มรายการชำระเงินได้ กรุณากลับไปหน้า Checkout");
      } catch (err) {
        if (active) setError(err.response?.data?.err || err.response?.data?.message || "ไม่สามารถสร้างรายการชำระเงินได้");
      } finally {
        if (active) setLoadingIntent(false);
      }
    };
    if (user?.token) loadIntent();
    else {
      setError("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
      setLoadingIntent(false);
    }
    return () => { active = false; };
  }, [user?.token, coupon]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret || processing || succeeded) return;
    setProcessing(true);
    setError("");
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: event.currentTarget.elements.name.value.trim() },
        },
      });

      if (result.error) throw new Error(result.error.message || "การชำระเงินไม่สำเร็จ");
      if (result.paymentIntent?.status !== "succeeded") {
        throw new Error("Stripe ยังไม่ยืนยันการชำระเงิน กรุณาตรวจสอบสถานะก่อนลองอีกครั้ง");
      }

      const checkoutContext = JSON.parse(sessionStorage.getItem("checkoutContext") || "{}");
      const orderResponse = await createOrder(
        { paymentIntent: result.paymentIntent, ...checkoutContext },
        user.token
      );
      if (!orderResponse.data?.ok || !orderResponse.data?.orderId) {
        throw new Error(orderResponse.data?.err || "ชำระเงินแล้ว แต่ยังสร้างคำสั่งซื้อไม่สำเร็จ กรุณาติดต่อเจ้าหน้าที่พร้อมแจ้ง Payment Intent ID");
      }

      // Only clear the cart after the backend confirms that the order exists.
      try {
        await emptyUserCart(user.token);
      } catch (cartError) {
        console.error("Order created but server cart cleanup failed", cartError);
      }
      localStorage.removeItem("cart");
      dispatch({ type: "ADD_TO_CART", payload: [] });
      dispatch({ type: "COUPON_APPLIED", payload: false });
      sessionStorage.removeItem("checkoutContext");
      setSucceeded(true);
      setTimeout(() => navigate("/user/history"), 1200);
    } catch (err) {
      setError(err.response?.data?.err || err.response?.data?.message || err.message || "เกิดข้อผิดพลาดระหว่างชำระเงิน");
    } finally {
      setProcessing(false);
    }
  };

  const handleChange = (event) => {
    setDisabled(!event.complete || Boolean(event.error));
    setError(event.error?.message || "");
  };

  const cardStyle = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: "Arial, sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": { color: "#8792a2" },
      },
      invalid: { color: "#fa755a", iconColor: "#fa755a" },
    },
  };

  if (loadingIntent) return <Card><Spin tip="กำลังเตรียมรายการชำระเงิน..." /></Card>;
  if (succeeded) {
    return <Result status="success" title="ชำระเงินและสร้างคำสั่งซื้อสำเร็จ"
      subTitle="กำลังนำคุณไปยังประวัติคำสั่งซื้อ"
      extra={<Button type="primary" onClick={() => navigate("/user/history")}>ดูคำสั่งซื้อ</Button>} />;
  }

  return (
    <>
      {error && <Alert type="error" showIcon message={error}
        description="หากยอดเงินถูกตัดแล้ว อย่าชำระซ้ำ ให้ตรวจสอบประวัติคำสั่งซื้อหรือติดต่อเจ้าหน้าที่ก่อน" style={{ marginBottom: 16 }} />}
      <Card title="สรุปยอดชำระ" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <Text type="secondary">ยอดสินค้า</Text><Text>฿{Number(cartTotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</Text>
        </div>
        {totalAfterDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <Text type="secondary">ยอดหลังส่วนลด</Text><Text>฿{Number(totalAfterDiscount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</Text>
        </div>}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text strong><DollarOutlined /> ยอดชำระทั้งหมด</Text>
          <Text strong>฿{(Number(payable) / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</Text>
        </div>
      </Card>
      <form id="payment-form" className="stripe-form" onSubmit={handleSubmit}>
        <label htmlFor="stripe-cardholder">ชื่อบนบัตร</label>
        <input id="stripe-cardholder" name="name" type="text" autoComplete="cc-name"
          required maxLength={120} placeholder="ชื่อผู้ถือบัตร"
          style={{ width: "100%", padding: 12, margin: "8px 0 16px", border: "1px solid #d9d9d9", borderRadius: 8 }} />
        <Card style={{ marginBottom: 16 }}><CardElement options={cardStyle} onChange={handleChange} /></Card>
        <Button block type="primary" size="large" htmlType="submit"
          loading={processing} disabled={!stripe || !clientSecret || disabled || processing}>
          {processing ? "กำลังตรวจสอบการชำระเงิน..." : "ยืนยันและชำระเงิน"}
        </Button>
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Link to="/checkout">กลับไปแก้ไขคำสั่งซื้อ</Link>
        </div>
      </form>
    </>
  );
};

export default StripeCheckout;
