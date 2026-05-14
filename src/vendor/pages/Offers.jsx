// Offers.jsx
import React, { useEffect, useState } from "react";
import {supabase} from "../../supabaseClient"
import styles from "./Offers.module.css"; 
import Lottie from "lottie-react";
import Loading from "../../assets/shopload.json";
const Offers = () => {
  const shopId = localStorage.getItem("shopId");
  const [offers, setOffers] = useState([]);
  const [newOfferName, setNewOfferName] = useState("");
  const [newOfferFiles, setNewOfferFiles] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch existing offers
  useEffect(() => {
    async function fetchOffers() {
      if (!shopId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("ShopOffers")
        .eq("id", shopId)
        .single();

      if (error) {
        console.error("Error fetching offers:", error);
      } else {
        setOffers(data?.ShopOffers || []);
      }
      setLoading(false);
    }
    fetchOffers();
  }, [shopId]);

  // ✅ Add Offer
  const handleAddOffer = async (files, shopId) => {
    if (!files || files.length === 0) {
      alert("Please select at least one image!");
      return;
    }
    if (!shopId) {
      alert("No shopId found. Please login again.");
      return;
    }
    if (!newOfferName.trim()) {
      alert("Please enter an offer name!");
      return;
    }

    try {
      const { data: shopData, error: fetchError } = await supabase
        .from("shops")
        .select("ShopOffers")
        .eq("id", shopId)
        .single();
      if (fetchError) throw fetchError;

      const existingOffers = shopData?.ShopOffers || [];
      const fileArray = Array.from(files);

      const uploadedOffers = await Promise.all(
        fileArray.map(async (file) => {
          const fileName = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("ShopOffers")
            .upload(fileName, file);
          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("ShopOffers")
            .getPublicUrl(fileName);

          return {
            img: data.publicUrl,
            name: newOfferName,
            fileName,
          };
        })
      );

      const updatedOffers = [...existingOffers, ...uploadedOffers];
      const { error: updateError } = await supabase
        .from("shops")
        .update({ ShopOffers: updatedOffers })
        .eq("id", shopId);
      if (updateError) throw updateError;

      setOffers(updatedOffers);
      setNewOfferFiles(null);
      setNewOfferName("");
    } catch (error) {
      console.error("Upload failed:", error.message);
      alert("Error uploading offers: " + error.message);
    }
  };

  // ✅ Remove Offer
  const handleRemoveOffer = async (index) => {
    const offerToRemove = offers[index];
    if (!offerToRemove) return;

    const { error: deleteError } = await supabase.storage
      .from("ShopOffers")
      .remove([offerToRemove.fileName]);

    if (deleteError) {
      // console.error("❌ Storage delete failed:", deleteError);
      alert("Error deleting from bucket: " + deleteError.message);
      return;
    }

    const updatedOffers = offers.filter((_, i) => i !== index);
    const { error: updateError } = await supabase
      .from("shops")
      .update({ ShopOffers: updatedOffers })
      .eq("id", shopId);

    if (updateError) {
      console.error("❌ DB update failed:", updateError);
      alert("Database update failed.");
      return;
    }

    setOffers(updatedOffers);
  };

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Offers</h3>
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Offer name"
            value={newOfferName}
            onChange={(e) => setNewOfferName(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewOfferFiles(e.target.files)}
          />
          <button
            className={styles.addBtn}
            onClick={() => handleAddOffer(newOfferFiles, shopId)}
          >
            + Add Offers
          </button>
        </div>
      </div>

      {loading ? (
          <div className={styles.loadingText}>  <Lottie
          animationData={Loading}
          loop
          autoplay
        /></div>
      ) : offers.length === 0 ? (
        <div className={styles.emptyState}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/5951/5951752.png"
            alt="No offers"
            className={styles.emptyImage}
          />
          <h2>No offers yet</h2>
          <p>Add some exciting offers to attract customers!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {offers.map((offer, index) => (
            <div key={index} className={styles.card}>
              <img src={offer.img} alt={offer.name} className={styles.image} />
              <div className={styles.cardContent}>
                <h4>{offer.name}</h4>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemoveOffer(index)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Offers;
