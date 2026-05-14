import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "./Inventory.module.css";
import Inventoryjson from "../../assets/Inventory.json";
import Lottie from "lottie-react";
import Loading from "../../assets/shopload.json";
// import Lottie from "lottie-react";
const Inventory = () => {
  const [shopId, setShopId] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemFile, setNewItemFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load shopId from localStorage
  useEffect(() => {
    const storedShopId = localStorage.getItem("shopId");
    console.log("Loaded shopId:", storedShopId);
    setShopId(storedShopId);
  }, []);

  // ✅ Fetch shop items
  useEffect(() => {
    if (!shopId) return;
    async function fetchItems() {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("shopitems")
        .eq("id", shopId)
        .single();

      if (error) {
        console.error("Error fetching items:", error);
      } else {
        const fetchedItems = data?.shopitems || [];
        setItems(fetchedItems);
        setFilteredItems(fetchedItems);
        const uniqueCategories = [
          ...new Set(fetchedItems.map((item) => item.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      }
      setLoading(false);
    }
    fetchItems();
  }, [shopId]);

  // ✅ Filter items when category changes
  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter((i) => i.category === selectedCategory));
    }
  }, [selectedCategory, items]);

  // ✅ Add new item with category
  const handleAddItem = async (files, shopId) => {
    if (!files?.length) {
      alert("Please select at least one image!");
      return;
    }
    if (!shopId) {
      alert("No shopId found. Please login again.");
      return;
    }
    if (!newItemName.trim() || !newItemCategory.trim()) {
      alert("Please enter both item name and category!");
      return;
    }

    try {
      const { data: shopData } = await supabase
        .from("shops")
        .select("shopitems")
        .eq("id", shopId)
        .single();

      const existingItems = shopData?.shopitems || [];
      const fileArray = Array.from(files);

      const uploadedItems = await Promise.all(
        fileArray.map(async (file) => {
          const fileName = `${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("ShopItems")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("ShopItems")
            .getPublicUrl(fileName);

          return {
            img: data.publicUrl,
            name: newItemName,
            category: newItemCategory,
            fileName,
          };
        })
      );

      const updatedItems = [...existingItems, ...uploadedItems];

      const { error: updateError } = await supabase
        .from("shops")
        .update({ shopitems: updatedItems })
        .eq("id", shopId);

      if (updateError) throw updateError;

      setItems(updatedItems);
      setNewItemFile(null);
      setNewItemName("");
      setNewItemCategory("");

      // Refresh category list
      const uniqueCategories = [
        ...new Set(updatedItems.map((item) => item.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Upload failed:", error.message);
      alert("Error uploading: " + error.message);
    }
  };

  // ✅ Remove item
  const handleRemove = async (index) => {
    const itemToRemove = filteredItems[index];
    if (!itemToRemove) return;

    const fileToDelete = itemToRemove.fileName;
    const { error: deleteError } = await supabase.storage
      .from("ShopItems")
      .remove([fileToDelete]);

    if (deleteError) {
      console.error("Storage delete failed:", deleteError);
      return;
    }

    const updatedItems = items.filter((i) => i.fileName !== fileToDelete);
    const { error: updateError } = await supabase
      .from("shops")
      .update({ shopitems: updatedItems })
      .eq("id", shopId);

    if (!updateError) {
      setItems(updatedItems);
    }
  };

  return (
    <div className={styles.inventoryContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Inventory</h3>
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Category"
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewItemFile(e.target.files)}
          />
          <button
            className={styles.addBtn}
            onClick={() => handleAddItem(newItemFile, shopId)}
          >
            + Add Items
          </button>

          {/* ✅ Filter Dropdown beside Add button */}
          <select
            className={styles.filterDropdown}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingText}>  <Lottie
          animationData={Loading}
          loop
          autoplay
        /></div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          {/* <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076507.png"

            alt="No items"
            className={styles.emptyImage}
          /> */}
            <Lottie
            className={styles.lottie}
                    animationData={Inventoryjson}
                    loop
                    autoplay
                  />
          <h2>No items in this category</h2>
          <p>Add some items to get started!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item, index) => (
            <div key={index} className={styles.card}>
              <img src={item.img} alt={item.name} className={styles.image} />
              <div className={styles.cardContent}>
                <h4>{item.name}</h4>
                <p className={styles.categoryText}>
                  Category: <strong>{item.category || "N/A"}</strong>
                </p>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(index)}
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

export default Inventory;
