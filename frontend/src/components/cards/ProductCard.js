import React, { useState } from "react";
import { Button, Card, Flex, Tag, Tooltip, Typography } from "antd";
import { EyeOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import NoImg from "../../images/noimg.jpg";
import { Link } from "react-router-dom";
import { showAverage } from "../../functions/rating";
import _ from "lodash";
import { useSelector, useDispatch } from "react-redux";

const { Paragraph, Text, Title } = Typography;

const ProductCard = ({ product }) => {
    const [tooltip, setTooltip] = useState("Click to add");

    // redux
    const { user, cart } = useSelector((state) => ({ ...state }));
    const dispatch = useDispatch();

    const handleAddToCart = () => {
        // create cart array
        let cart = [];
        if (typeof window !== "undefined") {
            // if cart is in local storage GET it
            if (localStorage.getItem("cart")) {
                cart = JSON.parse(localStorage.getItem("cart"));
            }
            // push new product to cart
            cart.push({
                ...product,
                count: 1,
            });
            // remove duplicates
            let unique = _.uniqWith(cart, _.isEqual);
            // save to local storage
            localStorage.setItem("cart", JSON.stringify(unique));
            // show tooltip
            setTooltip("Added");
            // add to reeux state
            dispatch({
                type: "ADD_TO_CART",
                payload: unique,
            });
            // show cart items in side drawer
            dispatch({
                type: "SET_VISIBLE",
                payload: true,
            });
        }
    };

    // destructure
    const { images, title, slug, price, quantity, sold } = product;
    return (
            <Card className="product-card"
                cover={
                    <Link to={`/product/${slug}`} className="product-image-link">
                        <img
                            alt={title}
                            src={images && images.length ? images[0].url : NoImg}
                            className="product-image"
                        />
                    </Link>
                }
                actions={[
                    <Link key="view" className="buy-action-blue" to={`/product/${slug}`}>
                        <EyeOutlined /> ดูสินค้า
                    </Link>,
                    <Tooltip key="cart" title={tooltip}>
                        <Button
                            type="link"
                            className="cart-action-orange"
                            icon={<ShoppingCartOutlined />}
                            disabled={quantity < 1}
                            onClick={handleAddToCart}
                        >
                            {quantity < 1 ? "สินค้าหมด" : "ใส่ตะกร้า"}
                        </Button>
                    </Tooltip>,
                ]}
            >
                <Title level={5} ellipsis={{ rows: 2 }} className="product-title">{title}</Title>
                <Flex justify="space-between" align="center" gap="small">
                    <Text className="product-price">฿{Number(price).toLocaleString("th-TH")}</Text>
                    {sold > 0 && <Text type="secondary">ขายแล้ว {sold} ชิ้น</Text>}
                </Flex>
                <Flex justify="space-between" align="center" gap="small" className="product-meta">
                    <Tag color={quantity > 0 ? "green" : "red"}>
                        {quantity > 0 ? `เหลือ ${quantity}` : "สินค้าหมด"}
                    </Tag>
                    {product && product.ratings && product.ratings.length > 0 ? (
                        showAverage(product)
                    ) : (
                        <Paragraph type="secondary" className="no-rating">ยังไม่มีรีวิว</Paragraph>
                    )}
                </Flex>
            </Card>
    );
}

export default ProductCard;
