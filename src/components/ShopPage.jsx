import { NotebookPen ,Smile} from 'lucide-react';
import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/logo-png.png";
import styles from "./ShopPage.module.css";
import { CiShop } from "react-icons/ci";
import { FaStar, FaTag, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import { iconMapping } from "./IconTags";
import { FcContacts } from "react-icons/fc";
import { FaPhoneAlt } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { IoChatboxEllipses } from "react-icons/io5";
import { categoryIcons } from "./CategoriesIcons";
import Footer from "../Footer";
import { useAuth } from "../context/AuthProvider";
import NavigationMap from "./NavigationMap";
import { IoClose } from "react-icons/io5";
import FeedbackModal from "./feedBackModal";
import HistorySharpIcon from '@mui/icons-material/HistorySharp';
import CloseIcon from '@mui/icons-material/Close';
import UserChat from "./UserChat";
import ShoppingCartSharpIcon from '@mui/icons-material/ShoppingCartSharp';
// Map imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SendIcon from '@mui/icons-material/Send';
import { RiResetLeftFill } from "react-icons/ri";
import { ShoppingBag } from 'lucide-react';
import { Snackbar, Alert, Button } from "@mui/material";
import Loading from "../assets/shopload.json";
import Lottie from "lottie-react";
// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ShopPage = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [showInventory, setShowInventory] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [packingFacility, setPackingFacility] = useState(false);

  // Cart and Orders States
  const [cartItems, setCartItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showRecentOrders, setShowRecentOrders] = useState(false);

  // Map reference
  const mapRef = useRef();
  const { user } = useAuth();

  // 🧠 Fetch user info
  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData?.user_id;
  const username = userData?.full_name || userData?.name || "Unknown User";

  // 🏪 Fetch shop inventory
  const fetchInventory = async () => {
    if (!id) return;
    setInventoryLoading(true);

    try {
      const { data, error } = await supabase
        .from("shops")
        .select("shopitems, packing_facility, packups")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching inventory:", error);
        alert("Unable to load inventory. Please try again later.");
        return;
      }

      let items = [];
      if (data.shopitems) {
        if (Array.isArray(data.shopitems)) items = data.shopitems;
        else {
          try {
            items = JSON.parse(data.shopitems);
          } catch {
            items = [];
          }
        }
      }

      setInventoryItems(items);
      setPackingFacility(data.packing_facility?.toLowerCase() === "yes");
      setShowInventory(true);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setInventoryLoading(false);
    }
  };

  // 🛒 Cart Functions
  const addToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [...prev, { name: item.name, qty: 1 }];
      }
    });
  };

  const decreaseQty = (item) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.name === item.name ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  // 📦 Send Cart to Vendor
  const sendCartToVendor = async () => {
    if (!cartItems.length) return alert("Cart is empty!");

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const userId = userData?.user_id || userData?.id || userData?.auth_uid;
      const userName = userData?.full_name || userData?.name || "Unknown User";

      const { data: shopData, error: fetchError } = await supabase
        .from("shops")
        .select("packups")
        .eq("id", shop.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedPackups = [
        ...(shopData.packups || []),
        {
          user_id: userId,
          user_name: username,
          items: cartItems,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ];

      const { error: updateError } = await supabase
        .from("shops")
        .update({ packups: updatedPackups })
        .eq("id", shop.id);

      if (updateError) throw updateError;

      alert("Order sent successfully!");
      setCartItems([]);
      setShowCartModal(false);
    } catch (err) {
      console.error("Error sending cart:", err);
      alert("Failed to send order.");
    }
  };

  // 📋 Recent Orders Functions
  const fetchRecentOrders = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const userId = userData?.user_id || userData?.id || userData?.auth_uid;

      const { data, error } = await supabase
        .from("shops")
        .select("packups")
        .eq("id", shop.id)
        .single();

      if (error) throw error;

      const orders = Array.isArray(data?.packups)
        ? data.packups.filter(
          (p) =>
            p.user_id === userId &&
            (p.status === "pending" || p.status === "complete")
        )
        : [];

      setRecentOrders(orders);
      setShowRecentOrders(true);
    } catch (err) {
      console.error("Error fetching recent orders:", err);
      alert("Failed to load recent orders.");
    }
  };

  const cancelOrder = async (order) => {
    try {
      const { data: shopData, error: fetchError } = await supabase
        .from("shops")
        .select("packups")
        .eq("id", shop.id)
        .single();

      if (fetchError) throw fetchError;

      let updatedPackups;

      if (order.status === "pending") {
        updatedPackups = (shopData.packups || []).filter(
          (p) => p.created_at !== order.created_at
        );
      } else if (order.status === "complete") {
        updatedPackups = (shopData.packups || []).map((p) =>
          p.created_at === order.created_at
            ? { ...p, status: "complete_cancelled" }
            : p
        );
      }

      const { error: updateError } = await supabase
        .from("shops")
        .update({ packups: updatedPackups })
        .eq("id", shop.id);

      if (updateError) throw updateError;

      alert(
        order.status === "pending"
          ? "Pending order deleted successfully!"
          : "Completed order marked as cancelled!"
      );

      fetchRecentOrders();
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert("Failed to cancel order.");
    }
  };

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("shop-packup-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shops",
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          console.log("🔔 Realtime update:", payload);
          fetchRecentOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Get position from shop coordinates or use fallback
  const getPosition = () => {
    if (!shop) {
      return [51.505, -0.09];
    }

    if (shop.coordinates) {
      if (typeof shop.coordinates === 'object' && shop.coordinates.lat && shop.coordinates.lng) {
        return [shop.coordinates.lat, shop.coordinates.lng];
      } else if (Array.isArray(shop.coordinates) && shop.coordinates.length === 2) {
        return shop.coordinates;
      } else if (typeof shop.coordinates === 'string') {
        const [lat, lng] = shop.coordinates.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng];
        }
      }
    }

    if (shop.shoplocation) {
      const coordMatch = shop.shoplocation.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
      if (coordMatch) {
        return [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
      }
    }

    console.warn('No valid coordinates found, using default position');
    return [51.505, -0.09];
  };

  const onMarkerDragEnd = (event) => {
    const marker = event.target;
    const position = marker.getLatLng();
    console.log("Marker dragged to:", position);
  };

  const getUserId = () => {
    if (user?.id) {
      console.log("Using user ID from AuthProvider:", user.id);
      return user.id;
    }
    if (user?.user_id) {
      console.log("Using user_id from AuthProvider:", user.user_id);
      return user.user_id;
    }
    if (user?.auth_uid) {
      console.log("Using auth_uid from AuthProvider:", user.auth_uid);
      return user.auth_uid;
    }

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log("User data from localStorage:", userData);

        const userId = userData.id || userData.user_id || userData.auth_uid;
        console.log("Extracted user ID:", userId);
        return userId;
      }
    } catch (error) {
      console.error("Error getting user from localStorage:", error);
    }

    console.log("No user ID found");
    return null;
  };

  const isUserLoggedIn = () => {
    return !!getUserId();
  };

  // Fetch shop data
  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching shop:", error);
        } else {
          setShop(data);
          console.log("Shop coordinates:", data.coordinates);
          const targetUserId = getUserId();
          if (targetUserId) {
            await checkUserRating(targetUserId);
          }
        }
      } catch (error) {
        console.error("Error in fetchShop:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [id, user]);

  const checkUserRating = async (targetUserId) => {
    try {
      if (!targetUserId) {
        console.log("No user ID available for rating check");
        return;
      }

      console.log("Checking rating for user:", targetUserId, "in shop:", id);

      const { data: userExists, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle();

      if (userCheckError || !userExists) {
        console.log("User ID not found in database, skipping rating check");
        return;
      }

      const { data, error } = await supabase
        .from("ratings")
        .select("rating")
        .eq("shop_id", id)
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (error) {
        console.log("Error checking rating (non-critical):", error);
        return;
      }

      if (data) {
        setHasRated(true);
        setUserRating(data.rating);
        console.log("User has already rated:", data.rating);
      } else {
        console.log("No previous rating found");
      }
    } catch (error) {
      console.log("No previous rating found or error:", error);
    }
  };

  const calculateNewRating = (currentRating, currentRaters, newRating) => {
    const currentTotal = currentRating * currentRaters;
    const newTotal = currentTotal + newRating;
    const newAverage = newTotal / (currentRaters + 1);
    return {
      newRating: parseFloat(newAverage.toFixed(1)),
      newRaters: currentRaters + 1,
    };
  };

  const handleRatingSubmit = async (rating) => {
    if (hasRated || isSubmitting) return;

    const targetUserId = getUserId();
    if (!targetUserId) {
      alert("Please log in to rate this shop");
      return;
    }

    console.log("Submitting rating:", rating, "for user:", targetUserId, "in shop:", id);

    setIsSubmitting(true);
    try {
      const { newRating, newRaters } = calculateNewRating(
        shop.shoprating,
        shop.noofraters,
        rating
      );

      const { data: userExists, error: userCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("id", targetUserId)
        .maybeSingle();

      if (userCheckError || !userExists) {
        console.warn("User ID not found in database, cannot submit rating");
        alert("Your account is not properly synced with the database. Please log out and log in again.");
        return;
      }

      const { data: existingRating, error: checkError } = await supabase
        .from("ratings")
        .select("id")
        .eq("shop_id", id)
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing rating:", checkError);
      }

      if (existingRating) {
        console.log("User already rated this shop, updating instead");
        setHasRated(true);
        setUserRating(rating);
        alert("You have already rated this shop!");
        return;
      }

      const { error: ratingError } = await supabase
        .from("ratings")
        .insert({
          shop_id: id,
          user_id: targetUserId,
          rating: rating,
          created_at: new Date().toISOString(),
        });

      if (ratingError) {
        if (ratingError.code === '23503') {
          console.error("Foreign key violation - user doesn't exist:", targetUserId);
          alert("Your account is not properly synced with the database. Please log out and log in again.");
          return;
        }
        if (ratingError.code === '23505') {
          console.error("Duplicate rating - user already rated this shop");
          setHasRated(true);
          alert("You have already rated this shop!");
          return;
        }
        throw ratingError;
      }

      const { error: shopError } = await supabase
        .from("shops")
        .update({
          shoprating: newRating,
          noofraters: newRaters,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (shopError) throw shopError;

      setShop((prev) => ({
        ...prev,
        shoprating: newRating,
        noofraters: newRaters,
      }));

      setHasRated(true);
      setUserRating(rating);

      console.log("Rating submitted successfully!");
      alert("Thank you for your rating!");
    } catch (error) {
      console.error("Error updating rating:", error);

      if (error.code === '42501') {
        alert("You don't have permission to rate this shop.");
      } else if (error.code === '42703') {
        alert("Database error. Please try again later.");
      } else {
        alert("Failed to submit rating. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    rating,
    interactive = false,
    onStarClick = null,
    onStarHover = null
  ) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar
            key={i}
            className={`${styles.star} ${styles.filled} ${interactive ? styles.interactive : ""}`}
            onClick={() => interactive && onStarClick && onStarClick(i)}
            onMouseEnter={() => interactive && onStarHover && onStarHover(i)}
            onMouseLeave={() => interactive && onStarHover && onStarHover(0)}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt
            key={i}
            className={`${styles.star} ${styles.filled} ${interactive ? styles.interactive : ""}`}
            onClick={() => interactive && onStarClick && onStarClick(i)}
            onMouseEnter={() => interactive && onStarHover && onStarHover(i)}
            onMouseLeave={() => interactive && onStarHover && onStarHover(0)}
          />
        );
      } else {
        stars.push(
          <FaRegStar
            key={i}
            className={`${styles.star} ${interactive ? styles.interactive : ""}`}
            onClick={() => interactive && onStarClick && onStarClick(i)}
            onMouseEnter={() => interactive && onStarHover && onStarHover(i)}
            onMouseLeave={() => interactive && onStarHover && onStarHover(0)}
          />
        );
      }
    }
    return stars;
  };

  // Ref for UserChat to call sendMessage method
  const userChatRef = useRef();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        {/* <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading shop...</span>
        </div>
        <p className="ms-3">Loading shop details...</p> */}
  <Lottie
          animationData={Loading}
          loop
          autoplay
        />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container text-center mt-5">
        <h2>Shop Not Found</h2>
        <p>The shop you're looking for doesn't exist or has been removed.</p>
        <Link to="/ShopSearch" className="btn btn-primary">
          Browse Shops
        </Link>
      </div>
    );
  }

  const shopStatus = shop.shopstatus || "Closed";

  const ChatModal = () => (
    <div
      className={`modal fade show mt-4 ${styles.mainchat} `} 
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent:"center",
        alignItems:"center",
      }}
      tabIndex="-1"
      role="dialog"

    >
      <div
        className={`modal-dialog modal-dialog-centered ${styles.chatbox}`}
        style={{ maxWidth: "400px" }}
      >
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header bg-warning text-dark py-2">
            <h6 className="modal-title mb-0">
              <IoChatboxEllipses className="me-2" /> Live Chat
            </h6>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowChat(false)}
            ></button>
          </div>
          <div
            className="modal-body p-0"
            style={{
              height: "500px",
              overflow: "hidden",
            }}
          >
            <UserChat
              ref={userChatRef}
              userId={getUserId()}
              vendorId={shop?.vendor_id}
              websocketUrl="wss://chatbot-server-yawb.onrender.com"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Hero Section */}
      <div className={`ms-3 mt-3 ${styles.heroContainer}`}>
        <img
          src={shop.shopimage || logo}
          alt={`${shop.shopname} image`}
          className={styles.heroImage}
          onError={(e) => {
            e.target.src = logo;
          }}
        />
        <div className={styles.heroOverlay}>
          <h2 className={styles.heroTitle}>
            <CiShop className={styles.shopIcon} /> {shop.shopname}
          </h2>
          <div className={styles.heroMeta}>
            <span className={styles.ratingBadge}>
              {renderStars(shop.shoprating)} {shop.shoprating}
            </span>
            <span className={styles.metaText}>
              ({shop.noofraters} ratings)
            </span>
            <span
              className={
                shopStatus === "Open"
                  ? styles.shopStatusOpen
                  : styles.shopStatusClosed
              }
            >
              {shopStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className={`container-fluid mt-4 ${styles.detailsContainer}`}>
        <div className="d-flex justify-content-start mb-3">
          <button
            onClick={fetchInventory}
            className={`btn ${styles.inventory_btn}`}
            disabled={inventoryLoading}
          >
            <span
              className={styles.spinner_wrapper}
              style={{ display: inventoryLoading ? "inline-flex" : "none" }}
            >
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Loading...
            </span>

            <span
              className={styles.content_wrapper}
              style={{ display: !inventoryLoading ? "inline-flex" : "none" }}
            >
              <i className={`fa-solid fa-box me-1 ${styles.box_icon}`}></i>
              Show Inventory
            </span>
          </button>
        </div>

        <div className="row">
          {/* Left Column */}
          <div className="col-md-8">
            <div className={`card p-3 mb-3 ${styles.infoCard}`}>
              <h4>About</h4>
              <p className={styles.description}>
                {shop.shopdescription || "Welcome to our shop! We provide quality products and excellent service."}
              </p>
            </div>

            <div className={`card p-3 mb-3 ${styles.infoCard}`}>
              <h5 className="mt-3">Our Services</h5>
              <ul className="list-unstyled">
                {shop.Services?.map((cat, i) => {
                  const CatIcon = categoryIcons[cat];
                  return (
                    <li key={i} className="d-flex align-items-center mb-2">
                      {CatIcon ? <CatIcon className="me-2 text-primary" /> : <span className="me-2">❓</span>}
                      <span>{cat}</span>
                    </li>
                  );
                })}
                {(!shop.Services || shop.Services.length === 0) && (
                  <li className="text-muted">No Services listed</li>
                )}
              </ul>
            </div>

            <div className={`card p-3 mb-3 ${styles.infoCard}`}>
              <h4>Rate us</h4>
              <div className={styles.ratingSection}>
                {!isUserLoggedIn() ? (
                  <div className={styles.loginMessage}>
                    <p>Please log in to rate this shop</p>
                    <Link to="/login" className="btn btn-primary">
                      Login
                    </Link>
                  </div>
                ) : hasRated ? (
                  <div className={styles.ratedMessage}>
                    <p>Thank you for your rating! <Smile /></p>
                    <div className={styles.userRating}>
                      Your rating: {renderStars(userRating)} ({userRating}/5)
                    </div>
                    <small className="text-muted">You can only rate a shop once.</small>
                  </div>
                ) : (
                  <>
                    <div className={styles.starsContainer}>
                      {renderStars(
                        hoverRating || userRating,
                        true,
                        handleRatingSubmit,
                        setHoverRating
                      )}
                    </div>
                    <p className={styles.ratingHint}>
                      {hoverRating > 0
                        ? `Rate ${hoverRating} star${hoverRating > 1 ? 's' : ''}`
                        : "Click on a star to rate this shop"}
                    </p>
                    {isSubmitting && (
                      <div className={styles.submittingText}>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Submitting...</span>
                        </div>
                        Submitting your rating...
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/*Feedback Button */}
              <div className="mt-4 pt-3 border-top">
                <button
                  onClick={() => setFeedbackModalOpen(true)}
                  className="btn btn-warning w-100 py-2 LivechatButton"
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  <NotebookPen className='chatIcon' /> Leave Detailed Feedback
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-md-4">
            <div className={`card p-3 mb-3 ${styles.infoCard}`}>
              <h6>Shop Tags</h6>
              <div className="d-flex flex-wrap gap-2">
                {shop.shoptags?.map((tag, i) => {
                  const Icon = iconMapping[tag] || FaTag;
                  return (
                    <span key={i} className={styles.tagBadge}>
                      <Icon size={14} className="me-1" /> {tag}
                    </span>
                  );
                })}
                {(!shop.shoptags || shop.shoptags.length === 0) && (
                  <p className="text-muted mb-0">No tags available</p>
                )}
              </div>
            </div>

            <div className={`card p-3 mb-3 ${styles.infoCard}`}>
              <h6>📍 Location</h6>
              <p className="mb-0">{shop.shoplocation || "Location not specified"}</p>
            </div>

            {/* Contact Card */}
            <div className={`card p-3 mb-3 ${styles.infoCard}`}>
              <h6>
                <FcContacts className="me-2" /> Contact us
              </h6>
              <div className="mb-2">
                <b>
                  <MdEmail className="me-2" /> Email:
                </b>{" "}
                {shop.shopemail || "Not provided"}
              </div>
              <div className="mb-3">
                <b>
                  <FaPhoneAlt className="me-2" /> Phone:
                </b>{" "}
                {shop.shopcontact || "Not provided"}
              </div>
              <button
                className="btn btn-warning w-100 LivechatButton"
                onClick={() => setShowChat(true)}
              >
                <IoChatboxEllipses className="me-2 chatIcon" /> Live Chat
              </button>
            </div>

            {/* Chat Modal */}
            {showChat && <ChatModal />}
          </div>
        </div>
      </div>

      {/* Fixed Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        vendorId={shop.id} 
        vendorName={shop.shopname}
      />

      {/* Map Section */}
      <div className="container-fluid mt-4">
        <h4 className="mb-3">Find Us Here</h4>
        <div className={styles.map}>
          {shop && (
            <MapContainer
              key={shop.id}
              whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
              center={getPosition()}
              zoom={16}
              zoomControl={true}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                maxZoom={20}
                subdomains={["mt0", "mt1", "mt2", "mt3"]}
              />
              <Marker
                position={getPosition()}
                draggable={false}
                eventHandlers={{ dragend: onMarkerDragEnd }}
              >
                <Popup autoOpen={true}>
                  <strong>{shop.shopname}</strong>
                  <br />
                  {shop.shoplocation || 'Location not specified'}
                </Popup>
              </Marker>
            </MapContainer>)}
        </div>
      </div>

      {/* Navigation Button */}
      <button
        onClick={() => {
          if (!shop || !shop.coordinates) {
            alert("Shop coordinates not found!");
            return;
          }

          let destLat, destLng;
          if (typeof shop.coordinates === "object" && shop.coordinates.lat && shop.coordinates.lng) {
            destLat = shop.coordinates.lat;
            destLng = shop.coordinates.lng;
          } else if (Array.isArray(shop.coordinates) && shop.coordinates.length === 2) {
            [destLat, destLng] = shop.coordinates;
          } else if (typeof shop.coordinates === "string") {
            const [lat, lng] = shop.coordinates.split(",").map(c => parseFloat(c.trim()));
            destLat = lat;
            destLng = lng;
          } else {
            alert("Invalid coordinates format for this shop.");
            return;
          }

          if (navigator.geolocation) {
            setIsNavigating(true);

            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                if (isMobile) {
                  window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
                } else {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`,
                    "_blank"
                  );
                }

                setTimeout(() => setIsNavigating(false), 2000);
              },
              (error) => {
                console.error("Error getting location:", error);
                alert("Unable to access your location. Please enable GPS.");
                setIsNavigating(false);
              }
            );
          } else {
            alert("Geolocation is not supported by your browser.");
          }
        }}
        disabled={isNavigating}
        className={`navigate-btn ${isNavigating ? "disabled navigating" : ""}`}
      >
        {/* Sedan Car */}
        <div className="car-wrapper">
          <svg
            className="car-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 220 100"
            width="80"
            height="50"
          >
            {/* Sedan Body */}
            <path
              d="M20 60 Q30 40 60 40 H160 Q180 40 190 60 L200 60 L200 70 H20 Z"
              fill="#1E90FF"
            />
            {/* Cabin */}
            <path
              d="M60 40 Q70 20 120 20 Q170 20 180 40 H60 Z"
              fill="#4682B4"
            />
            {/* Wheels */}
            <circle className="wheel back" cx="50" cy="70" r="12" fill="#333" />
            <circle className="wheel front" cx="170" cy="70" r="12" fill="#333" />
            <circle className="hub back" cx="50" cy="70" r="5" fill="#bbb" />
            <circle className="hub front" cx="170" cy="70" r="5" fill="#bbb" />
            {/* Headlights */}
            <ellipse className="headlight left" cx="190" cy="55" rx="6" ry="10" fill="#fff" />
            <ellipse className="headlight right" cx="190" cy="65" rx="6" ry="10" fill="#fff" />
          </svg>
          <div className="dust"></div>
        </div>

        {/* Button Text */}
        {isNavigating ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" />
            Starting Navigation...
          </>
        ) : (
          "Start Navigation"
        )}
      </button>

      {/* 🏬 INVENTORY MODAL */}
      {showInventory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9998,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(2px)",
          }}
          className={styles.inventoryoverlay}
        >
          <div
            className={styles.inventoryModal}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "90%",
              maxWidth: 1200,
              height: "80vh",
              padding: "20px 16px 16px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
          >
            {/* Close Inventory */}
            <button
              onClick={() => setShowInventory(false)}
              style={{
                position: "absolute",
                top: 22,
                left: 15,
                background: "white",
                border: "none",
                borderRadius: "50%",
                width: 37,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                color: "#333",
              }}
            >
              <CloseIcon />
            </button>

            {/* Modal Header Block */}
            <div
              className={styles.inventoryHeader}
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: 0,
                gap: 0,
                width: "100%",
              }}
            >
              <h3 style={{ marginLeft: 100, fontWeight: "bold", color: "#222" }}>
                🛍️ Shop Inventory
              </h3>
              {shop?.packing_facility?.toLowerCase() === "yes" && (
                <div
                  className={styles.inventoryHeaderButtons}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 10,
                    width: "100%",
                    margin: "20px 0 0 0",
                  }}
                >
                  <button
                    onClick={fetchRecentOrders}
                    className={styles.recentbtn}
                    style={{
                      background: "#34A853",
                      color: "white",
                      border: "none",
                      borderRadius: "30px",
                      padding: "8px 16px",
                      fontSize: 14,
                      cursor: "pointer",
                      fontWeight: 600,
                      height: "50px",
                      width: "170px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className={styles.recenticon}><HistorySharpIcon /></span> Recent Orders
                  </button>
                  <button
                    onClick={() => setShowCartModal(true)}
                    className={styles.cartbtn}
                    style={{
                      // background: "#1A73E8",
                      // color: "white",
                      border: "none",
                      borderRadius: "30px",
                      padding: "8px 16px",
                      fontSize: 14,
                      cursor: "pointer",
                      fontWeight: 600,
                      height: "50px",
                      width: "170px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className={styles.carticon}><ShoppingCartSharpIcon /></span> Show Cart ({cartItems.length})
                  </button>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <div
              className={styles.inventoryCategories}
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap",
                padding: "20px 0 10px 0",
                borderBottom: "2px solid #eee",
                marginBottom: 18,
                marginTop: "10px",
                width: "100%",
              }}
            >
              {Array.from(
                new Set(inventoryItems.map((i) => i.category || "Uncategorized"))
              ).map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    backgroundColor:
                      selectedCategory === cat ? "#1A73E8" : "#f1f1f1",
                    color: selectedCategory === cat ? "#fff" : "#333",
                    border: "none",
                    borderRadius: 25,
                    padding: "8px 18px",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  {cat}
                </button>
              ))}
              <button
                onClick={() => setSelectedCategory("All")}
                style={{
                  backgroundColor:
                    selectedCategory === "All" ? "#1A73E8" : "#f1f1f1",
                  color: selectedCategory === "All" ? "#fff" : "#333",
                  border: "none",
                  borderRadius: 25,
                  padding: "8px 18px",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 14,
                }}
              >
                All
              </button>
            </div>

            {/* Items Grid */}
            {/* <div
              className={styles.inventoryGrid}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 20,
                justifyContent: inventoryItems.length === 1 ? "center" : "start",
                 maxHeight: "80vh",
                   overflowY: "auto",
              }}
            > */}
         <div
  className={styles.inventoryGrid}
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(5, 200px)", // fixed 5 per row
    gap: "20px",
    justifyContent: "center",
    alignItems:"center", // always start from left
    padding: "10px",
    maxHeight: "75vh", // scroll within modal
    overflowY: "auto",
    scrollbarWidth: "thin", // for Firefox

  }}
>
  {inventoryItems
    .filter(
      (item) =>
        selectedCategory === "All" ||
        item.category === selectedCategory
    )
    .map((item, idx) => {
      const existing = cartItems.find((i) => i.name === item.name);
      const packingEnabled =
        shop?.packing_facility?.toLowerCase() === "yes";

      return (
        <div
          key={idx}
          style={{
            width: "200px",
            height: "270px",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            overflow: "hidden",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
          }}
          className={styles.itemscard}
        >
          <img
            src={
              item.img ||
              "https://via.placeholder.com/200x150?text=No+Image"
            }
            alt={item.name}
            style={{
              width: "100%",
              height: "160px",
              objectFit: "cover",
              borderBottom: "1px solid #eee",
            }}
          />
          <div style={{ padding: 10, flexGrow: 1 }}>
            <h6 style={{ fontWeight: 600 }}>{item.name}</h6>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              {packingEnabled ? (
                existing ? (
                 <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid #f5e4ea", // light border like your image
    borderRadius: "10px",
    padding: "5px 10px",
    width: "fit-content",
    backgroundColor: "#fdfafd" // light background
  }}
>
  <button
    onClick={() => decreaseQty(item)}
    style={{
      border: "none",
      background: "none",
      color: "#ffc908", // red minus
      fontSize: 20,
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 25,
      height: 25,
      fontWeight:800,
      
    }}
  >
    −
  </button>

  <span style={{ fontWeight: 500, color: "#000", margin: "0 8px" }}>
    {existing.qty}
  </span>

  <button
    onClick={() => addToCart(item)}
    style={{
      border: "none",
      background: "none",
      color: "#ffc908", // red plus
      fontSize: 20,
      cursor: "pointer",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 25,
      height: 25,
      fontWeight:800,
    }}
  >
    +
  </button>
</div>

                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className={styles.addToCartbtn}
                    style={{
                      backgroundColor: "#none",
                      color: "black",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 10px",
                      cursor: "pointer",
                      width: "100%",
                      fontWeight: 600,
                    }}
                  >
                    Add to Cart
                  </button>
                )
              ) : (
                <button
                  disabled
                  style={{
                    backgroundColor: "#ccc",
                    color: "#555",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 10px",
                    width: "100%",
                    cursor: "not-allowed",
                    fontWeight: 500,
                  }}
                >
                  Packing Unavailable
                </button>
              )}
            </div>
          </div>
        </div>
      );
    })}
</div>

          </div>
        </div>
      )}

   {showCartModal && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      backdropFilter: "blur(2px)",
    }}
  >
    <div
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: 16,
        padding: "28px 24px",
        width: "90%",
        maxWidth: 420,
        textAlign: "left",
        boxShadow: "0 4px 28px rgba(0,0,0,0.2)",
        fontFamily: "inherit",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        maxHeight: "92vh", // Prevent modal from exceeding viewport on very tall carts
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* ❌ Close icon button */}
      <button
        onClick={() => setShowCartModal(false)}
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: "none",
          border: "none",
          fontSize: 22,
          color: "#000",
          cursor: "pointer",
          transition: "color 0.2s ease, transform 0.2s ease",
        }}
        // onMouseEnter={(e) => (e.currentTarget.style.color = "#d8214b")}
        // onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
      >
        ✖
      </button>

      <h3
        style={{
          textAlign: "center",
          marginBottom: 24,
          fontWeight: 600,
          color: "#222",
          display:"flex",
          justifyContent:"center",
          alignItems:"center",
          gap:"5px",
        }}
      >
        <ShoppingBag/> Your Cart
      </h3>

      {/* Cart Items Scrollable Section */}
      {cartItems.length === 0 ? (
        <p style={{ textAlign: "center", color: "#777" }}>No items in cart.</p>
      ) : (
        <div
  style={{
    maxHeight: 320,
    overflowY: "auto",
    marginBottom: 8,
    scrollbarWidth: "thin", // For Firefox
    scrollbarColor: "#d8214b #f5e3f0", // thumb color and track color for Firefox
  }}
  className={styles.customscrollbar}
>
          <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
            {cartItems.map((item, i) => (
              <li
                key={i}
                style={{
                  borderBottom: "1px solid #f0f0f0",
                  padding: "12px 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      marginBottom: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "#333",
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ fontSize: 13, color: "#888" }}>
                    {item.unit || "1 pack"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#faf7fa",
                    borderRadius: 9,
                    border: "1px solid #f5e3f0",
                    padding: "2px 8px",
                  }}
                >
                  <button
                    style={{
                      border: "none",
                      background: "none",
                      color: "#ffc908",
                      fontSize: 20,
                      fontWeight: 800,
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "background 0.2s ease",
                    }}
                    // onMouseEnter={(e) =>
                    //   (e.currentTarget.style.background = "rgba(216,33,75,0.1)")
                    // }
                    // onMouseLeave={(e) =>
                    //   (e.currentTarget.style.background = "none")
                    // }
                    onClick={() => decreaseQty(item)}
                  >
                    –
                  </button>

                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: 16,
                      minWidth: 22,
                      textAlign: "center",
                    }}
                  >
                    {item.qty}
                  </span>

                  <button
                    style={{
                      border: "none",
                      background: "none",
                      color: "#ffc908",
                      fontSize: 20,
                      fontWeight: 800,
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "background 0.2s ease",
                    }}
                    // onMouseEnter={(e) =>
                    //   (e.currentTarget.style.background = "rgba(216,33,75,0.1)")
                    // }
                    // onMouseLeave={(e) =>
                    //   (e.currentTarget.style.background = "none")
                    // }
                    onClick={() => addToCart(item)}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons (Stacked Column) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 24,
        }}
      >
        <button
          onClick={sendCartToVendor}
          style={{
            padding: "12px 0",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            background: "#ffc908",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.25s ease, transform 0.2s ease",
          }}
          // onMouseEnter={(e) => (e.currentTarget.style.background = "#b5183d")}
          // onMouseLeave={(e) => (e.currentTarget.style.background = "#d8214b")}
        >
          <SendIcon/> Send Order
        </button>

        <button
          onClick={() => setCartItems([])}
          style={{
            padding: "12px 0",
            border: "1.5px solid #d8214b",
            borderRadius: 10,
            fontSize: 16,
            background: "#fff",
            color: "#d8214b",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.25s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fff0f3")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          <RiResetLeftFill/> Reset Cart
        </button>
      </div>
    </div>
  </div>
)}


      {/* 📋 RECENT ORDERS MODAL */}
      {showRecentOrders && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              width: "90%",
              maxWidth: 500,
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              maxHeight: "80vh",
            }}
          >
            <h3 style={{ marginBottom: 10 }}>Recent Orders</h3>

            <div
              style={{
                overflowY: "auto",
                flex: 1,
                maxHeight: "60vh",
                paddingRight: 8,
              }}
            >
              {recentOrders.length === 0 ? (
                <p>No pending or completed orders.</p>
              ) : (
                recentOrders.map((order, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 10,
                      textAlign: "left",
                      background: "#fafafa",
                    }}
                  >
                    <p style={{ marginBottom: 6 }}>
                      <strong>Status:</strong>{" "}
                      <span
                        style={{
                          color:
                            order.status === "pending"
                              ? "#f39c12"
                              : order.status === "complete"
                                ? "#28a745"
                                : "#dc3545",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {order.status}
                      </span>
                    </p>

                    <ul style={{ marginTop: 0, marginBottom: 10, paddingLeft: 20 }}>
                      {order.items.map((i, j) => (
                        <li key={j}>
                          {i.name} — Qty: {i.qty}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => cancelOrder(order)}
                      style={{
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      ❌ Cancel Order
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowRecentOrders(false)}
              className={styles.closebtn}
              style={{
                background: "#ffc908",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
                marginTop: 10,
                alignSelf: "center",
                transition:"transform 0.4s ease",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ShopPage;