import React from "react";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const Password = () => {
    const navigate = useNavigate();

    return (
        <Result
            status="info"
            title="ระบบนี้ไม่ใช้รหัสผ่าน"
            subTitle="AMR DIY ใช้ลิงก์เข้าสู่ระบบแบบครั้งเดียวที่ส่งทางอีเมลผ่าน Brevo"
            extra={<Button type="primary" onClick={() => navigate("/user/profile")}>กลับไปโปรไฟล์</Button>}
        />
    );
};

export default Password;
