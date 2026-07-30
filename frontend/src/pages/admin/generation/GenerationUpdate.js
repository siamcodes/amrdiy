import React, { useState, useEffect } from "react";
import AdminNav from "../../../components/nav/AdminNav";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { getBrands } from "../../../functions/brand";
import { updateGeneration, getGeneration } from "../../../functions/generation";
import { Link } from "react-router-dom";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import BrandForm from "../../../components/forms/BrandForm";
import LocalSearch from "../../../components/forms/LocalSearch";

const GenerationUpdate = ({ match, history }) => {
    const { user } = useSelector((state) => ({ ...state }));

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [parent, setParent] = useState("");

    useEffect(() => {
        loadBrands();
        loadGeneration();
    }, []);

    const loadBrands = () =>
        getBrands().then((b) => setBrands(b.data));

    const loadGeneration = () =>
        getGeneration(match.params.slug).then((g) => {
            setName(g.data.name);
            setParent(g.data.parent);
        });

    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log(name);
        setLoading(true);
        updateGeneration(match.params.slug, { name, parent }, user.token)
            .then((res) => {
                // console.log(res)
                setLoading(false);
                setName("");
                toast.success(`"${res.data.name}" is updated`);
                history.push("/admin/generation");
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
                if (err.response.status === 400) toast.error(err.response.data);
            });
    };

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
                            <h4>Update รุ่น</h4>
                        )}

                    <div className="form-group">
                        <label>Parent brand</label>
                        <select
                            name="brand"
                            className="form-control"
                            onChange={(e) => setParent(e.target.value)}
                        >
                            <option>Please select</option>
                            {brands.length > 0 &&
                                brands.map((b) => (
                                    <option key={b._id} value={b._id} selected={b._id === parent}>
                                        {b.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <BrandForm
                        handleSubmit={handleSubmit}
                        name={name}
                        setName={setName}
                    />
                </div>
            </div>
        </div>
    );
};

export default GenerationUpdate;
