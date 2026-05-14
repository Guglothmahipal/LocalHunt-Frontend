import React, { useEffect, useState } from "react";
import {supabase} from "../../supabaseClient"
import styles from "./Offers.module.css"; 
import Lottie from "lottie-react";
import Loading from "../../assets/shopload.json";
const Services = () => {
  const shopId = localStorage.getItem("shopId");
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch existing services
  useEffect(() => {
    async function fetchServices() {
      if (!shopId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("Services")
        .eq("id", shopId)
        .single();

      if (error) {
        console.error("Error fetching services:", error);
      } else {
        setServices(data?.Services || []); // ✅ Correct case
      }
      setLoading(false);
    }
    fetchServices();
  }, [shopId]);

  // ✅ Add Service
  const handleAddService = async () => {
    if (!newService.trim()) {
      alert("Please enter a service name!");
      return;
    }

    try {
      // Fetch existing services
      const { data: shopData, error: fetchError } = await supabase
        .from("shops")
        .select("Services")
        .eq("id", shopId)
        .single();
      if (fetchError) throw fetchError;

      const existingServices = shopData?.Services || []; // ✅ Correct case
      const updatedServices = [...existingServices, newService.trim()];

      // Update Supabase
      const { error: updateError } = await supabase
        .from("shops")
        .update({ Services: updatedServices }) // ✅ Matches Supabase column
        .eq("id", shopId);

      if (updateError) throw updateError;

      setServices(updatedServices);
      setNewService("");
    } catch (error) {
      // console.error("❌ Error adding service:", error.message);
      alert("Error adding service: " + error.message);
    }
  };

  // ✅ Remove Service
  const handleRemoveService = async (index) => {
    const updatedServices = services.filter((_, i) => i !== index);

    const { error } = await supabase
      .from("shops")
      .update({ Services: updatedServices }) // ✅ Matches column name
      .eq("id", shopId);

    if (error) {
      // console.error("❌ Failed to remove service:", error);
      alert("Error removing service: " + error.message);
      return;
    }

    setServices(updatedServices);
  };

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Services</h3>
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Enter service name"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
          />
          <button className={styles.addBtn} onClick={handleAddService}>
            + Add Service
          </button>
        </div>
      </div>

      {loading ? (
          <div className={styles.loadingText}>  <Lottie
          animationData={Loading}
          loop
          autoplay
        /></div>
      ) : services.length === 0 ? (
        <div className={styles.emptyState}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/616/616408.png"
            alt="No services"
            className={styles.emptyImage}
          />
          <h2>No services listed yet</h2>
          <p>Add some services your shop offers!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {services.map((service, index) => ( // ✅ Correct variable
            <div key={index} className={styles.card}>
              <div className={styles.cardContent}>
                <h4>{service}</h4>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemoveService(index)}
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

export default Services;
