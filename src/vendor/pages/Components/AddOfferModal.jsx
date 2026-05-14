import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
import styles from "./AddOfferModal.module.css";

const AddOfferModal = ({ onClose }) => {
  const shopId = localStorage.getItem("shopId");
  const [offerName, setOfferName] = useState("");
  const [offerFile, setOfferFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddOffer = async () => {
    if (!offerName.trim()) {
      alert("Please enter offer name!");
      return;
    }
    if (!offerFile) {
      alert("Please select an image!");
      return;
    }
    if (!shopId) {
      alert("Shop ID missing. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      // Fetch existing offers
      const { data: shopData, error: fetchError } = await supabase
        .from("shops")
        .select("ShopOffers")
        .eq("id", shopId)
        .single();
      if (fetchError) throw fetchError;

      const existingOffers = shopData?.ShopOffers || [];

      // Upload to bucket
      const fileName = `${Date.now()}-${offerFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ShopOffers")
        .upload(fileName, offerFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("ShopOffers")
        .getPublicUrl(fileName);

      const newOffer = {
        name: offerName,
        img: urlData.publicUrl,
        fileName,
      };

      // Update database
      const updatedOffers = [...existingOffers, newOffer];
      const { error: updateError } = await supabase
        .from("shops")
        .update({ ShopOffers: updatedOffers })
        .eq("id", shopId);

      if (updateError) throw updateError;

      alert("Offer added successfully!");
      onClose(); // Close modal after success
    } catch (error) {
      console.error("Error adding offer:", error.message);
      alert("Failed to add offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Add New Offer</h3>

        <input
          type="text"
          placeholder="Enter offer name"
          value={offerName}
          onChange={(e) => setOfferName(e.target.value)}
          className={styles.input}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOfferFile(e.target.files[0])}
          className={styles.input}
        />

        <div className={styles.actions}>
          <button onClick={handleAddOffer} disabled={loading}>
            {loading ? "Uploading..." : "Add Offer"}
          </button>
          <button onClick={onClose} className={styles.cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOfferModal;
