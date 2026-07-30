import React, { useState, useEffect } from "react";
import AdminNav from "../../../components/nav/AdminNav";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { getBrands } from "../../../functions/brand";
import { createGeneration, getGeneration, removeGeneration, getGenerations } from "../../../functions/generation";
import { Link } from "react-router-dom";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import BrandForm from "../../../components/forms/BrandForm";
import LocalSearch from "../../../components/forms/LocalSearch";

const GenerationCreate = () => {
    const { user } = useSelector((state) => ({ ...state }));

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [brand, setBrand] = useState("");
    const [generations, setGenerations] = useState([]);
    // step 1
    const [keyword, setKeyword] = useState("");

    useEffect(() => {
        loadBrands();
        loadGenerations();
    }, []);

    const loadBrands = () =>
        getBrands().then((b) => setBrands(b.data));

    const loadGenerations = () => getGenerations().then((g) => setGenerations(g.data));

    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log(name);
        setLoading(true);
        createGeneration({ name, parent: brand }, user.token)
            .then((res) => {
                // console.log(res)
                setLoading(false);
                setName("");
                toast.success(`"${res.data.name}" is created`);
                loadGenerations();
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
                if (err.response.status === 400) toast.error(err.response.data);
            });
    };

    const handleRemove = async (slug) => {
        // let answer = window.confirm("Delete?");
        // console.log(answer, slug);
        if (window.confirm("Delete?")) {
            setLoading(true);
            removeGeneration(slug, user.token)
                .then((res) => {
                    setLoading(false);
                    toast.error(`${res.data.name} deleted`);
                    loadGenerations();
                })
                .catch((err) => {
                    if (err.response.status === 400) {
                        setLoading(false);
                        toast.error(err.response.data);
                    }
                });
        }
    };

    // step 4
    const searched = (keyword) => (s) => s.name.toLowerCase().includes(keyword);

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-md-2">
                    <AdminNav />
                </div>
                <div className="col">
                    {loading ? (
                        <h4 className="text-danger">Loading..</h4>
                    ) : (
                            <h4>Create รุ่น</h4>
                        )}

                    <div className="form-group">
                        <label>Parent รุ่น</label>
                        <select
                            name="brand"
                            className="form-control"
                            onChange={(e) => setBrand(e.target.value)}
                        >
                            <option>Please select</option>
                            {brands.length > 0 &&
                                brands.map((b) => (
                                    <option key={b._id} value={b._id}>
                                        {b.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* {JSON.stringify(brand)} */}

                    <BrandForm
                        handleSubmit={handleSubmit}
                        name={name}
                        setName={setName}
                    />

                    {/* step 2 and step 3 */}
                    <LocalSearch keyword={keyword} setKeyword={setKeyword} />

                    {/* step 5 */}
                    {generations.filter(searched(keyword)).map((g) => (
                        <div className="alert alert-secondary" key={g._id}>
                            {g.name}
                            <span
                                onClick={() => handleRemove(g.slug)}
                                className="btn btn-sm float-right"
                            >
                                <DeleteOutlined className="text-danger" />
                            </span>
                            <Link to={`/admin/generation/${g.slug}`}>
                                <span className="btn btn-sm float-right">
                                    <EditOutlined className="text-warning" />
                                </span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GenerationCreate;
