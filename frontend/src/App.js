import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import Home from './pages/Home';
import Header from './components/nav/Header';
import Footer from './components/nav/Footer';
import SideDrawer from "./components/drawer/SideDrawer";

import RegisterComplete from './pages/auth/RegisterComplete';
import ForgotPassword from "./pages/auth/ForgotPassword";
import History from './pages/user/History';
import UserRoute from "./components/routes/UserRoute";
import AdminRoute from "./components/routes/AdminRoute";
import Password from "./pages/user/Password";
import Wishlist from './pages/user/Wishlist';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import ShippingManagement from './pages/admin/ShippingManagement';
import AdminBlogs from './pages/admin/AdminBlogs';
import BlogList from './pages/blog/BlogList';
import BlogDetail from './pages/blog/BlogDetail';
import CatalogManagement from './pages/admin/CatalogManagement';
import CategoryCreate from './pages/admin/category/CategoryCreate';
import CategoryUpdate from './pages/admin/category/CategoryUpdate';
import SubCreate from "./pages/admin/sub/SubCreate";
import SubUpdate from "./pages/admin/sub/SubUpdate";

import BrandCreate from './pages/admin/brand/BrandCreate';
import BrandUpdate from './pages/admin/brand/BrandUpdate';
import GenerationCreate from './pages/admin/generation/GenerationCreate';
import GenerationUpdate from "./pages/admin/generation/GenerationUpdate";

import ProductCreate from "./pages/admin/product/ProductCreate";
import AllProducts from "./pages/admin/product/AllProducts";
import ProductUpdate from "./pages/admin/product/ProductUpdate";
import Product from "./pages/Product";
import CategoryHome from "./pages/category/CategoryHome";
import SubHome from "./pages/sub/SubHome";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CreateCouponPage from "./pages/admin/coupon/CreateCouponPage";
import Payment from "./pages/Payment";

import { useDispatch } from 'react-redux';
import { currentUser, getSession } from "./functions/auth";

import ReturnRefund from './pages/about/ReturnRefund';
import Policy from './pages/about/Policy';
import OrderCancel from './pages/about/OrderCancel';
import Shipping from './pages/about/Shipping';

import ProductContent from './pages/admin/product/ProductContent';
import ProductDetail from './pages/admin/product/ProductDetail';
import Profile from './pages/user/Prifile';
import Contact from './pages/user/Contact';
import LegacyPage from './components/routes/LegacyPage';
import { ConfigProvider, Layout, theme } from 'antd';

const { Content } = Layout;

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [adminDark, setAdminDark] = useState(
    () => localStorage.getItem("amrdiy-admin-dark") === "true"
  );
  const useAdminDark = location.pathname.startsWith("/admin") && adminDark;

  useEffect(() => {
    const syncTheme = (event) => setAdminDark(
      event?.detail ?? localStorage.getItem("amrdiy-admin-dark") === "true"
    );
    window.addEventListener("amrdiy-admin-theme", syncTheme);
    return () => window.removeEventListener("amrdiy-admin-theme", syncTheme);
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getSession();
        if (!session?.user) {
          dispatch({ type: "LOGOUT", payload: null });
          return;
        }

        const response = await currentUser();
        dispatch({
          type: "LOGGED_IN_USER",
          payload: {
            ...response.data,
            token: "authjs-session",
          },
        });
      } catch (error) {
        console.error("Unable to restore Auth.js session", error);
        dispatch({ type: "LOGOUT", payload: null });
      }
    };

    loadSession();
  }, [dispatch]);

  return (
    <ConfigProvider
      theme={{
        algorithm: useAdminDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#16a34a',
          colorWarning: '#ff6b00',
          colorInfo: '#1677ff',
          colorBgLayout: useAdminDark ? '#071724' : '#f5f7fb',
          colorBgContainer: useAdminDark ? '#102638' : '#ffffff',
          colorText: useAdminDark ? '#e8f0f7' : '#172033',
          borderRadius: 12,
          fontFamily: "'Noto Sans Thai', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Button: { primaryShadow: "none", fontWeight: 600 },
          Menu: { itemBorderRadius: 10 },
        },
      }}
    >
      <Layout className={`app-layout ${useAdminDark ? "admin-dark-mode" : "store-light-mode"}`}>
        <Header />
        <SideDrawer />
        <ToastContainer position="top-right" />
        <Content className="app-content">
          <Routes>
        <Route path="/" element={<LegacyPage component={Home} />} />
        <Route path="/login" element={<LegacyPage component={Login} />} />
        <Route path="/register" element={<LegacyPage component={Register} />} />
        <Route path="/verify-email" element={<LegacyPage component={VerifyEmail} />} />
        <Route path="/register/complete" element={<LegacyPage component={RegisterComplete} />} />
        <Route path="/forgot/password" element={<LegacyPage component={ForgotPassword} />} />
        <Route path="/user/history" element={<UserRoute component={History} />} />
        <Route path="/user/password" element={<UserRoute component={Password} />} />
        <Route path="/user/wishlist" element={<UserRoute component={Wishlist} />} />
        <Route path="/user/profile" element={<UserRoute component={Profile} />} />
        <Route path="/user/contact" element={<UserRoute component={Contact} />} />

        <Route path="/admin/dashboard" element={<AdminRoute component={AdminDashboard} />} />
        <Route path="/admin/orders" element={<AdminRoute component={AdminOrders} />} />
        <Route path="/admin/users" element={<AdminRoute component={AdminUsers} />} />
        <Route path="/admin/shipping" element={<AdminRoute component={ShippingManagement} />} />
        <Route path="/admin/blogs" element={<AdminRoute component={AdminBlogs} />} />
        <Route path="/admin/catalog" element={<AdminRoute component={CatalogManagement} />} />
        <Route path="/admin/category" element={<AdminRoute component={CategoryCreate} />} />
        <Route path="/admin/category/:slug" element={<AdminRoute component={CategoryUpdate} />} />
        <Route path="/admin/sub" element={<AdminRoute component={SubCreate} />} />
        <Route path="/admin/sub/:slug" element={<AdminRoute component={SubUpdate} />} />
        <Route path="/admin/brand" element={<AdminRoute component={BrandCreate} />} />
        <Route path="/admin/brand/:slug" element={<AdminRoute component={BrandUpdate} />} />
        <Route path="/admin/generation" element={<AdminRoute component={GenerationCreate} />} />
        <Route path="/admin/generation/:slug" element={<AdminRoute component={GenerationUpdate} />} />

        <Route path="/admin/product" element={<AdminRoute component={ProductCreate} />} />
        <Route path="/admin/products" element={<AdminRoute component={AllProducts} />} />
        <Route path="/admin/product/:slug" element={<AdminRoute component={ProductUpdate} />} />
        <Route path="/admin/product-content/:slug" element={<AdminRoute component={ProductContent} />} />
        <Route path="/admin/product-detail/:slug" element={<AdminRoute component={ProductDetail} />} />

        <Route path="/product/:slug" element={<LegacyPage component={Product} />} />
        <Route path="/category/:slug" element={<LegacyPage component={CategoryHome} />} />
        <Route path="/sub/:slug" element={<LegacyPage component={SubHome} />} />
        <Route path="/shop" element={<LegacyPage component={Shop} />} />
        <Route path="/blog" element={<LegacyPage component={BlogList} />} />
        <Route path="/blog/:slug" element={<LegacyPage component={BlogDetail} />} />
        <Route path="/cart" element={<LegacyPage component={Cart} />} />
        <Route path="/checkout" element={<UserRoute component={Checkout} />} />
        <Route path="/admin/coupon" element={<AdminRoute component={CreateCouponPage} />} />
        <Route path="/payment" element={<UserRoute component={Payment} />} />

        <Route path="/return-refund" element={<LegacyPage component={ReturnRefund} />} />
        <Route path="/policy" element={<LegacyPage component={Policy} />} />
        <Route path="/order-cancel" element={<LegacyPage component={OrderCancel} />} />
        <Route path="/shipping" element={<LegacyPage component={Shipping} />} />
          </Routes>
        </Content>
        <Footer />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
