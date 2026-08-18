import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Input } from "antd";

const Search = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { search } = useSelector((state) => ({ ...state }));
    const navigate = useNavigate();
    const isBlogPage = location.pathname.startsWith("/blog");
    const isCoursePage = location.pathname.startsWith("/courses");
    const isShopPage = location.pathname === "/shop";
    const isCatalogPage = location.pathname.startsWith("/category/")
        || location.pathname.startsWith("/sub/");
    const [value, setValue] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (isBlogPage || isCoursePage) {
            setValue(params.get("search") || "");
        } else if (isShopPage || isCatalogPage) {
            setValue(params.get("query") ?? search.text ?? "");
        } else {
            setValue(search.text ?? "");
        }
    }, [isBlogPage, isCatalogPage, isCoursePage, isShopPage, location.search, search.text]);

    const handleChange = (e) => {
        const nextValue = e.target.value;
        setValue(nextValue);
        if (!isBlogPage && !isCoursePage) {
            dispatch({ type: "SEARCH_QUERY", payload: { text: nextValue } });
        }
    };

    const handleSubmit = () => {
        const query = value.trim();
        if (isBlogPage) {
            navigate(query ? `/blog?search=${encodeURIComponent(query)}` : "/blog");
            return;
        }
        if (isCoursePage) {
            navigate(query ? `/courses?search=${encodeURIComponent(query)}` : "/courses");
            return;
        }

        dispatch({ type: "SEARCH_QUERY", payload: { text: query } });
        if (isCatalogPage) {
            navigate(query
                ? `${location.pathname}?query=${encodeURIComponent(query)}`
                : location.pathname);
            return;
        }
        navigate(query ? `/shop?query=${encodeURIComponent(query)}` : "/shop");
    };

    return (
        <Input.Search
            allowClear
            value={value}
            onChange={handleChange}
            onSearch={handleSubmit}
            placeholder={isBlogPage ? "ค้นหาบทความ" : isCoursePage ? "ค้นหาคอร์ส" : "ค้นหาสินค้า"}
            aria-label={isBlogPage ? "ค้นหาบทความในหน้าปัจจุบัน" : isCoursePage ? "ค้นหาคอร์ส" : "ค้นหาสินค้า"}
        />
    );
};

export default Search;
