import React, { useState, useEffect } from "react";
import { Button, Card, Input, Space, Spin, Typography } from "antd";
import AdminNav from "../../../components/nav/AdminNav";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { getProduct, saveDetail } from "../../../functions/product";

import UsageExampleEditor from "../../../components/forms/UsageExampleEditor";
const { Title } = Typography;

const ProductDetail = ({ match, history }) => {
    const { user } = useSelector((state) => ({ ...state }));
    // state
    const [title, setTitle] = useState(false);
    const [loading, setLoading] = useState(false);


    const detailFromLS = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        if (localStorage.getItem(`product-detail:${slug}`)) {
            return JSON.parse(localStorage.getItem(`product-detail:${slug}`));
        } else {
            return false;
        }
    };

    // router
    const { slug } = match.params;
    const [detail, setDetail] = useState(detailFromLS);

    useEffect(() => {
        loadProduct();
    }, [slug]);


    const loadProduct = () => {
        setLoading(true);
        getProduct(slug).then((p) => {
            // console.log("single product", p);
            // 1 load single proudct
            console.log('Product ', p.data.title)
            setTitle(p.data.title);
            const draft = localStorage.getItem(`product-detail:${slug}`);
            setDetail(draft ? JSON.parse(draft) : (p.data.detail || ""));
        }).catch(() => toast.error("โหลดข้อมูลสินค้าไม่สำเร็จ"))
          .finally(() => setLoading(false));
    };


    const saveDetailToDB = () => {
        setLoading(true);
        saveDetail(slug, detail, user.token).then((res) => {
            if (res.data.ok) {
                setLoading(false);
                localStorage.removeItem(`product-detail:${slug}`);
                toast.success("บันทึกตัวอย่างการใช้งานแล้ว");
                history.push(`/admin/product/${slug}`);
            }
        }).catch((error) => toast.error(error.response?.data?.err || "บันทึกไม่สำเร็จ"))
          .finally(() => setLoading(false));
    };

    const handleDetail = (e) => {
        // setLoading(true);
        setDetail(e);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`product-detail:${slug}`, JSON.stringify(e));
        }
    };


    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <Card>
                <Spin spinning={loading}>
                    <Title level={2}>ตัวอย่างการใช้งาน</Title>
                    <Input size="large" value={title || ""} readOnly style={{ marginBottom: 16 }} />
                    <div className="editor-section">
                        <UsageExampleEditor value={detail || ""} onChange={handleDetail} minHeight={440} />
                    </div>
                    <Space>
                        <Button onClick={saveDetailToDB} type="primary">บันทึกตัวอย่างการใช้งาน</Button>
                        <Button onClick={() => history.push(`/admin/product/${slug}`)}>กลับหน้าแก้ไขสินค้า</Button>
                    </Space>
                </Spin>
            </Card>
        </div>
    );
};

export default ProductDetail;
