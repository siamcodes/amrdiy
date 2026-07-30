import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Input } from "antd";

const Search = () => {
    const dispatch = useDispatch();
    const { search } = useSelector((state) => ({ ...state }));
    const { text } = search;

    const navigate = useNavigate();

    const handleChange = (e) => {
        dispatch({
            type: "SEARCH_QUERY",
            payload: { text: e.target.value },
        });
    };

    const handleSubmit = () => {
        const query = text.trim();
        if (query) navigate(`/shop?${encodeURIComponent(query)}`);
    };

    return (
        <Input.Search
            allowClear
            value={text}
            onChange={handleChange}
            onSearch={handleSubmit}
            placeholder="ค้นหาสินค้า"
            aria-label="ค้นหาสินค้า"
        />
    );
};

export default Search;
