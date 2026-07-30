import React, { useEffect, useState } from "react";
import {
  Button, Card, Col, Descriptions, Empty, Image, Row, Space,
  Table, Tag, Timeline, Typography, message,
} from "antd";
import { DownloadOutlined, EnvironmentOutlined, TruckOutlined } from "@ant-design/icons";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useSelector } from "react-redux";
import UserNav from "../../components/nav/UserNav";
import { getUserOrders } from "../../functions/user";
import Invoice from "../../components/order/Invoice";

const { Title, Text } = Typography;
const statusLabels = {
  preparing: "กำลังจัดเตรียม",
  ready: "พร้อมส่ง",
  picked_up: "บริษัทขนส่งรับแล้ว",
  in_transit: "อยู่ระหว่างขนส่ง",
  out_for_delivery: "กำลังนำจ่าย",
  delivered: "ส่งสำเร็จ",
  exception: "เกิดปัญหา",
  returned: "ตีกลับ",
};

const History = () => {
  const user = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getUserOrders(user.token)
      .then((res) => setOrders(res.data || []))
      .catch(() => message.error("โหลดประวัติคำสั่งซื้อไม่สำเร็จ"));
  }, [user.token]);

  return <Row gutter={[20, 20]}>
    <Col xs={24} lg={5}><UserNav /></Col>
    <Col xs={24} lg={19}>
      <Title level={2}>ประวัติคำสั่งซื้อ</Title>
      {!orders.length && <Card><Empty description="ยังไม่มีคำสั่งซื้อ" /></Card>}
      {[...orders].reverse().map((order) => (
        <Card key={order._id} style={{ marginBottom: 16 }}
          title={<Space><Text strong>#{order._id.slice(-10).toUpperCase()}</Text><Tag color="blue">{order.orderStatus}</Tag></Space>}
          extra={<PDFDownloadLink document={<Invoice order={order} />} fileName={`invoice-${order._id}.pdf`}>
            {({ loading }) => <Button loading={loading} icon={<DownloadOutlined />}>ใบสั่งซื้อ PDF</Button>}
          </PDFDownloadLink>}>
          <Descriptions column={{ xs: 1, md: 2 }} size="small" bordered items={[
            { key: "date", label: "วันที่สั่งซื้อ", children: new Date(order.createdAt).toLocaleString("th-TH") },
            { key: "total", label: "ยอดรวม", children: `฿${Number((order.paymentIntent?.amount || 0) / 100).toLocaleString()}` },
            { key: "shipping", label: "การจัดส่ง", children: order.shipping?.providerName ? `${order.shipping.providerName} · ${order.shipping.serviceName}` : "-" },
            { key: "eta", label: "ระยะเวลาโดยประมาณ", children: order.shipping?.estimatedDelivery?.maxDays ? `${order.shipping.estimatedDelivery.minDays}–${order.shipping.estimatedDelivery.maxDays} วัน` : "-" },
          ]} />
          <Table rowKey={(item) => item._id || item.product?._id} size="small" pagination={false}
            style={{ marginTop: 16 }} dataSource={order.products} columns={[
              { title: "สินค้า", render: (_, item) => <Space><Image preview={false} width={48} height={48} src={item.product?.images?.[0]?.url} />{item.product?.title || "สินค้าถูกลบ"}</Space> },
              { title: "สี", dataIndex: "color" },
              { title: "จำนวน", dataIndex: "count" },
              { title: "ราคา", render: (_, item) => `฿${Number(item.product?.price || 0).toLocaleString()}` },
            ]} />

          {!!order.packages?.length && <Card size="small" title={<><TruckOutlined /> ติดตามพัสดุ</>} style={{ marginTop: 16 }}>
            {order.packages.map((parcel) => <Card.Grid key={parcel._id} hoverable={false} style={{ width: "100%", padding: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={9}>
                  <Space direction="vertical">
                    <Text strong>{parcel.name}</Text>
                    <Tag color={parcel.status === "delivered" ? "green" : "processing"}>{statusLabels[parcel.status] || parcel.status}</Tag>
                    {parcel.trackingNumber && <Text copyable>{parcel.trackingNumber}</Text>}
                    {parcel.trackingUrl && <Button type="link" href={parcel.trackingUrl} target="_blank" icon={<EnvironmentOutlined />}>ติดตามกับบริษัทขนส่ง</Button>}
                  </Space>
                </Col>
                <Col xs={24} md={15}>
                  <Timeline items={[...(parcel.events || [])].reverse().map((event) => ({
                    color: event.status === "delivered" ? "green" : "blue",
                    children: <div><Text strong>{statusLabels[event.status] || event.status}</Text><br /><Text>{event.description}</Text>{event.location && <><br /><Text type="secondary">{event.location}</Text></>}<br /><Text type="secondary">{new Date(event.occurredAt).toLocaleString("th-TH")}</Text></div>,
                  }))} />
                </Col>
              </Row>
            </Card.Grid>)}
          </Card>}
        </Card>
      ))}
    </Col>
  </Row>;
};

export default History;
