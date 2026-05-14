import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthProvider";
import Lottie from "lottie-react";
import searchFall from "../assets/LottieAnimations/Falling_Man.json";
import Novendor from "../assets/LottieAnimations/Sleepy_Cat.json";

export default function Favourites() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const { user } = useAuth();

  // ✅ Helper function to safely get user ID
  const getUserId = () => {
    if (user?.id) return user.id;
    if (user?.user_id) return user.user_id;
    try {
      const stored = JSON.parse(localStorage.getItem("user"));
      return stored?.id || stored?.user_id || null;
    } catch {
      return null;
    }
  };

  // ✅ Fetch liked shops only for the logged-in user
  useEffect(() => {
    const fetchVendors = async () => {
      const userId = getUserId();
      if (!userId) {
        console.warn("User not logged in — skipping favourites fetch");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select(`
          *,
          shop_likes!inner (isLiked, user_id)
        `)
        .eq("shop_likes.isLiked", "Yes")
        .eq("shop_likes.user_id", userId);

      if (error) {
        console.error("Error fetching liked shops:", error);
      } else {
        setVendors(data || []);
      }
      setLoading(false);
    };

    fetchVendors();
  }, [user]);

  // ✅ Filter vendors by search
  const filteredVendors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.shopname?.toLowerCase().includes(q) ||
        v.shopcontact?.toLowerCase().includes(q)
    );
  }, [vendors, search]);

  // ✅ Remove vendor (delete row from shop_likes)
  const handleRemove = async (shopId) => {
    const userId = getUserId();
    if (!userId) return;

    setRemovingId(shopId);
    try {
      const { error } = await supabase
        .from("shop_likes")
        .delete()
        .eq("shop_id", shopId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting vendor like:", error);
      } else {
        setVendors((prev) => prev.filter((v) => v.id !== shopId));
      }
    } catch (err) {
      console.error("Error in handleRemove:", err);
    } finally {
      setRemovingId(null);
    }
  };

  // ✅ Inline styles (updated with better delete button styling)
  const styles = {
    container: { 
      padding: 20, 
      fontFamily: "Inter, Roboto, Arial, sans-serif",
      position: "relative",
      zIndex: 1
    },
    search: {
      padding: "8px 10px",
      width: 240,
      borderRadius: 6,
      border: "1px solid #ccc",
      outline: "none",
      boxSizing: "border-box",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
      gap: 14,
      marginTop: 16,
      alignItems: "start",
    },
    card: {
      position: "relative",
      border: "1px solid #e0e0e0",
      borderRadius: 10,
      padding: 12,
      textAlign: "center",
      background: "#fff",
      boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
      transition: "transform 0.2s ease",
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: "50%",
      display: "block",
      margin: "6px auto",
      objectFit: "cover",
      background: "#fff",
    },
    name: { marginTop: 6, marginBottom: 4, fontSize: 14, fontWeight: 600 },
    phone: { fontSize: 13, color: "#666", marginBottom: 6 },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: "50%",
      border: "none",
      background: "#e74c3c",
      color: "#fff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      fontWeight: "bold",
      lineHeight: 1,
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      transition: "all 0.3s ease",
      zIndex: 10, // Added z-index to ensure button is above other elements
    },
    empty: { color: "#777", marginTop: 20 },
    spinner: {
      width: 16,
      height: 16,
      border: "2px solid #fff",
      borderTop: "2px solid rgba(255,255,255,0.3)",
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
    },
    deleteIconContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
    },
  };

  // ✅ CSS animations for spinner and shake effect
  const cssStyles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      25% { transform: translateX(-2px) rotate(-5deg); }
      50% { transform: translateX(2px) rotate(5deg); }
      75% { transform: translateX(-1px) rotate(-3deg); }
    }
    
    .shake-hover:hover {
      animation: shake 0.5s ease-in-out infinite;
    }
    
    .delete-icon {
      transition: all 0.3s ease;
      filter: brightness(0) invert(1); /* Makes SVG white */
    }
    
    .remove-btn:hover .delete-icon {
      transform: scale(1.2);
    }

    /* Ensure the button has proper stacking context */
    .remove-btn {
      z-index: 10;
    }
  `;

  // ✅ Delete icon component - Fixed version
  const DeleteIcon = () => (
    <div style={styles.deleteIconContainer}>
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="delete-icon"
        style={{ display: 'block' }}
      >
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </div>
  );

  // ✅ Alternative: Simple text icon as fallback
  const SimpleDeleteIcon = () => (
    <span style={{ 
      color: 'white', 
      fontSize: '16px', 
      fontWeight: 'bold',
      lineHeight: 1,
      display: 'block'
    }}>
      ×
    </span>
  );

  // ✅ Render
  return (
    <div style={styles.container}>
      <style>{cssStyles}</style>
      
      <input
        type="text"
        placeholder="Search Vendor"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
        aria-label="Search Vendors"
      />

      {loading ? (
        <div style={{ marginTop: 20 }}>Loading...</div>
      ) : (
        <div style={styles.grid}>
          {filteredVendors.length === 0 ? (
            <div style={styles.empty}>
              {vendors.length === 0
                ? (<div className="d-flex justify-content-center flex-column vw-100 align-items-center" style={{marginLeft:"-1.5rem"}}>
                    <div style={{ height: "250px", width: "250px"}}>
                      <Lottie animationData={searchFall} loop autoplay />
                    </div>
                    <p style={{fontSize:"2rem",marginLeft:"10px"}}><b>Ah Lonely world !</b></p>
                    <p>No vendors found in your favourites</p>
                    <p style={{marginLeft:"10px"}}>Mark the vendors you’re interested in to see them listed here.</p>
                  </div>)
                : (<div className="d-flex justify-content-center vw-100 align-items-center flex-column" style={{marginLeft:"-1.5rem"}}>
                    <div style={{ height: "250px", width: "250px"}}>
                      <Lottie animationData={Novendor} loop autoplay />
                    </div>
                    <p style={{fontSize:"2rem",marginLeft:"10px"}}><b>Uh oh!</b></p>
                    <p style={{marginLeft:"2rem"}}>No vendors found in your search. Please modify and search again</p>
                  </div>)}
            </div>
          ) : (
            filteredVendors.map((v) => (
              <div key={v.id} style={styles.card}>
                <button
                  aria-label={`Remove ${v.shopname}`}
                  title="Remove from favourites"
                  onClick={() => handleRemove(v.id)}
                  style={styles.removeBtn}
                  disabled={removingId === v.id}
                  className={`remove-btn shake-hover ${removingId === v.id ? 'loading' : ''}`}
                  onMouseOver={(e) => {
                    if (removingId !== v.id) {
                      e.target.style.background = "#c0392b";
                      e.target.style.transform = "scale(1.1)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (removingId !== v.id) {
                      e.target.style.background = "#e74c3c";
                      e.target.style.transform = "scale(1)";
                    }
                  }}
                >
                  {removingId === v.id ? (
                    <div style={styles.spinner}></div>
                  ) : (
                    <DeleteIcon />
                    // You can also try <SimpleDeleteIcon /> if SVG still doesn't work
                  )}
                </button>

                <img
                  src={v.shopimage}
                  alt={v.shopname}
                  style={styles.avatar}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/60x60?text=Shop";
                  }}
                />
                <div style={styles.name}>{v.shopname || "Unknown Shop"}</div>
                <div style={styles.phone}>{v.shopcontact || "No contact"}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}