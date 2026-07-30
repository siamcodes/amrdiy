import React from "react";
import Resizer from "react-image-file-resizer";
import axios from "axios";
import { useSelector } from "react-redux";
import { Avatar, Badge, Button, Space, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const FileUpload = ({ values, setValues, setLoading }) => {
    const { user } = useSelector((state) => ({ ...state }));
    
    const fileUploadAndResize = (e) => {
        //console.log(e.target.files);
        // resize
        let files = e.target.files; // 3
        let allUploadedFiles = values.images;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                Resizer.imageFileResizer(
                    files[i],
                    1600,
                    1600,
                    "WEBP",
                    88,
                    0,
                    (uri) => {
                        console.log(uri);
                        axios
                            .post(
                                `${import.meta.env.VITE_API}/uploadimages`,
                                { image: uri },
                                {
                                    headers: {
                                        authtoken: user ? user.token : "",
                                    },
                                }
                            )
                            .then((res) => {
                                console.log("IMAGE UPLOAD RES DATA", res);
                                setLoading(false);
                                allUploadedFiles.push(res.data);

                                setValues({ ...values, images: allUploadedFiles });
                            })
                            .catch((err) => {
                                setLoading(false);
                                console.log("CLOUDINARY UPLOAD ERR", err);
                            });
                    },
                    "base64"
                );
            }
        }
        // send back to server to upload to cloudinary
        // set url to images[] in the parent component state - ProductCreate
    };

    const handleImageRemove = (public_id) => {
        setLoading(true);
        if (values._id) {
            const filteredImages = (values.images || []).filter((item) =>
                item.public_id !== public_id);
            setValues({ ...values, images: filteredImages });
            setLoading(false);
            return;
        }
        // console.log("remove image", public_id);
        axios
            .post(
                `${import.meta.env.VITE_API}/removeimage`,
                { public_id },
                {
                    headers: {
                        authtoken: user ? user.token : "",
                    },
                }
            )
            .then((res) => {
                setLoading(false);
                const { images } = values;
                let filteredImages = images.filter((item) => {
                    return item.public_id !== public_id;
                });
                setValues({ ...values, images: filteredImages });
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };

    return (
        <>
            <Space wrap size="middle">
                {values.images &&
                    values.images.map((image) => (
                        <Badge
                            count="X"
                            key={image.public_id}
                            onClick={() => handleImageRemove(image.public_id)}
                            style={{ cursor: "pointer" }}>
                            <Avatar
                                src={image.url}
                                size={100}
                                shape="square"
                            />
                        </Badge>
                    ))}
            </Space>
            <div className="upload-action">
                <Upload multiple showUploadList={false} accept="image/*"
                    beforeUpload={(file) => {
                        setLoading(true);
                        fileUploadAndResize({ target: { files: [file] } });
                        return Upload.LIST_IGNORE;
                    }}>
                    <Button icon={<UploadOutlined />}>เลือกไฟล์รูปภาพ</Button>
                </Upload>
            </div>
        </>
    );
};

export default FileUpload;
