import React, { useEffect, useState } from "react";
import {
    Button, Card, Col, Divider, Form, Input, Result, Row, Space, Typography,
} from "antd";
import {
    AppleFilled, FacebookFilled, GithubOutlined, GoogleOutlined, LockOutlined,
    MailOutlined, SafetyCertificateOutlined, UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    currentUser, getAuthProviders, registerUser, signInWithCredentials, signInWithProvider,
} from "../../functions/auth";

const { Paragraph, Title } = Typography;

const providerOptions = [
    { id: "google", label: "Google", icon: <GoogleOutlined /> },
    { id: "facebook", label: "Facebook", icon: <FacebookFilled /> },
    { id: "github", label: "GitHub", icon: <GithubOutlined /> },
    { id: "line", label: "LINE", icon: <span aria-hidden="true">L</span> },
    { id: "apple", label: "Apple", icon: <AppleFilled /> },
    { id: "tiktok", label: "TikTok", icon: <span aria-hidden="true">♪</span> },
    { id: "twitter", label: "X", icon: <span aria-hidden="true">𝕏</span> },
];

const MagicLinkForm = ({ mode = "login" }) => {
    const isRegister = mode === "register";
    const [loading, setLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [enabledProviders, setEnabledProviders] = useState([]);
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.token) return;
        navigate(user.role === "admin" ? "/admin/dashboard" : "/user/history", { replace: true });
    }, [navigate, user]);

    useEffect(() => {
        getAuthProviders()
            .then((available) => setEnabledProviders(
                providerOptions.filter((provider) => available[provider.id])
            ))
            .catch(() => setEnabledProviders([]));
    }, []);

    const submit = async (values) => {
        setLoading(true);
        try {
            if (isRegister) {
                await registerUser(values);
                setRegisteredEmail(values.email);
                return;
            }

            await signInWithCredentials(values.identifier, values.password);
            const response = await currentUser();
            dispatch({
                type: "LOGGED_IN_USER",
                payload: { ...response.data, token: "authjs-session" },
            });
            navigate(response.data.role === "admin" ? "/admin/dashboard" : "/user/history");
        } catch (error) {
            const message = error.response?.data?.message;
            toast.error(message || (isRegister
                ? "สมัครสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง"
                : "Username/อีเมล หรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้ยืนยันอีเมล"));
        } finally {
            setLoading(false);
        }
    };

    if (registeredEmail) {
        return (
            <div className="auth-page">
                <Card className="auth-card">
                    <Result
                        status="success"
                        title="สมัครสมาชิกสำเร็จ"
                        subTitle={`ส่งลิงก์ยืนยันไปที่ ${registeredEmail} แล้ว กรุณายืนยันภายใน 7 วัน`}
                        extra={<Button type="primary"><Link to="/login">ไปหน้าเข้าสู่ระบบ</Link></Button>}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <Card className={`auth-card ${isRegister ? "register" : ""}`}>
                <Space direction="vertical" size="large" className="full-width">
                    <div>
                        <SafetyCertificateOutlined className="auth-icon" />
                        <Title level={2}>{isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</Title>
                        <Paragraph type="secondary">
                            {isRegister
                                ? "สร้างบัญชีด้วยข้อมูลส่วนตัว อีเมล และรหัสผ่าน"
                                : "เข้าสู่ระบบด้วย Username หรืออีเมล"}
                        </Paragraph>
                    </div>

                    <Form layout="vertical" onFinish={submit} requiredMark={false}>
                        {isRegister && (
                            <>
                                <Row gutter={16}>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="firstName" label="ชื่อ"
                                            rules={[{ required: true, message: "กรุณากรอกชื่อ" }]}>
                                            <Input size="large" prefix={<UserOutlined />} autoComplete="given-name" />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <Form.Item name="lastName" label="นามสกุล"
                                            rules={[{ required: true, message: "กรุณากรอกนามสกุล" }]}>
                                            <Input size="large" autoComplete="family-name" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item name="username" label="Username"
                                    rules={[
                                        { required: true, message: "กรุณากรอก Username" },
                                        { pattern: /^[a-zA-Z0-9._-]{3,30}$/, message: "ใช้ 3-30 ตัว: a-z, 0-9, จุด, - หรือ _" },
                                    ]}>
                                    <Input size="large" prefix={<UserOutlined />} autoComplete="username" />
                                </Form.Item>
                                <Form.Item name="email" label="อีเมล"
                                    rules={[
                                        { required: true, message: "กรุณากรอกอีเมล" },
                                        { type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" },
                                    ]}>
                                    <Input size="large" prefix={<MailOutlined />} autoComplete="email" />
                                </Form.Item>
                            </>
                        )}

                        {!isRegister && (
                            <Form.Item name="identifier" label="Username หรืออีเมล"
                                rules={[{ required: true, message: "กรุณากรอก Username หรืออีเมล" }]}>
                                <Input size="large" prefix={<UserOutlined />} autoComplete="username" />
                            </Form.Item>
                        )}

                        <Form.Item name="password" label="รหัสผ่าน"
                            rules={[
                                { required: true, message: "กรุณากรอกรหัสผ่าน" },
                                ...(isRegister ? [{ min: 8, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }] : []),
                            ]}>
                            <Input.Password size="large" prefix={<LockOutlined />}
                                autoComplete={isRegister ? "new-password" : "current-password"} />
                        </Form.Item>

                        {isRegister && (
                            <Form.Item name="confirmPassword" label="ยืนยันรหัสผ่าน"
                                dependencies={["password"]}
                                rules={[
                                    { required: true, message: "กรุณายืนยันรหัสผ่าน" },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            return !value || getFieldValue("password") === value
                                                ? Promise.resolve()
                                                : Promise.reject(new Error("รหัสผ่านไม่ตรงกัน"));
                                        },
                                    }),
                                ]}>
                                <Input.Password size="large" prefix={<LockOutlined />} autoComplete="new-password" />
                            </Form.Item>
                        )}

                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            {isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
                        </Button>
                    </Form>

                    {!!enabledProviders.length && (
                        <>
                            <Divider plain>หรือดำเนินการต่อด้วย</Divider>
                            <Row gutter={[0, 10]}>
                                {enabledProviders.map((provider) => (
                                    <Col span={24} key={provider.id}>
                                        <Button block size="large" icon={provider.icon}
                                            onClick={() => signInWithProvider(provider.id).catch(() =>
                                                toast.error(`ไม่สามารถเชื่อมต่อ ${provider.label} ได้`))}>
                                            {provider.label}
                                        </Button>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                    <Paragraph className="auth-note">
                        {isRegister ? "มีบัญชีแล้ว? " : "ยังไม่มีบัญชี? "}
                        <Link to={isRegister ? "/login" : "/register"}>
                            {isRegister ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                        </Link>
                    </Paragraph>
                </Space>
            </Card>
        </div>
    );
};

export default MagicLinkForm;
