import React from "react";
import { Card } from "antd";
import NoImg from "../../images/noimg.jpg";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Meta } = Card;

const AdminProductCard = ({ product, handleRemove }) => {
    // destructure
    const { title, description, images, slug, price, sold, quantity } = product;

    return (
        <Card
            cover={
                <img
                    src={images && images.length ? images[0].url : NoImg}
                    style={{ height: "150px", objectFit: "cover" }}
                    className="p-1"
                />
            }
            actions={[
                <Link to={`/admin/product/${slug}`}>
                    <EditOutlined className="text-warning" />
                </Link>,
                <DeleteOutlined
                    className="text-danger"
                    onClick={() => handleRemove(slug)}
                />,
            ]}
        >
            {/* <Meta
                title={`${title} - ฿${price}`}
                description={`${description && description.substring(0, 40)}...`}
            /> */}
            <div><Link to={`/product/${slug}`}> {title} </Link></div>
            <div className="d-flex justify-content-center justify-content-between pt-2">
                <div style={{color:"#FF6600"}}>{`฿${price}`}</div>
                <div style={{ color: "#888888" }}>{product.sold < 1 ? `${sold} Sold (${quantity} Qty)` : `${sold} Sold (${quantity} Qty)` }</div>
            </div>
            
            
        </Card>
    );
};

export default AdminProductCard;