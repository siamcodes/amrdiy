import React, { useMemo, useRef } from "react";
import ReactQuill from "react-quill-new";
import Resizer from "react-image-file-resizer";
import { message } from "antd";
import { useSelector } from "react-redux";
import { uploadUserImage } from "../../functions/user";
import "react-quill-new/dist/quill.snow.css";

const youtubeEmbedUrl = (input) => {
    try {
        const url = new URL(String(input || "").trim());
        let videoId = "";
        if (["youtu.be", "www.youtu.be"].includes(url.hostname)) {
            videoId = url.pathname.split("/").filter(Boolean)[0] || "";
        } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
            if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
            else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
                videoId = url.pathname.split("/")[2] || "";
            }
        }
        if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch {
        return null;
    }
};

const resizeEditorImage = (file) => new Promise((resolve) => {
    Resizer.imageFileResizer(
        file,
        1400,
        1400,
        "WEBP",
        82,
        0,
        resolve,
        "base64"
    );
});

const RichTextEditor = ({ value = "", onChange, placeholder }) => {
    const quillRef = useRef(null);
    const user = useSelector((state) => state.user);
    const modules = useMemo(() => ({
        table: true,
        toolbar: {
            container: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["blockquote", "link", "image", "video", "table"],
                [{ color: [] }, { background: [] }],
                ["clean"],
            ],
            handlers: {
                image: () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/jpeg,image/png,image/webp";
                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        if (!user?.token) {
                            message.error("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป");
                            return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                            message.error("ไฟล์ต้นฉบับต้องมีขนาดไม่เกิน 10 MB");
                            return;
                        }
                        const messageKey = "editor-image-upload";
                        message.loading({ content: "กำลังบีบอัดและอัปโหลดรูป...", key: messageKey, duration: 0 });
                        try {
                            const compressed = await resizeEditorImage(file);
                            const { data } = await uploadUserImage(
                                compressed,
                                "editor-image",
                                user.token
                            );
                            const editor = quillRef.current?.getEditor();
                            if (!editor) throw new Error("ไม่พบ Text Editor");
                            const range = editor.getSelection(true);
                            const index = range?.index ?? Math.max(0, editor.getLength() - 1);
                            editor.insertEmbed(index, "image", data.url, "user");
                            editor.insertText(index + 1, "\n", "user");
                            editor.setSelection(index + 2, 0);
                            message.success({ content: "เพิ่มรูปในเนื้อหาแล้ว", key: messageKey });
                        } catch (error) {
                            message.error({
                                content: error.response?.data?.err || error.message || "อัปโหลดรูปไม่สำเร็จ",
                                key: messageKey,
                            });
                        }
                    };
                    input.click();
                },
                table: () => {
                    const editor = quillRef.current?.getEditor();
                    const table = editor?.getModule("table");
                    if (!editor || !table) {
                        message.error("Text Editor รุ่นนี้ไม่รองรับตาราง");
                        return;
                    }
                    const rowsInput = window.prompt("จำนวนแถวของตาราง (1–20)", "3");
                    if (rowsInput === null) return;
                    const columnsInput = window.prompt("จำนวนคอลัมน์ของตาราง (1–10)", "3");
                    if (columnsInput === null) return;
                    const rows = Number.parseInt(rowsInput, 10);
                    const columns = Number.parseInt(columnsInput, 10);
                    if (!Number.isInteger(rows) || rows < 1 || rows > 20
                        || !Number.isInteger(columns) || columns < 1 || columns > 10) {
                        message.error("กรุณากำหนดแถว 1–20 และคอลัมน์ 1–10");
                        return;
                    }
                    editor.focus();
                    table.insertTable(rows, columns);
                    message.success(`แทรกตาราง ${rows} × ${columns} แล้ว`);
                },
                video: () => {
                    const input = window.prompt(
                        "วางลิงก์ YouTube เช่น https://www.youtube.com/watch?v=..."
                    );
                    if (!input) return;
                    const embedUrl = youtubeEmbedUrl(input);
                    if (!embedUrl) {
                        window.alert("ลิงก์ YouTube ไม่ถูกต้อง");
                        return;
                    }
                    const editor = quillRef.current?.getEditor();
                    if (!editor) return;
                    const range = editor.getSelection(true);
                    const index = range?.index ?? Math.max(0, editor.getLength() - 1);
                    editor.insertEmbed(index, "video", embedUrl, "user");
                    editor.setSelection(index + 1, 0);
                },
            },
        },
    }), [user?.token]);

    return (
        <div className="rich-text-editor">
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value || ""}
                onChange={onChange}
                modules={modules}
                placeholder={placeholder}
            />
        </div>
    );
};

export default RichTextEditor;
