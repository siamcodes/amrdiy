import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Space, Spin, Typography } from "antd";
import AdminNav from "../../../components/nav/AdminNav";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { getProduct, updateProduct, saveContent, saveDetail } from "../../../functions/product";
import { getCategories, getCategorySubs } from "../../../functions/category";
import { getBrands, getBrandGenerations } from "../../../functions/brand";
import FileUpload from "../../../components/forms/FileUpload";
import ProductUpdateForm from "../../../components/forms/ProductUpdateForm";

import RichTextEditor from "../../../components/forms/RichTextEditor";
import UsageExampleEditor from "../../../components/forms/UsageExampleEditor";
const { Title } = Typography;

const initialState = {
    title: "",
    description: "",
    price: "",
    category: "",
    subs: [],
    shipping: "",
    shippingProfile: {
        weightKg: 0.5,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
        shipsSeparately: false,
        fragile: false,
    },
    quantity: "",
    images: [],
    colors: [
        "Black", "White", "Gray", "Silver", "Brown", "Red", "Orange", "Yellow",
        "Green", "Blue", "Navy", "Teal", "Purple", "Pink", "Gold", "Beige",
        "Clear", "Multicolor",
    ],
    brands: ["No Brand", "Espressif", "Atmel", "Phillips", "Microchip", "Analog Device", "STMicroelectronics", "Parallax", "Cypress", "Texas Intruments", "Motorola", "Zilog", "Rabbit Semiconductor", "Renesas",
        "Sumsung", "Panasonic", "Sony", "Acer", "Apple", "Aston", "Dell", "Fujifilm", "GoPro", "HP", "JBL", "Lenovo", "LG", "Microsoft", "Sandisk", "WD", "Zotac"],
    brand: "",
    brandRef: "",
    generations: [],
    manufacturerPartNumber: "",
    sku: "",
    productType: "",
    tags: [],
    specifications: [],
    options: [],
    variants: [],
    color: "",
    //generations: []
};

const ProductUpdate = ({ match, history }) => {
    const [loading, setLoading] = useState(false);
    const [productLoaded, setProductLoaded] = useState(false);
    const { user } = useSelector((state) => ({ ...state }));
    // state
    const [values, setValues] = useState(initialState);
    const [categories, setCategories] = useState([]);
    const [subOptions, setSubOptions] = useState([]);
    const [arrayOfSubs, setArrayOfSubs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [brandOptions, setBrandOptions] = useState([]);
    const [generationOptions, setGenerationOptions] = useState([]);     //
    const [arrayOfGenerations, setArrayOfGenerations] = useState([]);   //
    const [selectedBrand, setSelectedBrand] = useState("");             //





    // router
    const { slug } = match.params;

    useEffect(() => {
        loadProduct();
        loadCategories();
        loadBrands();
    }, [slug]);

    const loadProduct = () => {
        setLoading(true);
        setProductLoaded(false);
        getProduct(slug).then((p) => {
            if (!p.data) throw new Error("ไม่พบสินค้า");
            // console.log("single product", p);
            // 1 load single proudct
            const product = p.data;
            const categoryId = product.category?._id || product.category || "";
            const brandId = product.brandRef?._id || product.brandRef || "";
            const subIds = (product.subs || []).map((item) => item._id || item);
            const generationIds = (product.generations || []).map((item) => item._id || item);
            const loadedValues = {
                ...initialState,
                ...product,
                title: String(product.title ?? product.name ?? ""),
                description: String(product.description ?? ""),
                price: product.price === null || product.price === undefined ? "" : Number(product.price),
                quantity: product.quantity === null || product.quantity === undefined ? 0 : Number(product.quantity),
                color: String(product.color ?? ""),
                shipping: product.shipping === true || String(product.shipping).toLowerCase() === "yes"
                    ? "Yes"
                    : "No",
                shippingProfile: {
                    ...initialState.shippingProfile,
                    ...(product.shippingProfile || {}),
                },
                category: categoryId,
                brandRef: brandId,
                subs: subIds,
                generations: generationIds,
                tags: (product.tags || []).map((item) => item._id || item),
                productType: product.productType?._id || product.productType || "",
                specifications: (product.specifications || []).map((item) => ({
                    ...item,
                    attribute: item.attribute?._id || item.attribute,
                })),
            };
            setValues(loadedValues);
            setSelectedCategory(categoryId);
            setSelectedBrand(brandId);
            // 2 load single product category subs
            if (categoryId) getCategorySubs(categoryId).then((res) => {
                setSubOptions(res.data); // on first load, show default subs
            });
            // 3 prepare array of sub ids to show as default sub values in antd Select
            setArrayOfSubs(subIds);
            setArrayOfGenerations(generationIds);
            if (brandId) {
                getBrandGenerations(brandId).then((res) => setGenerationOptions(res.data));
            }

            const contentDraft = localStorage.getItem(`product-content:${slug}`);
            const detailDraft = localStorage.getItem(`product-detail:${slug}`);
            setContent(contentDraft ? JSON.parse(contentDraft) : (product.content || ""));
            setDetail(detailDraft ? JSON.parse(detailDraft) : (product.detail || ""));
            setProductLoaded(true);
        }).catch((error) => {
            toast.error(error.response?.data?.err || error.message || "โหลดสินค้าไม่สำเร็จ");
        }).finally(() => setLoading(false));
    };

    const loadCategories = () =>
        getCategories().then((c) => {
            console.log("GET CATEGORIES IN UPDATE PRODUCT", c.data);
            setCategories(c.data);
        });

    const loadBrands = () =>
        getBrands().then((b) => {
            console.log("GET BRANDS IN UPDATE PRODUCT", b.data);
            setBrandOptions(b.data);
        });


    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...values,
            subs: arrayOfSubs,
            category: selectedCategory || values.category?._id || values.category,
            generations: arrayOfGenerations,
            brandRef: selectedBrand || values.brandRef?._id || values.brandRef,
            content: content || "",
            detail: detail || "",
        };
        if (selectedBrand) {
            payload.brand = brandOptions.find((item) => item._id === selectedBrand)?.name || values.brand;
        }

        updateProduct(slug, payload, user.token)
            .then((res) => {
                setLoading(false);
                toast.success(`อัปเดต "${res.data.title}" เรียบร้อย`);
                localStorage.removeItem(`product-content:${slug}`);
                localStorage.removeItem(`product-detail:${slug}`);
                history.push(`/admin/product/${res.data.slug}`);
            })
            .catch((err) => {
                console.log(err);
                setLoading(false);
                toast.error(err.response?.data?.err || "บันทึกสินค้าไม่สำเร็จ");
            });
    };

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
        // console.log(e.target.name, " ----- ", e.target.value);
    };

    const handleCategoryChange = (e) => {
        setValues((current) => ({
            ...current,
            category: e.target.value,
            subs: [],
            productType: "",
        }));

        setSelectedCategory(e.target.value);

        getCategorySubs(e.target.value).then((res) => {
            setSubOptions(res.data);
        });
        // clear old sub category ids
        setArrayOfSubs([]);
    };

    const handleBrandChange = (e) => {
            const brandName = brandOptions.find((item) => item._id === e.target.value)?.name;
            setValues((current) => ({
                ...current,
                generations: [],
                brandRef: e.target.value,
                brand: brandName,
            }));
    
            setSelectedBrand(e.target.value);
    
            getBrandGenerations(e.target.value).then((res) => {
                console.log("GENERATION OPTIONS ON BRAND CLICK", res);
                setGenerationOptions(res.data);
            });
    
            setArrayOfGenerations([]);
    };


    const contentFromLS = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        if (localStorage.getItem(`product-content:${slug}`)) {
            return JSON.parse(localStorage.getItem(`product-content:${slug}`));
        } else {
            return false;
        }
    };
    const [content, setContent] = useState(contentFromLS());

    const saveContentToDB = () => {
        //console.log(slug, content);
        setLoading(true);
        saveContent(slug, content, user.token).then((res) => {
            if (res.data.ok) {
                // setLoading(false);
                toast.success("บันทึกรายละเอียดคุณสมบัติแล้ว");
                localStorage.removeItem(`product-content:${slug}`);
            }
        }).catch((error) => toast.error(error.response?.data?.err || "บันทึกไม่สำเร็จ"))
          .finally(() => setLoading(false));
    };
    const handleContent = (e) => {
        //console.log(e);
        setContent(e);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`product-content:${slug}`, JSON.stringify(e));
        }
    };

    const detailFromLS = () => {
        if (typeof window === 'undefined') {
            return false;
        }
        if (localStorage.getItem(`product-detail:${slug}`)) {
            return JSON.parse(localStorage.getItem(`product-detail:${slug}`));
        } else {
            return false;
        }
    };
    const [detail, setDetail] = useState(detailFromLS());

    const saveDetailToDB = () => {
        //console.log(slug, detail);
        setLoading(true);
        saveDetail(slug, detail, user.token).then((res) => {
            if (res.data.ok) {
                //  setLoading(false);
                toast.success("บันทึกตัวอย่างการใช้งานแล้ว");
                localStorage.removeItem(`product-detail:${slug}`);
            }
        }).catch((error) => toast.error(error.response?.data?.err || "บันทึกไม่สำเร็จ"))
          .finally(() => setLoading(false));
    };
    const handleDetail = (e) => {
        setDetail(e);
        if (typeof window !== 'undefined') {
            localStorage.setItem(`product-detail:${slug}`, JSON.stringify(e));
        }
    };


    return (
        <div className="admin-page-grid">
            <Card className="admin-sidebar-card"><AdminNav /></Card>
            <Card>
                <Spin spinning={loading}>
                    <Title level={2}>แก้ไขสินค้า</Title>
                    <div className="product-upload-section">
                        <FileUpload
                            values={values}
                            setValues={setValues}
                            setLoading={setLoading}
                        />

                    </div>
                    <br />
                    {productLoaded && <ProductUpdateForm
                        key={values._id || slug}
                        handleSubmit={handleSubmit}
                        handleChange={handleChange}
                        setValues={setValues}
                        values={values}
                        handleCategoryChange={handleCategoryChange}
                        categories={categories}
                        subOptions={subOptions}
                        arrayOfSubs={arrayOfSubs}
                        setArrayOfSubs={setArrayOfSubs}
                        selectedCategory={selectedCategory}
                        handleBrandChange={handleBrandChange}
                        brandOptions={brandOptions}
                        generationOptions={generationOptions}
                        arrayOfGenerations={arrayOfGenerations}
                        setArrayOfGenerations={setArrayOfGenerations}
                        selectedBrand={selectedBrand}
                    />}
                    {!productLoaded && !loading && (
                        <Typography.Text type="secondary">ไม่พบข้อมูลสินค้าที่ต้องการแก้ไข</Typography.Text>
                    )}

                    <Card size="small" title="รายละเอียดคุณสมบัติเพิ่มเติม" className="editor-section">
                        <RichTextEditor value={content || ""} onChange={handleContent} />
                        <Button onClick={saveContentToDB} type="primary" style={{ marginTop: 12 }}>
                            บันทึกรายละเอียดคุณสมบัติ
                        </Button>
                    </Card>

                    <Card size="small" title="ตัวอย่างการใช้งาน" className="editor-section">
                        <UsageExampleEditor value={detail || ""} onChange={handleDetail} />
                        <Button onClick={saveDetailToDB} type="primary" style={{ marginTop: 12 }}>
                            บันทึกตัวอย่างการใช้งาน
                        </Button>
                    </Card>

                    <Space wrap>
                        <Link to={`/admin/product-content/${slug}`}>
                            <Button>แก้ไขรายละเอียดคุณสมบัติแบบเต็มหน้า</Button>
                        </Link>
                        <Link to={`/admin/product-detail/${slug}`}>
                            <Button>แก้ไขตัวอย่างการใช้งานแบบเต็มหน้า</Button>
                        </Link>
                    </Space>
                </Spin>
            </Card>
        </div>
    );
};

export default ProductUpdate;
