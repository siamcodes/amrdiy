import React, { useEffect, useRef, useState } from "react";
import { Button, Card, Result } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../../functions/auth";

const VerifyEmail = () => {
    const [params] = useSearchParams();
    const started = useRef(false);
    const [state, setState] = useState({ status: "info", title: "กำลังยืนยันอีเมล..." });

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        const token = params.get("token");
        const email = params.get("email");
        if (!token || !email) {
            setState({ status: "error", title: "ลิงก์ยืนยันไม่ถูกต้อง" });
            return;
        }
        verifyEmail({ token, email })
            .then(() => setState({
                status: "success",
                title: "ยืนยันอีเมลสำเร็จ",
                subTitle: "บัญชีพร้อมใช้งานแล้ว กรุณาเข้าสู่ระบบ",
            }))
            .catch((error) => setState({
                status: "error",
                title: "ไม่สามารถยืนยันอีเมลได้",
                subTitle: error.response?.data?.message || "ลิงก์อาจไม่ถูกต้องหรือหมดอายุแล้ว",
            }));
    }, [params]);

    return (
        <div className="auth-page">
            <Card className="auth-card">
                <Result {...state}
                    extra={state.status !== "info" &&
                        <Button type="primary"><Link to="/login">ไปหน้าเข้าสู่ระบบ</Link></Button>} />
            </Card>
        </div>
    );
};

export default VerifyEmail;
