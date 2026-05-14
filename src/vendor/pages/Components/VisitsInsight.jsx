import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { FiMousePointer } from "react-icons/fi";

const VisitsInsight = () => {
  const [visits, setVisits] = useState(0);
  const [rating, setRating] = useState(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const shopId = localStorage.getItem("shopId");

  useEffect(() => {
    async function fetchData() {
      if (!shopId) return;

      setLoading(true);

      // Fetch visits count
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("visited")
        .eq("id", shopId)
        .single();

      if (shopError) {
        console.error("Error fetching visits:", shopError);
      } else {
        setVisits(shopData?.visited || 0);
      }

      // Fetch rating count and average for shopId
      const { data: ratingData, error: ratingError } = await supabase
        .from("ratings")
        .select("rating", { count: "exact" })
        .eq("shop_id", shopId);

      if (ratingError) {
        console.error("Error fetching ratings:", ratingError);
      } else if (ratingData && ratingData.length > 0) {
        const sum = ratingData.reduce((acc, curr) => acc + curr.rating, 0);
        setRating(sum / ratingData.length);
        setRatingCount(ratingData.length);
      } else {
        setRating(null);
        setRatingCount(0);
      }

      setLoading(false);
    }

    fetchData();
  }, [shopId]);

  if (loading) return <div>Loading visits and ratings...</div>;

  return (
<>

    <div style={{
  display: "flex",
  justifyContent: "center",
  gap: "32px",
  margin: "2em auto",
}}>
 
  {/* Visits Card */}
  <div style={{
    borderRadius: 18,
    padding: 20,
    minWidth: 210,
    textAlign: "center",
    color: "#3d3000",
    fontWeight: "600",
    fontSize: "1.4rem",
    background: "#fff8e1",
    border: "3px solid #ffc908",
    boxShadow: "0 4px 15px rgba(255, 201, 8, 0.18)",
  }}>
    <FiMousePointer size={44} color="#ffc908" style={{ marginBottom: 10 }} />
    <div style={{ fontSize: "1.1rem", marginBottom: 10, color: "#ecb506" }}>Total Visits</div>
    <div style={{ fontSize: "2rem", fontWeight: 700 }}>{visits}</div>
  </div>

  {/* Rating Card */}
  <div style={{
    borderRadius: 18,
    padding: 20,
    minWidth: 210,
    textAlign: "center",
    color: "#3d3000",
    fontWeight: "600",
    fontSize: "1.4rem",
    background: "#fff8e1",
    border: "3px solid #ffc908",
    boxShadow: "0 4px 15px rgba(255, 201, 8, 0.18)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}>
    <span style={{ fontSize: "1.1rem", marginBottom: 10, color: "#ecb506" }}>
      Average Rating {ratingCount > 0 && <>({ratingCount})</>}
    </span>
    {ratingCount > 0 ? (
      <span style={{ fontSize: "2rem", fontWeight: "700" }}>
        {rating.toFixed(2)}
      </span>
    ) : (
      <span style={{ color: "#b2a563", marginTop: 10 }}>No ratings yet</span>
    )}
  </div>
</div>
</>
  );
};

export default VisitsInsight;
