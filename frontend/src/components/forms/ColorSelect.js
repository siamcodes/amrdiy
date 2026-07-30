import React from "react";
import { Select } from "antd";

const colorMeta = {
    Black: { hex: "#111827", thai: "ดำ" },
    Brown: { hex: "#8b5e3c", thai: "น้ำตาล" },
    Silver: { hex: "#c0c7d1", thai: "เงิน" },
    White: { hex: "#ffffff", thai: "ขาว" },
    Blue: { hex: "#1677ff", thai: "น้ำเงิน" },
    Red: { hex: "#ff4d4f", thai: "แดง" },
    Green: { hex: "#52c41a", thai: "เขียว" },
    Gray: { hex: "#6b7280", thai: "เทา" },
    Orange: { hex: "#fa8c16", thai: "ส้ม" },
    Yellow: { hex: "#fadb14", thai: "เหลือง" },
    Purple: { hex: "#722ed1", thai: "ม่วง" },
    Pink: { hex: "#eb2f96", thai: "ชมพู" },
    Gold: { hex: "#d4af37", thai: "ทอง" },
    Beige: { hex: "#e8d8b8", thai: "เบจ" },
    Navy: { hex: "#102a56", thai: "กรมท่า" },
    Teal: { hex: "#13a8a8", thai: "เขียวน้ำทะเล" },
    Clear: { hex: "linear-gradient(135deg, #fff 0 45%, #d9f0ff 45% 55%, #fff 55%)", thai: "ใส" },
    Multicolor: { hex: "linear-gradient(90deg, #ff4d4f, #faad14, #52c41a, #1677ff, #722ed1)", thai: "หลายสี" },
};

const colorLabel = (name) => {
    const meta = colorMeta[name] || { hex: "#d9d9d9", thai: name };
    return (
        <span className="color-select-option">
            <span className="color-select-swatch"
                style={meta.hex.startsWith("linear-gradient")
                    ? { background: meta.hex }
                    : { backgroundColor: meta.hex }} />
            <span>{meta.thai}</span>
            <span className="color-select-english">{name}</span>
        </span>
    );
};

const ColorSelect = ({ colors = [], value, onChange, ...props }) => (
    <Select
        {...props}
        value={value || undefined}
        onChange={onChange}
        optionLabelProp="label"
        options={colors.map((name) => ({
            value: name,
            label: colorLabel(name),
        }))}
    />
);

export default ColorSelect;
