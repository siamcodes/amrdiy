import React, { useEffect, useMemo, useState } from "react";
import {
    Button, Card, Empty, Image, Input, Popconfirm, Space, Table, Tag, Typography,
} from "antd";
import {
    DeleteOutlined, EditOutlined, ExperimentOutlined, FileTextOutlined,
    SearchOutlined, ShoppingOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import AdminNav from "../../../components/nav/AdminNav";
import { getProductsByCount, removeProduct } from "../../../functions/product";

const { Title, Text } = Typography;

const AllProducts = () => {
    const user = useSelector((state) => state.user);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const loadAllProducts = async () => {
        setLoading(true);
        try {
            const { data } = await getProductsByCount(1000);
            setProducts(data);
        } catch {
            toast.error("โหลดรายการสินค้าไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { loadAllProducts(); }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return products;
        return products.filter((item) => [
            item.title, item.sku, item.manufacturerPartNumber,
            item.brand, item.category?.name, item.productType?.name,
        ].some((value) => String(value || "").toLowerCase().includes(query)));
    }, [products, search]);

    const remove = async (product) => {
        try {
            await removeProduct(product.slug, user.token);
            toast.success(`ลบ "${product.title}" แล้ว`);
            loadAllProducts();
        } catch (error) {
            toast.error(error.response?.data?.err || "ลบสินค้าไม่สำเร็จ");
        }
    };

    return <div className="admin-page-grid">
        <Card className="admin-sidebar-card"><AdminNav /></Card>
        <main>
            <Title level={2}><ShoppingOutlined /> รายการสินค้า</Title>
            <Card>
                <Input size="large" allowClear prefix={<SearchOutlined />}
                    placeholder="ค้นหาชื่อสินค้า SKU, Part Number, Brand หรือประเภทสินค้า"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                <Table rowKey="_id" loading={loading} dataSource={filtered} style={{ marginTop: 16 }}
                    locale={{ emptyText: <Empty description="ไม่พบสินค้า" /> }}
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                    scroll={{ x: 1100 }}
                    columns={[
                        { title: "สินค้า", width: 330, render: (_, product) => <Space>
                            <Image width={64} height={64} preview={false} style={{ objectFit: "cover", borderRadius: 8 }} src={product.images?.[0]?.url} />
                            <div><Link to={`/product/${product.slug}`}><Text strong>{product.title}</Text></Link><br /><Text type="secondary">{product.sku || product.manufacturerPartNumber || "-"}</Text></div>
                        </Space> },
                        { title: "ประเภท", render: (_, product) => product.productType?.name || product.category?.name || "-" },
                        { title: "Brand", dataIndex: "brand", render: (value) => value || "-" },
                        { title: "ราคา", dataIndex: "price", render: (value) => `฿${Number(value).toLocaleString()}` },
                        { title: "คงเหลือ", dataIndex: "quantity", render: (value) => <Tag color={value > 0 ? "green" : "red"}>{value || 0}</Tag> },
                        { title: "การจัดการ", width: 360, fixed: "right", render: (_, product) => <Space wrap>
                            <Link to={`/admin/product/${product.slug}`}><Button type="primary" icon={<EditOutlined />}>แก้ไขสินค้า</Button></Link>
                            <Link to={`/admin/product-detail/${product.slug}`}><Button icon={<ExperimentOutlined />}>ตัวอย่างใช้งาน</Button></Link>
                            <Link to={`/admin/product-content/${product.slug}`}><Button icon={<FileTextOutlined />}>คุณสมบัติ</Button></Link>
                            <Popconfirm title={`ลบ "${product.title}"?`} onConfirm={() => remove(product)}><Button danger icon={<DeleteOutlined />} /></Popconfirm>
                        </Space> },
                    ]} />
            </Card>
        </main>
    </div>;
};

export default AllProducts;
