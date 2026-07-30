import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import ProductCardInCheckout from "../components/cards/ProductCardInCheckout";
import { userCart } from "../functions/user";

import { Button } from 'antd';

const Cart = ({ history }) => {
    const { cart, user } = useSelector((state) => ({ ...state }));
    const dispatch = useDispatch();

    const getShipping = () => {
        const shipping = 30;
        return parseFloat(shipping).toFixed(2);
    }

    const getTax = () => {
        return cart.reduce((currentValue, nextValue) => {
            const vat = 0.07;
            let tax = (currentValue + nextValue.count * nextValue.price) * vat;
            return parseFloat(tax).toFixed(2);
        }, 0);
    }

    const getTotal = () => {
        return cart.reduce((currentValue, nextValue) => {
            return parseFloat(currentValue + nextValue.count * nextValue.price).toFixed(2);
        }, 0);
    };

    const getNetprice = () => {
        let netprice = getTotal() + getTax() + getShipping();
        return parseFloat(netprice).toFixed(2);;
    }

    const saveOrderToDb = () => {
        // alert("save order to db");
        // history.push("/checkout");
        // console.log("cart", JSON.stringify(cart, null, 4));
        userCart(cart, user.token)
            .then((res) => {
                console.log("CART POST RES", res);
                if (res.data.ok) history.push("/checkout");
            })
            .catch((err) => console.log("cart save err", err));
    };

    const saveCashOrderToDb = () => {
        // console.log("cart", JSON.stringify(cart, null, 4));
        dispatch({
            type: "COD",
            payload: true,
        });

        userCart(cart, user.token)
            .then((res) => {
                console.log("CART POST RES", res);
                if (res.data.ok) history.push("/checkout");
            })
            .catch((err) => console.log("cart save err", err));
    };

    const showCartItems = () => (
        <table className="table table-bordered table-responsive">
            <thead className="thead-light">
                <tr>
                    <th scope="col">Image</th>
                    <th scope="col">Title</th>
                    <th scope="col">Price</th>
                    <th scope="col">Brand</th>
                    <th scope="col">Color</th>
                    <th scope="col">Count</th>
                    <th scope="col">Shipping</th>
                    <th scope="col">Remove</th>
                </tr>
            </thead>

            {cart.map((p) => (
                <ProductCardInCheckout key={p._id} p={p} />
            ))}
        </table>
    );


    return (
        <div className="container-fluid  pt-2">
            <div className="row">
                {/* {JSON.stringify(cart)}  */}
                <div className="col-md-8">
                    <h4>Cart / {cart.length} Product</h4>
                    {!cart.length ? (
                        <p>
                            No products in cart. <Link to="/shop">Continue Shopping.</Link>
                        </p>
                    ) : (
                        showCartItems()
                    )}
                </div>
                <div className="col-md-4">
                    <h4>Order Summary</h4>
                    <hr />
                    <p>Products</p>
                    {cart.map((c, i) => (
                        <div key={i}>
                            <p>
                                {c.title} x {c.count} = ฿{c.price * c.count}
                            </p>
                        </div>
                    ))}
                    <hr />
                    Shipping: <b> Included</b><br />
                    Tax: <b> Included </b> <br/>
                    Total: <b> ฿{getTotal()} </b> <br/>
                    <hr />
                    {user ? (
                        <>
                            <Button
                                onClick={saveOrderToDb}
                                className="mt-2 checkout-action"
                                disabled={!cart.length}
                                type="primary" shape="round"
                            >
                                Proceed to Checkout
                            </Button>
                            <br />
                            <Button
                                onClick={saveCashOrderToDb}
                                className="mt-2 checkout-action"
                                disabled={!cart.length}
                                type="danger" shape="round"
                            >
                                Pay Cash on Delivery
                            </Button>
                        </>
                    ) : (
                        <Button className="mt-2 checkout-action" type="primary" shape="round">
                            <Link
                                to={{
                                    pathname: "/login",
                                    state: { from: "cart" },
                                }}
                            >
                                Login to Checkout
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Cart;
