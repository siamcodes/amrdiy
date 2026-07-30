import React, { useState, useEffect } from "react";
import AdminNav from "../../../components/nav/AdminNav";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { createProduct } from "../../../functions/product";
import ProductCreateForm from "../../../components/forms/ProductCreateForm";
import { getCategories, getCategorySubs } from "../../../functions/category";
import { getBrands, getBrandGenerations } from "../../../functions/brand";
import FileUpload from "../../../components/forms/FileUpload";
import { Card, Spin, Typography } from "antd";
const { Title } = Typography;

const initialState = {
  title: "",
  description: "",
  price: "",
  categories: [],
  category: "",
  subs: [],
  shipping: "",
  quantity: "",
  images: [],
  colors: [
    "Black", "White", "Gray", "Silver", "Brown", "Red", "Orange", "Yellow",
    "Green", "Blue", "Navy", "Teal", "Purple", "Pink", "Gold", "Beige",
    "Clear", "Multicolor",
  ],
  color: "",
  brands: ["No Brand","Espressif", "Atmel", "Phillips", "Microchip", "Analog Device", "STMicroelectronics", "Parallax", "Cypress", "Texas Intruments", "Motorola", "Zilog", "Rabbit Semiconductor", "Renesas",
    "Sumsung", "Panasonic", "Sony", "Acer", "Apple", "Aston", "Dell", "Fujifilm", "GoPro", "HP", "JBL", "Lenovo", "LG", "Microsoft", "Sandisk", "WD", "Zotac"],
  // brands: [],
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
  shippingProfile: {
    weightKg: 0.5,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    shipsSeparately: false,
    fragile: false,
  },
};

const ProductCreate = () => {
  const [values, setValues] = useState(initialState);
  const [subOptions, setSubOptions] = useState([]);
  const [showSub, setShowSub] = useState(false);
  const [generationOptions, setGenerationOptions] = useState([]);
  const [showGeneration, setShowGeneration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);

  // redux
  const { user } = useSelector((state) => ({ ...state }));

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  const loadCategories = () =>
    getCategories().then((c) => setValues((current) => ({ ...current, categories: c.data })));

  const loadBrands = () =>
    getBrands().then((b) => setBrandOptions(b.data));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!values.title.trim() || !values.description || !values.category
      || values.price === "" || values.price === null) {
      toast.error("กรุณากรอกชื่อ รายละเอียด ราคา และหมวดหลักให้ครบ");
      return;
    }
    setLoading(true);

    createProduct(values, user.token)
      .then((res) => {
        console.log(res);
        window.alert(`"${res.data.title}" is created`);
        window.location.reload();
      })
      .catch((err) => {
        console.log(err);
        // if (err.response.status === 400) toast.error(err.response.data);
        toast.error(err.response.data.err);
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    // console.log(e.target.name, " ----- ", e.target.value);
  };

  const handleCategoryChange = (e) => {
    console.log("CLICKED CATEGORY", e.target.value);
    setValues((current) => ({
      ...current,
      subs: [],
      productType: "",
      category: e.target.value,
    }));
    getCategorySubs(e.target.value).then((res) => {
      console.log("SUB OPTIONS ON CATEGORY CLICK", res);
      setSubOptions(res.data);
    });
    setShowSub(true);
  };

  const handleBrandChange = (e) => {
    const selectedBrand = brandOptions.find((item) => item._id === e.target.value);
    setValues((current) => ({
      ...current,
      generations: [],
      brandRef: e.target.value,
      brand: selectedBrand?.name || "No Brand",
    }));
    getBrandGenerations(e.target.value).then((res) => {
      console.log("GENERATION OPTIONS ON BRAND CLICK", res);
      setGenerationOptions(res.data);
    });
    setShowGeneration(true);
  };


  return (
    <div className="admin-page-grid">
      <Card className="admin-sidebar-card"><AdminNav /></Card>
      <Card>
          <Spin spinning={loading}>
          <Title level={2}>เพิ่มสินค้า</Title>
          <div className="product-upload-section">
            <FileUpload
              values={values}
              setValues={setValues}
              setLoading={setLoading}
            />
          </div>
          <ProductCreateForm
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            setValues={setValues}
            values={values}
            handleCategoryChange={handleCategoryChange}
            subOptions={subOptions}
            showSub={showSub}
            handleBrandChange={handleBrandChange}
            brandOptions={brandOptions}
            generationOptions={generationOptions}
            showGeneration={showGeneration}
          />
          </Spin>
      </Card>
    </div>
  );
};

export default ProductCreate;
