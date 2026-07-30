import React from "react";
import { Empty, Space, Tag, Typography } from "antd";

const palette = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];

export const BarChart = ({ data }) => {
    if (!data?.length) return <Empty description="ยังไม่มีข้อมูลสินค้า" />;
    const max = Math.max(...data.map((item) => item.value), 1);
    const height = data.length * 44 + 20;
    return (
        <svg className="dashboard-chart" viewBox={`0 0 700 ${height}`}
            role="img" aria-label="กราฟแท่งสินค้าขายดี">
            {data.map((item, index) => {
                const y = index * 44 + 8;
                const width = (item.value / max) * 400;
                const label = item.label.length > 24 ? `${item.label.slice(0, 24)}…` : item.label;
                return (
                    <g key={item.label}>
                        <text x="0" y={y + 19} className="chart-label">{label}</text>
                        <rect x="210" y={y} width="400" height="27" rx="7" fill="#f0f5ff" />
                        <rect x="210" y={y} width={width} height="27" rx="7"
                            fill={palette[index % palette.length]} />
                        <text x="622" y={y + 19} className="chart-value">{item.value}</text>
                    </g>
                );
            })}
        </svg>
    );
};

export const DonutChart = ({ data }) => {
    const total = data?.reduce((sum, item) => sum + item.value, 0) || 0;
    if (!total) return <Empty description="ยังไม่มีข้อมูลคำสั่งซื้อ" />;
    let offset = 25;
    return (
        <div className="donut-chart-layout">
            <svg className="donut-chart" viewBox="0 0 220 220"
                role="img" aria-label="กราฟวงกลมสถานะคำสั่งซื้อ">
                <circle cx="110" cy="110" r="72" fill="none" stroke="#f0f0f0" strokeWidth="30" />
                {data.map((item, index) => {
                    const percent = (item.value / total) * 100;
                    const circle = (
                        <circle key={item.label} cx="110" cy="110" r="72" fill="none"
                            stroke={palette[index % palette.length]} strokeWidth="30"
                            pathLength="100" strokeDasharray={`${percent} ${100 - percent}`}
                            strokeDashoffset={offset} />
                    );
                    offset -= percent;
                    return circle;
                })}
                <text x="110" y="105" textAnchor="middle" className="donut-total">{total}</text>
                <text x="110" y="129" textAnchor="middle" className="donut-caption">คำสั่งซื้อ</text>
            </svg>
            <Space direction="vertical" size={6}>
                {data.map((item, index) => (
                    <div className="chart-legend" key={item.label}>
                        <span style={{ background: palette[index % palette.length] }} />
                        <Typography.Text>{item.label}</Typography.Text>
                        <Tag>{item.value}</Tag>
                    </div>
                ))}
            </Space>
        </div>
    );
};

export const LineChart = ({ data }) => {
    if (!data?.length) return <Empty description="ยังไม่มีข้อมูลยอดขาย" />;
    const width = 760;
    const height = 300;
    const padding = { left: 60, right: 20, top: 24, bottom: 48 };
    const max = Math.max(...data.map((item) => item.revenue), 1);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
    const points = data.map((item, index) => ({
        ...item,
        x: padding.left + index * step,
        y: padding.top + chartHeight - (item.revenue / max) * chartHeight,
    }));
    const path = points.map((point, index) =>
        `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");

    return (
        <svg className="dashboard-chart line-chart" viewBox={`0 0 ${width} ${height}`}
            role="img" aria-label="กราฟเส้นยอดขายรายเดือน">
            {[0, .25, .5, .75, 1].map((ratio) => {
                const y = padding.top + chartHeight - ratio * chartHeight;
                return (
                    <g key={ratio}>
                        <line x1={padding.left} x2={width - padding.right} y1={y} y2={y}
                            stroke="#edf0f5" />
                        <text x={padding.left - 8} y={y + 4} textAnchor="end" className="chart-axis">
                            {(max * ratio).toLocaleString("th-TH", { notation: "compact" })}
                        </text>
                    </g>
                );
            })}
            <path d={path} fill="none" stroke="#1677ff" strokeWidth="4"
                strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => (
                <g key={point.month}>
                    <circle cx={point.x} cy={point.y} r="6" fill="#fff" stroke="#1677ff" strokeWidth="3" />
                    <text x={point.x} y={height - 18} textAnchor="middle" className="chart-axis">
                        {point.label}
                    </text>
                    <title>{`${point.label}: ${point.revenue.toLocaleString("th-TH")} บาท, ${point.orders} คำสั่งซื้อ`}</title>
                </g>
            ))}
        </svg>
    );
};
