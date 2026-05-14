import React, { useEffect, useState } from "react";
import {supabase} from "../../supabaseClient"
import styles from "./MyCustomers.module.css"; // reuse same CSS styles
import catPlaying from "../../assets/cat-playing.gif";
import Lottie from "lottie-react";
import Loading from "../../assets/shopload.json";
const MyCustomers = () => {
  const shopId = localStorage.getItem("shopId");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!shopId) return;

      setLoading(true);

      try {
        // ✅ Step 1: Get all likes for this shop
        const { data: likesData, error: likesError } = await supabase
          .from("shop_likes")
          .select("user_id")
          .eq("shop_id", shopId);

        if (likesError) throw likesError;

        if (!likesData || likesData.length === 0) {
          setCustomers([]);
          setLoading(false);
          return;
        }

        const userIds = likesData.map((like) => like.user_id);

        // ✅ Step 2: Fetch user details
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("*")
          .in("id", userIds);

        if (usersError) throw usersError;

        setCustomers(usersData || []);
      } catch (error) {
        console.error("❌ Error fetching customers:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [shopId]);

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>My Customers</h3>
      </div>

      {loading ? (
         <div className={styles.loadingText}>  <Lottie
          animationData={Loading}
          loop
          autoplay
        /></div>
      ) : customers.length === 0 ? (
        <div className={styles.emptyState}>
     <img src={catPlaying} alt="No customers" className={styles.emptyImage} />

          <h2>No customers yet</h2>
          <p>Customers who like your shop will appear here!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {customers.map((user) => (
            <div key={user.id} className={styles.card}>
              <div className={styles.cardContent}>
                <img
                  src={user.avatar_url || "https://cdn-icons-png.flaticon.com/512/1077/1077012.png"}
                  alt={user.name || "User"}
                  className={styles.avatar}
                />
                <h4>{user.full_name || "Unknown User"}</h4>
                {/* <p>{user.email}</p> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCustomers;
