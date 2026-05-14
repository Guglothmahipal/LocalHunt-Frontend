import React, { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAuth } from "../../context/AuthProvider";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { supabase } from "../../supabaseClient";
import ChangeTimings from "./ChangeTimings";
import { Link } from "react-router-dom";
import "../../App.css";
import Toggle from "./Toggle";
import Account from "./Account";
import styles from "./Home.module.css";
import VisitsInsight from "./Components/VisitsInsight";
import LocationOnSharpIcon from "@mui/icons-material/LocationOnSharp";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AddCircleOutlineSharpIcon from "@mui/icons-material/AddCircleOutlineSharp";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import CategoryIcon from "@mui/icons-material/Category";
import StoreIcon from "@mui/icons-material/Store";
import MapComp from "./Components/MapComp";
import AddOfferModal from "./Components/AddOfferModal";
import VendorChat from "./Components/VendorChat";
import { IoChatboxEllipses, IoCartOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef();

  const [showChangeTimings, setShowChangeTimings] = useState(false);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const userUid = localStorage.getItem("shopId");
  const shopId = userUid;

 // { userId: true/false }


  // 🧠 Get Vendor ID from localStorage
  const getVendorId = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        const vendorId = user.id || user.user_id || user.auth_uid;
        if (vendorId) return vendorId;
      }
    } catch (error) {
      console.error("Error getting vendor ID:", error);
    }
    return null;
  };
  const vendorId = getVendorId();
 // --- Then helper functions ---
 

  

  // 🧩 Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  // 🏪 Fetch shop details
  useEffect(() => {
    async function fetchShops() {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("shopname, shopcategory, shoplocation, shopimage, id, shoptimings")
        .eq("id", userUid);

      if (error) console.error("Error fetching shops:", error);
      else setShops(data || []);

      setLoading(false);
    }
    fetchShops();
  }, [userUid]);

  const [chatAnimated, setChatAnimated] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  // const [hasNewMessage, setHasNewMessage] = useState(false);
  // const [hasNewOrder, setHasNewOrder] = useState(false);
  // const [newOrdersByUser, setNewOrdersByUser] = useState({});
  const [showOrdersReceived, setShowOrdersReceived] = useState(false);
  const [ordersReceived, setOrdersReceived] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [ordersVisible, setOrdersVisible] = useState(false);
  const [ordersAnimated, setOrdersAnimated] = useState(false);

  const [hasNewMessage, setHasNewMessage] = useState(
  JSON.parse(localStorage.getItem("hasNewMessage")) || false
);


 const openChatModal = () => {
    setShowChatModal(true);
    setHasNewMessage(false);
  };
 

// --- Chat Modal Animation ---
useEffect(() => {
  let timer;
  if (showChatModal) {
    setChatVisible(true);
    // Add a slight delay so CSS transitions can start cleanly
    timer = setTimeout(() => setChatAnimated(true), 20);
  } else {
    setChatAnimated(false);
    timer = setTimeout(() => setChatVisible(false), 300); // match CSS transition duration
  }
  return () => clearTimeout(timer);
}, [showChatModal]);

// --- Orders Modal Animation ---
useEffect(() => {
  let timer;
  if (showOrdersReceived) {
    setOrdersVisible(true);
    timer = setTimeout(() => setOrdersAnimated(true), 20);
  } else {
    setOrdersAnimated(false);
    timer = setTimeout(() => setOrdersVisible(false), 300);
  }
  return () => clearTimeout(timer);
}, [showOrdersReceived]);


const [hasNewOrder, setHasNewOrder] = useState(() =>
  localStorage.getItem("hasNewOrder") === "true"
);

const [newOrdersByUser, setNewOrdersByUser] = useState(() =>
  JSON.parse(localStorage.getItem("newOrdersByUser")) || {}
);


const handleCloseOrdersReceived = () => {
  setShowOrdersReceived(false);
  setHasNewOrder(false);
  localStorage.setItem("hasNewOrder", "false");
};

function getBool(val) {
  return val === "true";
}

useEffect(() => {
  if (!vendorId || !shopId) return;

  console.log("📡 Subscribing to Supabase channel for vendor-home-updates");

  const channel = supabase
    .channel(`vendor-home-updates-${shopId}`) // unique per shop
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const msg = payload.new;
        if (msg.recipient_id === vendorId && !showChatModal) {
          setHasNewMessage(true);
          localStorage.setItem("hasNewMessage", "true");
        }
      }
    )
 .on("postgres_changes", {
  event: "UPDATE",
  schema: "public",
  table: "shops",
  filter: `id=eq.${shopId}`,
}, async (payload) => {
  console.log("🟢 Shops updated", payload);

  const newPackups = payload.new?.packups || [];
  const oldPackups = payload.old?.packups || [];

  // Always assume something changed if data lengths differ or old missing
  if (!payload.old || newPackups.length !== oldPackups.length) {
    setHasNewOrder(true);
    localStorage.setItem("hasNewOrder", "true");
    await fetchOrdersReceived();
    // return;
  }

  // Look for new "pending" orders
 const newOrdersUsers = {};
newPackups.forEach((order) => {
  const uid = String(order.user_id); // ✅ Always string keys
  const existed = oldPackups.find((o) => o.created_at === order.created_at);
  if (!existed && order.status === "pending") {
    newOrdersUsers[uid] = true;
  }
});

if (Object.keys(newOrdersUsers).length > 0) {
  console.log("🟡 New pending orders detected:", newOrdersUsers);
  setHasNewOrder(true);
  localStorage.setItem("hasNewOrder", "true");

  await fetchOrdersReceived(); // ✅ Fetch first

  setNewOrdersByUser((prev) => {
    const updated = { ...prev, ...newOrdersUsers };
    localStorage.setItem("newOrdersByUser", JSON.stringify(updated));
    console.log("💾 Saved newOrdersByUser:", updated);
    return updated;
  });
}
})


    .subscribe();

  // ✅ Cleanup to avoid duplicates
  return () => {
    console.log("🧹 Unsubscribing from Supabase channel...");
    supabase.removeChannel(channel);
  };
}, [shopId]); // ✅ only these, never include state setters

const handleOpenOrders = () => {
  setShowOrdersReceived(true);
  setHasNewOrder(false);
  localStorage.removeItem("hasNewOrder");

  // ✅ refresh the local state from localStorage before showing modal
  const stored = JSON.parse(localStorage.getItem("newOrdersByUser")) || {};
  setNewOrdersByUser(stored);
};


useEffect(() => {
  const handleStorageChange = () => {
    setHasNewOrder(localStorage.getItem("hasNewOrder") === "true");
    setNewOrdersByUser(JSON.parse(localStorage.getItem("newOrdersByUser")) || {});
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);




// Use this for modal's close button:
// <button onClick={handleCloseOrdersReceived}>Close</button>

  // ✅ Fetch Orders from Supabase (shop.packups)
  const fetchOrdersReceived = async () => {
    try {
      if (!shopId) {
        console.warn("Shop ID missing, cannot fetch orders.");
        return;
      }

      const { data, error } = await supabase
        .from("shops")
        .select("packups")
        .eq("id", shopId)
        .single();

      if (error) throw error;

      const orders = data?.packups || [];

      // Group by user_id
      const grouped = orders.reduce((acc, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = {
            name: order.user_name, // store user_name for display
            orders: [],
          };
        }
        acc[order.user_id].orders.push(order);
        return acc;
      }, {});

      setOrdersReceived(grouped);

    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const markOrderComplete = async (user_id, created_at) => {
    try {
      if (!shopId) {
        console.warn("Shop ID missing, cannot update orders.");
        return;
      }

      const { data: shopData, error: fetchError } = await supabase
        .from("shops")
        .select("packups")
        .eq("id", shopId)
        .single();

      if (fetchError) throw fetchError;

      const updatedPackups = shopData.packups.map((p) =>
        p.user_id === user_id && p.created_at === created_at
          ? { ...p, status: "complete" }
          : p
      );

      const { error: updateError } = await supabase
        .from("shops")
        .update({ packups: updatedPackups })
        .eq("id", shopId);

      if (updateError) throw updateError;

      alert("Order marked as complete!");
      fetchOrdersReceived();
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order.");
    }
  };

  // ✅ Mark order 

  // 🔄 Fetch when modal opens
  useEffect(() => {
    if (showOrdersReceived) fetchOrdersReceived();
  }, [showOrdersReceived]);



  return (

    <>

      {ordersVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "90%",
              maxWidth: 900,
              height: "85vh",
              display: "flex",
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              overflow: "hidden",
              transition: "opacity 0.3s ease, transform 0.3s ease",
              opacity: ordersAnimated ? 1 : 0,
              transform: ordersAnimated ? "scale(1)" : "scale(0.8)",
              transformOrigin: "center",
            }}
          >
            {/* Sidebar: Users */}
            <div
              style={{
                width: "30%",
                background: "#f9fafb",
                borderRight: "1px solid #eee",
                padding: 16,
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <h3 style={{ margin: 0 }}>Orders</h3>
                <button
                  onClick={() => setShowOrdersReceived(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 18,
                    cursor: "pointer",
                  }}
                >
                  ✖
                </button>
              </div>

          {Object.keys(ordersReceived).length === 0 ? (
  <p style={{ color: "#888" }}>No orders received.</p>
) : (
  Object.entries(ordersReceived)
    // ✅ Sort: users with new orders first
    .sort(([uidA], [uidB]) => {
      const aNew = !!newOrdersByUser[String(uidA)];
      const bNew = !!newOrdersByUser[String(uidB)];
      if (aNew === bNew) return 0;
      return aNew ? -1 : 1; // new orders appear first
    })
    .map(([uid, data]) => (
      <div
        key={uid}
        onClick={() => {
          setSelectedUser(uid);
          setNewOrdersByUser((prev) => {
            const updated = { ...prev, [uid]: false };
            localStorage.setItem("newOrdersByUser", JSON.stringify(updated));
            return updated;
          });
        }}
        style={{
          padding: "10px",
          borderRadius: 8,
          background: selectedUser === uid ? "rgba(255,193,7,0.2)" : "transparent",
          marginBottom: 6,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#333",
            }}
          >
            {data.name}
          </div>
          <div style={{ fontSize: 12, color: "#777" }}>
            {data.orders.length} order{data.orders.length > 1 ? "s" : ""}
          </div>
        </div>

        {/* 🔴 Red dot beside users who have unseen orders */}
        {newOrdersByUser[String(uid)] && (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "red",
              display: "inline-block",
            }}
          />
        )}
      </div>
    ))
)}


            </div>

            {/* Main content: Order details */}
            <div style={{ flexGrow: 1, padding: 20, overflowY: "auto" }}>
              {selectedUser ? (
                <>
                  <h3 style={{ marginBottom: 10 }}>
                    Orders from {ordersReceived[selectedUser].name}
                  </h3>


                  {ordersReceived[selectedUser].orders.map((order, i) => (


                    <div
                      key={i}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 10,
                        background: "#fff",
                      }}
                    >
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          style={{
                            color:
                              order.status === "complete" ? "#34A853" : "#FBBC05",
                          }}
                        >
                          {order.status}
                        </span>
                      </p>

                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {order.items.map((it, j) => (
                          <li key={j}>
                            {it.name} — Qty: {it.qty}
                          </li>
                        ))}
                      </ul>

                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            markOrderComplete(selectedUser, order.created_at)
                          }
                          style={{
                            marginTop: 10,
                            background: "#34A853",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            cursor: "pointer",
                          }}
                        >
                          ✅ Mark Complete
                        </button>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ color: "#888", textAlign: "center", marginTop: "40%" }}>
                  Select a user to view their orders
                </p>
              )}
            </div>
          </div>
        </div>
      )}




      <div className={styles.topheader}>
        <Toggle />
        <span className={styles.dashname}>Local-Hunt</span>

        <div className="d-flex align-items-center ms-auto">
          {/* 💬 Chat Icon */}
          <div style={{ position: "relative" }}>
            <button
              className="btn"
              style={{
                fontWeight: 500,
                position: "relative",
                color: "white",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
                backgroundColor:"none",
              }}
             onClick={() => {
  setShowChatModal(true);
  setHasNewMessage(false);
  localStorage.setItem("hasNewMessage", "false");
}}

              title="View Messages"
            >
              <IoChatboxEllipses style={{ marginRight: "5px", fontSize: "25px" }} />
              {hasNewMessage && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 16,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#ffc908",
                    display: "inline-block",

                  }}
                />
              )}
            </button>
          </div>

          {/* 🛍️ Orders Icon */}
          <div style={{ position: "relative" }}>
<button
  onClick={handleOpenOrders}
  title="View Orders"
  style={{
    fontWeight: 500,
    position: "relative",
    color: "white",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    backgroundColor: "transparent",
  }}
>
  <IoCartOutline style={{ marginRight: "5px", fontSize: "25px" }} />
  {hasNewOrder && (
    <span
      style={{
        position: "absolute",
        top: "6px",
        right: "16px",
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: "#ffc908",
        border: "2px solid #fff",
        display: "inline-block",
      }}
    />
  )}
</button>


          </div>


          {/* 👤 Profile Menu */}
          <button className={styles.btn} onClick={() => setMenuOpen(!menuOpen)}>
            <i className="fa-solid fa-user-circle"></i>
          </button>

          {menuOpen && (
            <div ref={menuRef} className={styles.dropdownMenu}>
              <ul>
                <li onClick={() => setShowAccountModal(true)}>Account</li>
                <li onClick={logout}>Logout</li>
              </ul>
              

            </div>
          )}
        </div>
      </div>
      {showAccountModal && (
  <AnimatePresence>
  <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            zIndex: 999999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(2px)",
            // backgroundColor:"black",
          }}
        >
      <Account onClose={() => setShowAccountModal(false)} />
    </div>
  </AnimatePresence>
)}

      {/* 🏪 Main Content */}
      <div className={styles.maincontainer}>
        <div className={styles.welcomecard}>
          <h2>Welcome,  {shops.length > 0 ? (
                  shops.map((shop) => (
                    // <img key={shop.id} src={shop.shopimage} alt="Shop" />
                        <span className={styles.shopname}>{shop.shopname}</span>
                    
                  ))
                ) : (
                  <p>No shops found</p>
                )}</h2>
        </div>

        <div className={styles.header}>
          <div className={styles.userdetails}>
            <div className={styles.userdetails1}>
              <div className={styles.userimage}>
                {shops.length > 0 ? (
                  shops.map((shop) => (
                    <img key={shop.id} src={shop.shopimage} alt="Shop" />
                  ))
                ) : (
                  <p>No shops found</p>
                )}
              </div>

              <div className={styles.usershop}>
                {shops.length > 0 ? (
                  shops.map((shop, index) => (
                    <div key={index}>
                      <div className={styles.shopdetails}>
                        <span className={styles.labelicon}>
                          <StoreIcon />
                        </span>
                        <span className={styles.shopname}>{shop.shopname}</span>
                      </div>
                      <div className={styles.shopdetails}>
                        <span className={styles.labelicon}>
                          <CategoryIcon />
                        </span>
                        <span className={styles.shoptype}>
                          {shop.shopcategory}
                        </span>
                      </div>
                      <div className={styles.shopdetails}>
                        <span className={styles.labelicon}>
                          <AccessTimeOutlinedIcon />
                        </span>
                        <span className={styles.shoptimings}>
                          Timings {shop.shoptimings?.openingTime} -{" "}
                          {shop.shoptimings?.closingTime}
                        </span>
                      </div>
                      <div className={styles.location}>
                        <span className={styles.labelicon}>
                          <LocationOnSharpIcon />
                        </span>
                        <span className={styles.shoplocation}>
                          {shop.shoplocation}
                        </span>
                      </div>
                      <Link
                        to="shopprofile"
                        style={{ textDecoration: "none" }}
                      >
                        <button className={styles.openshopbtn}>
                          Open ShopProfile <OpenInNewIcon />
                        </button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p>No shops found</p>
                )}
              </div>
            </div>

            {/* ⚙️ Actions Section */}
            <div className={styles.userdetails2}>
              <div className={styles.actionlabel}>Actions</div>
              <div className={styles.actions}>
                <div
                  className={styles.actionitem}
                  onClick={() => setShowChangeTimings(true)}
                >
                  <span className={styles.actionicon}>
                    <AccessTimeOutlinedIcon />
                  </span>
                  <span className={styles.actionname}>Change Timings</span>
                </div>

                <div className={styles.actionitem}>
                  <span className={styles.actionicon}>
                    <FormatListBulletedIcon />
                  </span>
                  <Link to="inventory" className={styles.actionname}>
                    Manage Products
                  </Link>
                </div>

                <div>
                  <div
                    className={styles.actionitem}
                    onClick={() => setShowModal(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className={styles.actionicon}>
                      <AddCircleOutlineSharpIcon />
                    </span>
                    <span className={styles.actionname}>Add New Offer</span>
                  </div>
                  {showModal && (
                    <AddOfferModal onClose={() => setShowModal(false)} />
                  )}
                </div>
              </div>
            </div>

          

            <div className={styles.userdetails3}>
             <MapComp/>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Insights Section */}
      <div className={styles.insightscontainer}>
           
        <VisitsInsight />
      </div>

      {/* 💬 Vendor Chat Modal */}
      {chatVisible && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)", // overlay appears instantly
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              transition: "opacity 0.3s ease, transform 0.3s ease",
              opacity: chatAnimated ? 1 : 0,
              transform: chatAnimated ? "scale(1)" : "scale(0.8)",
              transformOrigin: "center",
            }}
          >
            <VendorChat
              vendorId={vendorId}
              websocketUrl="wss://chatbot-server-yawb.onrender.com"
              isOpen={showChatModal}
              onClose={() => setShowChatModal(false)}
              onNewMessage={() => setHasNewMessage(true)}
            />
          </div>
        </div>
      )}
  {/* ⏰ Change Timings Modal */}
            {showChangeTimings && (
              <ChangeTimings
                shopId={userUid}
                onClose={() => setShowChangeTimings(false)}
                onUpdated={async () => {
                  const { data, error } = await supabase
                    .from("shops")
                    .select(
                      "shopname, shopcategory, shoplocation, shopimage, id, shoptimings"
                    )
                    .eq("id", userUid);
                  if (!error) setShops(data || []);
                }}
              />
            )}
    </>
  );
};

export default Home;