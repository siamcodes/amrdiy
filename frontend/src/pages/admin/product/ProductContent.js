import React, { useState, useEffect } from "react";
import { Button, Card, Input, Spin, Typography } from "antd";
import AdminNav from "../../../components/nav/AdminNav";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { getProduct, saveContent } from "../../../functions/product";

//import dynamic from 'next/dynamic';
import RichTextEditor from "../../../components/forms/RichTextEditor";
const { Title } = Typography;

const ProductContent = ({ match, history }) => {
    const { user } = useSelector((state) => ({ ...state }));
    // state
    const [title, setTitle] = useState(false);
    const [loading, setLoading] = useState(false);

    const contentFromLS = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        if (localStorage.getItem(`product-content:${slug}`)) {
            return JSON.parse(localStorage.getItem(`product-content:${slug}`));
        } else {
            return false;
        }
    };
    // router
    const { slug } = match.params;
    const [content, setContent] = useState(contentFromLS);

    useEffect(() => {
        loadProduct();
    }, [slug]);

    const loadProduct = () => {
        setLoading(true);
        getProduct(slug).then((p) => {
            setTitle(p.data.title);
            const draft = localStorage.getItem(`product-content:${slug}`);
            setContent(draft ? JSON.parse(draft) : (p.data.content || ""));
        }).catch(() => toast.error("โหลดข้อมูลสินค้าไม่สำเร็จ"))
          .finally(() => setLoading(false));
    };


    const saveContentToDB = () => {
        setLoading(true);
        saveContent(slug, content, user.token).then((res) => {
            if (res.data.ok) {
                setLoading(false);
                localStorage.removeItem(`product-content:${slug}`);
                toast.success("บันทึกรายละเอียดคุณสมบัติแล้ว");
                history.push(`/admin/product/${slug}`);
            }
        }).catch((error) => toast.error(error.response?.data?.err || "บันทึกไม่สำเร็จ"))
          .finally(() => setLoading(false));

    };

    const handleContent = (e) => {
        setContent(e);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`product-content:${slug}`, JSON.stringify(e));
        }
    };


    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <Card>
                <Spin spinning={loading}>
                    <Title level={2}>รายละเอียดคุณสมบัติสินค้า</Title>
                    <Input size="large" value={title || ""} readOnly />
                    <div className="editor-section">
                        <RichTextEditor value={content || ""} onChange={handleContent} />
                    </div>
                    <Button onClick={saveContentToDB} type="primary">บันทึก</Button>
                </Spin>
            </Card>
        </div>
    );
};

export default ProductContent;
