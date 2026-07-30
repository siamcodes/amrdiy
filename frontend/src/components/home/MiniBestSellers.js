import React, { useEffect, useState } from "react";
import { getProducts, getProductsCount } from "../../functions/product";
import ProductCard from "../cards/ProductCard";
import LoadingCard from "../cards/LoadingCard";
import { Pagination } from "antd";

const MiniBestSellers = () => {
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
        getProducts("sold", "desc", page).then((res) => {
            setProducts(res.data);
            setLoading(false);
        });
    };

    return (
        <>
            <div className="container-fluid">
                {loading ? (
                    <LoadingCard count={3} />  //3
                ) : (
                        <div className="row">
                            {products.map((product) => (
                                <div key={product._id} className="col-lg-6 mt-3 p-1">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    )}
            </div>

            <div className="row">
                <nav className="offset-md-4 text-center pt-2 p-3">
                    <Pagination
                        current={page}
                        total={(productsCount / 3) * 10}  //3*10
                        onChange={(value) => setPage(value)}
                    />
                </nav>
            </div>
        </>
    );
};

export default MiniBestSellers;