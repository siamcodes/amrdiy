import React from "react";
import { Avatar, Button, Drawer, Empty, List, Typography } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import laptop from "../../images/noimg.jpg";

const SideDrawer = () => {
    const dispatch = useDispatch();
    const { drawer, cart } = useSelector((state) => ({ ...state }));

    return (
        <Drawer
            title={`ตะกร้าสินค้า (${cart.length})`}
            placement="right"
            closable
            onClose={() => {
                dispatch({
                    type: "SET_VISIBLE",
                    payload: false,
                });
            }}
            open={drawer}
        >
            {cart.length ? (
                <List
                    dataSource={cart}
                    renderItem={(product) => (
                        <List.Item key={product._id}>
                            <List.Item.Meta
                                avatar={<Avatar shape="square" size={56} src={product.images?.[0]?.url || laptop} />}
                                title={product.title}
                                description={
                                    <Typography.Text type="secondary">
                                        {product.count} × ฿{product.price}
                                    </Typography.Text>
                                }
                            />
                        </List.Item>
                    )}
                />
            ) : <Empty description="ยังไม่มีสินค้าในตะกร้า" />}
            <Link to="/cart" className="drawer-cart-button">
                <Button
                    type="primary"
                    block
                    onClick={() =>
                        dispatch({
                            type: "SET_VISIBLE",
                            payload: false,
                        })
                    }
                >
                    ดูตะกร้าสินค้า
                </Button>
            </Link>
        </Drawer>
    )
};

export default SideDrawer;
