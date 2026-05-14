import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import styles from "./ShopProfile.module.css";
import ShopTags from "./Components/ShopTags";
import { FaCamera } from "react-icons/fa";
import Cropper from "react-easy-crop";
import UpdateMap from "./Components/UpdateMap";
import FeedbackListModal from "./Components/FeedBackList";

const getCroppedImg = async (imageSrc, cropPixels) => {
  const image = await new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = err => reject(err);
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Failed to crop"));
      else resolve(blob);
    }, "image/jpeg");
  });
};


export default function ShopDetails({ shopId }) {
  const [shop, setShop] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showFeedbackList, setShowFeedbackList] = useState(false);
  const togglePackingFacility = async () => {
    if (!shop) return;
    const newValue = shop.packing_facility === "Yes" ? "No" : "Yes";
    try {
      const { error } = await supabase
        .from("shops")
        .update({ packing_facility: newValue })
        .eq("id", shop.id);
      if (error) {
        alert("Failed to update packing facility: " + error.message);
      } else {
        setShop(prev => ({ ...prev, packing_facility: newValue }));
        setFormData(prev => ({ ...prev, packing_facility: newValue }));
        alert(`Packing facility set to ${newValue}`);
      }
    } catch (err) {
      alert("Error updating packing facility");
    }
  };


  useEffect(() => {
    async function fetchData() {
      if (!shopId) return;
      setLoading(true);
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .single();

      if (shopError) {
        setLoading(false);
        return;
      }
      setShop(shopData);
      setFormData(shopData);

      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", shopData.vendor_id)
        .single();

      if (vendorError) {
        setLoading(false);
        return;
      }
      setVendor(vendorData);
      setLoading(false);
    }
    fetchData();
  }, [shopId]);

  // Verification request logic
  const handleVerificationRequest = async () => {
    if (!vendor) return;
    setVerificationLoading(true);
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ verification_status: "pending" })
        .eq("id", vendor.id);
      if (error) {
        alert(" Failed to send verification request: " + error.message);
      } else {
        alert("Verification request sent successfully!");
        setVendor((prev) => ({ ...prev, verification_status: "pending" }));
      }
    } catch (error) {
      alert("Failed to send verification request");
    } finally {
      setVerificationLoading(false);
    }
  };

  // Image upload handling
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  // Crop callback
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Save crop and upload to Supabase
  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels || !shop) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (!croppedBlob || croppedBlob.size === 0) {
        alert("Cropped image is empty");
        return;
      }
      const fileName = `${shop.id}_${Date.now()}.jpg`;
      const filePath = `shop_images/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("shop_images")
        .upload(filePath, croppedBlob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from("shop_images")
        .getPublicUrl(filePath);
      if (publicUrlError) throw publicUrlError;
      const imageUrl = publicUrlData.publicUrl;

      // Update database
      await supabase.from("shops")
        .update({ shopimage: imageUrl })
        .eq("id", shop.id);

      setShop((prev) => ({ ...prev, shopimage: imageUrl }));
      setFormData((prev) => ({ ...prev, shopimage: imageUrl }));

      alert("Shop image updated!");
      setShowCropper(false);
    } catch (error) {
      alert("Failed to upload cropped image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Render verification status
  const renderVerificationStatus = () => {
    if (!vendor) return null;
    const status = vendor.verification_status;
    switch (status) {
      case "verified":
        return <span className={styles.verifiedText}>✅ Verified</span>;
      case "pending":
        return <span className={styles.pendingText}>⏳ Verification Pending</span>;
      case "rejected":
        return (
          <div className={styles.verificationStatus}>
            <span className={styles.rejectedText}>❌ Rejected</span>
            <button
              onClick={handleVerificationRequest}
              disabled={verificationLoading}
              className={styles.verifyButton}
            >
              {verificationLoading ? "Sending..." : "Request Again"}
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={handleVerificationRequest}
            disabled={verificationLoading}
            className={styles.verifyButton}
          >
            {verificationLoading ? "Sending..." : "Request Verification"}
          </button>
        );
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!shop || !vendor) return <div className={styles.error}>No profile found.</div>;
  const createdDate = new Date(shop.created_at).toLocaleDateString();

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Edit/save logic
  const handleEditToggle = () => setIsEditing(!isEditing);
  const handleSave = async () => {
    const { error: shopError } = await supabase
      .from("shops")
      .update({
        shopname: formData.shopname,
        shopcategory: formData.shopcategory,
        shopemail: formData.shopemail,
        shopcontact: formData.shopcontact,
      })
      .eq("id", shop.id);

    if (shopError) {
      alert("Failed to update details: " + shopError?.message);
    } else {
      alert("Shop details updated successfully!");
      setShop(formData);
      setIsEditing(false);
    }
  };
  const selectedVendorId = vendor?.id;
  const selectedVendorName = vendor?.full_name;
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>Shop Details</h2>
        <button
          className={styles.editButton}
          onClick={isEditing ? handleSave : handleEditToggle}
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      <div className={styles.first}>
        <div className={styles.imgContainer}>
          <img
            src={shop.shopimage || ""}
            alt="Shop"
            className={styles.shopimage}
            onError={e => (e.target.style.background = "#f8f8f8")}
          />
          <div className={styles.uploadContainer}>
            <label className={styles.uploadButton}>
              {uploading ? "Uploading..." : <FaCamera />}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>
        <div className={styles.shopDetails}>
          <div className={styles.one}>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Shop Name:</span>
              <input
                type="text"
                name="shopname"
                value={formData.shopname || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.detailInput}
              />
            </div>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Category:</span>
              <input
                type="text"
                name="shopcategory"
                value={formData.shopcategory || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.detailInput}
              />
            </div>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Created Date:</span>
              <input
                type="text"
                value={createdDate}
                disabled
                className={styles.detailInput}
              />
            </div>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Shop Location:</span>
              <input
                type="text"
                name="shoplocation"
                value={formData.shoplocation || ""}
                disabled
                className={styles.detailInput}
              />
            </div>
            <div className={styles.detailBlock}>
              <button className={styles.updateloc} onClick={() => setShowMapModal(true)}>
                Update Location
              </button>
              {showMapModal && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent}>
                    <UpdateMap />
                    <button className={styles.closeBtn} onClick={() => setShowMapModal(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={styles.two}>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Shop Email:</span>
              <input
                type="email"
                name="shopemail"
                value={formData.shopemail || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.detailInput}
              />
            </div>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Contact:</span>
              <input
                type="text"
                name="shopcontact"
                value={formData.shopcontact || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={styles.detailInput}
              />
            </div>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Verified:</span>
              <div className={styles.verificationContainer}>
                <span
                  className={
                    shop.isVerified === "Yes"
                      ? styles.verifiedValue
                      : styles.unverifiedValue
                  }
                >
                  {shop.isVerified}
                </span>
                {renderVerificationStatus()}
              </div>
            </div>
            <div className={styles.detailBlock}>
              <span className={styles.detailLabel}>Packing Facility:</span>
              <div className={styles.verificationContainer}>
                <span
                  className={
                    shop.packing_facility === "Yes"
                      ? styles.verifiedValue
                      : styles.unverifiedValue
                  }
                >
                  {shop.packing_facility || "No"}
                </span>
                <button onClick={togglePackingFacility} className={styles.verifyButton}>
                  Change
                </button>
              </div>
            </div>

            <div className={styles.detailBlock}>
              <div className={styles.verificationContainer}>
                <button onClick={() => setShowFeedbackList(true)} className={styles.viewFeedbackButton}>
                  View All Feedback
                </button>
                <FeedbackListModal
                  isOpen={showFeedbackList}
                  onClose={() => setShowFeedbackList(false)}
                  vendorId={shop.id}
                  vendorName={selectedVendorName}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      <div className={styles.vendorDetailsFull}>
      <div className={styles.ShopDetails2}>
        <ShopTags shopId={shop.id} tags={shop.shoptags || []} />
      </div>
      <div className={styles.section2}>
        <h3>Vendor Details</h3>
        <div className={styles.vendorDetails}>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Name:</span>
            <span className={styles.detailValue}>{vendor.full_name}</span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Email:</span>
            <span className={styles.detailValue}>{vendor.email}</span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Phone:</span>
            <span className={styles.detailValue}>{vendor.phone}</span>
          </div>
          <div className={styles.detailBlock}>
            <span className={styles.detailLabel}>Verification Status:</span>
            <span
              className={`${styles.detailValue} ${vendor.verification_status === "verified"
                ? styles.verifiedValue
                : vendor.verification_status === "pending"
                  ? styles.pendingValue
                  : styles.unverifiedValue
                }`}
            >
              {vendor.verification_status || "Not Requested"}
            </span>
          </div>
        </div>
        </div>
        <div className={styles.heroContainer}>
          <h4><b>Banner view for user</b></h4>
          <img
            src={shop.shopimage || ""}
            alt="Shop Banner Preview"
            className={styles.heroImage}
            onError={e => (e.target.style.background = "#f0f0f0")}
          />
          {/* Optionally, overlay details as seen by user */}
          <div className={styles.heroOverlay}>
            <h2 className={styles.heroTitle}>{shop.shopname}</h2>
            {/* Add rating, status, etc like your actual user view */}
          </div>
        </div>
      </div>
      {showCropper && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "300px",
              height: "300px",
              background: "#333",
            }}
          >
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={2.14}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />


          </div>
          <div style={{ marginTop: 20, display: "flex", gap: "10px" }}>
            <button
              onClick={() => setShowCropper(false)}
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCropSave}
              disabled={uploading}
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Save Crop"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
