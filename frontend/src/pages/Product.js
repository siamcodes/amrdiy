import React, { useEffect, useState } from "react";
import { getProduct, productStar } from "../functions/product";
import SingleProduct from "../components/cards/SingleProduct";
import { useSelector } from "react-redux";
import { getRelated } from "../functions/product";
import ProductCard from "../components/cards/ProductCard";

const Product = ({ match }) => {
    const [product, setProduct] = useState({});
    const [related, setRelated] = useState([]);
    const [star, setStar] = useState(0);

    // redux
    const { user } = useSelector((state) => ({ ...state }));

    const { slug } = match.params;

    useEffect(() => {
        loadSingleProduct();
    }, [slug]);

    useEffect(() => {
        if (product.ratings && user) {
            let existingRatingObject = product.ratings.find(
                (ele) => ele.postedBy.toString() === user._id.toString()
            );
            existingRatingObject && setStar(existingRatingObject.star); // current user's star
        }
    });

    // const loadSingleProduct = () =>
    //     getProduct(slug).then((res) => setProduct(res.data));

    const loadSingleProduct = () => {
        getProduct(slug).then((res) => {
            setProduct(res.data);
            const recentProduct = {
                _id: res.data._id,
                slug: res.data.slug,
                title: res.data.title,
                price: res.data.price,
                quantity: res.data.quantity,
                sold: res.data.sold,
                images: res.data.images,
                ratings: res.data.ratings,
            };
            try {
                const previous = JSON.parse(localStorage.getItem("recently-viewed-products") || "[]");
                const next = [
                    recentProduct,
                    ...previous.filter((item) => item._id !== recentProduct._id),
                ].slice(0, 6);
                localStorage.setItem("recently-viewed-products", JSON.stringify(next));
            } catch {
                localStorage.setItem("recently-viewed-products", JSON.stringify([recentProduct]));
            }
            // load related
            getRelated(res.data._id).then((res) => setRelated(res.data));
        });
    };

    const onStarClick = (newRating, name) => {
        setStar(newRating);
        productStar(name, newRating, user.token).then((res) => {
            loadSingleProduct(); // if you want to show updated rating in real time
        });
    };

    return (
        <div className="container-fluid">
            <div className="row pt-4">
                <SingleProduct
                    product={product}
                    onStarClick={onStarClick}
                    star={star}
                />
            </div>

            <div className="row">
                <div className="col text-center pt-5 pb-2">
                    <hr />
                    <h3>Related Products</h3>
                </div>
            </div>

            <div className="row pb-2">
                {related.length ? (
                    related.map((r) => (
                        <div key={r._id} className="col-lg-3 col-md-4 col-sm-6 p-1">
                            <ProductCard product={r} />
                        </div>
                    ))
                ) : (
                        <div className="text-center col">No Products Found</div>
                    )}
            </div>
        </div>
    );
};

export default Product;
