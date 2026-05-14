import "./App.css";
import { supabase } from "./supabaseClient";
import React, { useState, useEffect } from "react";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import Lottie from "lottie-react";
import Loading from "./assets/Loading.json"
import Errorlottie from "./assets/Errorlottie.json";
import ErrorBoundary from "./ErrorBoundary.jsx";
import {
  Routes,
  Route,
  BrowserRouter,
  Navigate,
  useNavigate,
  NavLink,
} from "react-router-dom";
import { useAuth } from "./context/AuthProvider";
import { motion } from "framer-motion";
import { UserCircle } from "lucide-react"; 
// ---------------- Authentication & User Pages ----------------
import Home from "./Authentication/Home.jsx";
import About from "./Authentication/AboutUs";
import Service from "./Authentication/Service";
import Login from "./Authentication/Login";
import SignupChoice from "./Authentication/SignupChoice";
import SignupChoiceVendor from "./Authentication/VendorSignup";
import SignupChoiceUser from "./Authentication/UserSignup";
import ResetPassword from "./Authentication/ResetPassword";
import ForgetPassword from "./Authentication/ForgetPassword";
import ShopBuild from "./vendor/ShopBuild.jsx";
import Search from "./components/Search.jsx";
import TopSellers from "./components/TopSellers.jsx";
import Categories from "./components/Categories.jsx";
import Footer from "./Footer.jsx";
import ShopPage from "./components/ShopPage.jsx";
import VendorList from "./components/Favourites.jsx";
import ShopSearch from "./components/ShopsSearch.jsx";
import Profile from "./components/Profile.jsx";
import Navbar from "./components/Navbar.jsx";
import OfferCarousel from "./components/OfferCarousel.jsx";
import HomeNavbar from "./Authentication/Navbar.jsx"

// ---------------- Vendor Pages ----------------
import VendorHome from "./vendor/pages/Home";
import MyCustomers from "./vendor/pages/MyCustomers";
import Services from "./vendor/pages/Services";
import Offers from "./vendor/pages/Offers";
import Inventory from "./vendor/pages/Inventory";
import ShopProfile from "./vendor/pages/ShopProfile";
import LocalHuntLogo from "./assets/logo-png.png";

// ✅ Vendor Dashboard (includes full vendor app UI)
const VendorDashboard = () => {
  const [shopId, setShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Fetch shopId from Supabase
useEffect(() => {
  let timeoutId; // store timeout reference

  const fetchShopId = async () => {
    try {
      setLoading(true);

      // Start a 30-second timeout — if it triggers, show error automatically
      timeoutId = setTimeout(() => {
        setError("Request timed out. Please check your connection or try again.");
        setLoading(false);
      }, 15000); // 30 seconds

      // Get vendor ID from localStorage
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User data not found in localStorage");
      }

      const user = JSON.parse(userData);
      const vendorId = user.id;

      if (!vendorId) {
        throw new Error("Vendor ID not found in user data");
      }

      // Query Supabase to get shopId using vendorId
      const { data, error } = await supabase
        .from("shops")
        .select("id")
        .eq("vendor_id", vendorId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("No shop found for this vendor");

      // Set shopId in state and localStorage
      setShopId(data.id);
      localStorage.setItem("shopId", data.id);
      console.log("Shop ID stored in localStorage:", data.id);
    } catch (err) {
      console.error("Error fetching shop ID:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      clearTimeout(timeoutId); // stop timeout if finished early
    }
  };

  fetchShopId();

  // Cleanup on unmount
  return () => clearTimeout(timeoutId);
}, []);


  const closeSidebar = () => setIsOpen(false);
  const handleSidebarMouseEnter = () => setIsSidebarHovered(true);
  const handleSidebarMouseLeave = () => setIsSidebarHovered(false);

  useEffect(() => {
    const isMobileViewport = window.matchMedia("(max-width: 991.98px)").matches;
    const shouldLockScroll = isOpen && isMobileViewport;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  // Show loading state
  if (loading) {
    return (
      <div className="loading-screen">
          <Lottie
          className="loadinglottie"
          animationData={Loading}
          loop
          autoplay
        />
        LOADING...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="loading-screen">
      
 <Lottie
          className="errorlottie"
          animationData={Errorlottie}
          loop
          autoplay
        />
        <button onClick={() => window.location.reload()}
          className="retrybtn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <nav className="navigation">
        <button
          type="button"
          className="sidebar-toggle d-lg-none btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open sidebar"
          aria-expanded={isOpen}
          style={{width:"50px"}}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
        <NavLink to="/vendor-dashboard" className="navbrand">
          <img src={LocalHuntLogo} alt="Local Hunt Logo" />
        </NavLink>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <div className="hero">
        {/* Sidebar */}
        <div
          className={`sidebar ${isOpen ? "open" : ""}`}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          <button
            type="button"
            className="sidebar-close d-lg-none btn"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="content">
            <NavLink
              to="/vendor-dashboard"
              end
              className={({ isActive }) => isActive ? "tabs active" : "tabs"}
              onClick={closeSidebar}
            >
              <div className="icon">
                <i className="fa-solid fa-house me-2"></i>
              </div>
              <div className="text">HOME</div>
            </NavLink>

            <NavLink
              to="/vendor-dashboard/services"
              className={({ isActive }) => isActive ? "tabs active" : "tabs"}
              onClick={closeSidebar}
            >
              <div className="icon">
                <i className="fa-solid fa-store me-2"></i>
              </div>
              <div className="text">SERVICES</div>
            </NavLink>

            <NavLink
              to="/vendor-dashboard/offers"
              className={({ isActive }) => isActive ? "tabs active" : "tabs"}
              onClick={closeSidebar}
            >
              <div className="icon">
                <i className="fa-solid fa-tags me-2"></i>
                
              </div>
              <div className="text">OFFERS</div>
            </NavLink>

            <NavLink
              to="/vendor-dashboard/inventory"
              className={({ isActive }) => isActive ? "tabs active" : "tabs"}
              onClick={closeSidebar}
            >
              <div className="icon">
                <i className="fa-solid fa-warehouse me-2"></i>
              </div>
              <div className="text">INVENTORY</div>
            </NavLink>

            <NavLink
              to="/vendor-dashboard/my-customers"
              className={({ isActive }) => isActive ? "tabs active" : "tabs"}
              onClick={closeSidebar}
            >
              <div className="icon">
                <i className="fa-solid fa-people-group me-2"></i>
              </div>
              <div className="text">MY CUSTOMERS</div>
            </NavLink>
          </div>
        </div>

        {/* Main Vendor Dashboard Content */}
        <div className="Homecontent middle flex-grow-1">
          <Routes>
            <Route index element={<VendorHome />} />
            <Route path="services" element={<Services />} />
            <Route path="offers" element={<Offers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="my-customers" element={<MyCustomers />} />
            <Route 
              path="shopprofile" 
              element={<ShopProfile shopId={shopId} />} 
            />
          </Routes>
        </div>
      </div>
    </>
  );
};

// ✅ User Dashboard
const UserDashboard = ({ user }) => (
  <>
    <motion.div
      className="welcome-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="welcome-content">
        <UserCircle className="welcome-icon" size={42} strokeWidth={1.5} />
        <h2 className="welcome-text">
          Welcome, <span>{user?.full_name || "User"}</span>
        </h2>
      </div>
      <p className="welcome-subtext">Glad to have you back!</p>
    </motion.div>

    <ErrorBoundary>
    <div className="searchHomeBackground">
    <Search/>
    </div>
    </ErrorBoundary>
    <OfferCarousel></OfferCarousel>
    <TopSellers />
    <Categories />
    <Footer />
  </>
);

// ✅ Protected Route
const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="loading-screen">
        Loading...
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (requiredUserType && user.user_type !== requiredUserType)
    return <Navigate to="/" replace />;

  return children;
};

// ✅ Public Route
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading-screen">
        Loading...
      </div>
    );

  if (user) {
    const redirectPath =
      user.user_type === "vendor"
        ? user.shop_built
          ? "/vendor-dashboard"
          : "/shop-build"
        : "/user-dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// ✅ Vendor-Specific Route
const VendorRoute = ({ children, requireShopBuilt = false }) => {
  const { user } = useAuth();
  if (requireShopBuilt && !user.shop_built)
    return <Navigate to="/shop-build" replace />;
  if (!requireShopBuilt && user.shop_built)
    return <Navigate to="/vendor-dashboard" replace />;
  return children;
};

export default function App() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="loading-screen">
        Loading...
      </div>
    );

  return (
    <BrowserRouter>
      {/* Show HomeNavbar when no user is logged in */}
      {!user && <HomeNavbar />}
      
      {/* Show Navbar only for logged-in users of type 'user' */}
      {user && user.user_type === "user" && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
        <Route path="/service" element={<PublicRoute><Service /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signupchoice" element={<PublicRoute><SignupChoice /></PublicRoute>} />
        <Route path="/signupchoice/vendor" element={<PublicRoute><SignupChoiceVendor /></PublicRoute>} />
        <Route path="/signupchoice/user" element={<PublicRoute><SignupChoiceUser /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgetPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* User Routes */}
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute requiredUserType="user">
              <UserDashboard user={user} />
            </ProtectedRoute>
          }
        />

        {/* Vendor Routes */}
        <Route
          path="/shop-build"
          element={
            <ProtectedRoute requiredUserType="vendor">
              <VendorRoute>
                <ShopBuild />
              </VendorRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor-dashboard/*"
          element={
            <ProtectedRoute requiredUserType="vendor">
              <VendorRoute requireShopBuilt={true}>
                <VendorDashboard />
              </VendorRoute>
            </ProtectedRoute>
          }
        />

        {/* Common Protected Routes */}
        <Route path="/ShopPage/:id" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
        <Route path="/FavouritePage" element={<ProtectedRoute><VendorList /></ProtectedRoute>} />
        <Route path="/ShopSearch" element={<ProtectedRoute><ShopSearch /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}