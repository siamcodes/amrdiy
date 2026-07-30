import React, { useEffect, useState } from "react";
import { getProducts, getProductsCount } from "../../functions/product";
import ProductCard from "../cards/ProductCard";
import LoadingCard from "../cards/LoadingCard";
import { Col, Pagination, Row } from "antd";

const NewArrivals = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [productsCount, setProductsCount] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadAllProducts();
    }, [page]);

    useEffect(() => {
        getProductsCount().then((res) => setProductsCount(res.data));
    }, []);

    const loadAllProducts = () => {
        setLoading(true);
        // sort, order, limit
        getProducts("createdAt", "desc", page).then((res) => {
            setProducts(res.data);
            setLoading(false);
        });
    };

    return (
        <>
            {loading ? <LoadingCard count={3} /> : (
                <Row gutter={[16, 16]}>
                    {products.map((product) => (
                        <Col key={product._id} xs={24} sm={12} xl={8}>
                            <ProductCard product={product} />
                        </Col>
                    ))}
                </Row>
            )}
            <Pagination
                className="product-pagination"
                current={page}
                total={(productsCount / 3) * 10}
                onChange={setPage}
                showSizeChanger={false}
            />
        </>
    );
};

export default NewArrivals;
