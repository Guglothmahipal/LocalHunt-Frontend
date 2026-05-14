import Search from "./Search";
import styles from "./ShopSearch.module.css";
import Dropdown from "react-bootstrap/Dropdown";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { MdOutlineAccessTime, MdOutlineLocationOn, MdTimer, MdTimeToLeave, MdVerified } from "react-icons/md";
import { FaHeart, FaStar, FaRegStickyNote } from "react-icons/fa";
import Footer from "../Footer";
import Offcanvas from "react-bootstrap/Offcanvas";
import Button from "react-bootstrap/Button";
import { supabase } from "../supabaseClient";
import { CiHeart, CiTimer } from "react-icons/ci";
import { FaTimeline } from "react-icons/fa6";
import { iconMapping } from "./IconTags";
import { useAuth } from "../context/AuthProvider";
import React from 'react';
import DistanceCalculator from "./DistanceCalculator";
import Skeleton,{SkeletonTheme} from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function ShopSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("query") || "";

  // -----------------------------
  // STATE
  // -----------------------------
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState("Rating (Highest)");
  const [choose, setChoosen] = useState("All");
  const [verify, setVerify] = useState("All");
  const [offer, setOffer] = useState("All");
  const [maxDistance, setMaxDistance] = useState(3);
  const [shopStatus, setShopStatus] = useState(undefined);
  const [checked, setChecked] = useState([]);
  const [shopDetails, setShopDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState("all available locations");
  const [userLocation, setUserLocation] = useState(null);
  const [serviceOffered, setServiceOffered] = useState(["All"]); // Start with "All" option

  // for mobile Offcanvas
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Skeleton loading count - adjust based on your typical number of shops
  const skeletonCount = 2;

  // Skeleton Loading Component
 const ShopCardSkeleton = () => (
  <SkeletonTheme baseColor="#fff3cd" highlightColor="#ffeeba">
    <div className="card mb-3 p-3 shadow-sm border rounded">
      <div className="row g-3 align-items-center flex-md-row flex-column">
        {/* Image Section Skeleton */}
        <div className="col-md-4 col-12 text-center">
          <Skeleton height={200} className="rounded" />
        </div>

        {/* Details Section Skeleton */}
        <div className="col-md-8 col-12">
          <div className="d-flex justify-content-between align-items-start">
            <Skeleton width={200} height={30} />
            <Skeleton circle width={30} height={30} />
          </div>

          <div className="d-flex align-items-center flex-wrap mb-2">
            <Skeleton width={80} height={25} className="me-2" />
            <Skeleton width={120} />
          </div>

          <div className="mb-2">
            <Skeleton width={80} height={20} className="me-1 mb-1" />
            <Skeleton width={70} height={20} className="me-1 mb-1" />
            <Skeleton width={90} height={20} className="me-1 mb-1" />
          </div>

          <div className="d-flex justify-content-between align-items-center flex-wrap mt-2">
            <Skeleton width={100} height={25} />
            <Skeleton width={120} height={40} />
          </div>
        </div>
      </div>
    </div>
  </SkeletonTheme>
);

  // Get user's current location once
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn("Unable to retrieve your location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  // Fetch unique services from Supabase - UPDATED: Handle array data
  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('Services')
        .not('Services', 'is', null);

      if (error) throw error;

      // Extract unique services from arrays and add "All" option
      const uniqueServices = ["All"];
      if (data && data.length > 0) {
        data.forEach(shop => {
          if (shop.Services && Array.isArray(shop.Services)) {
            shop.Services.forEach(service => {
              if (service && service.trim() !== "" && !uniqueServices.includes(service)) {
                uniqueServices.push(service);
              }
            });
          }
        });
      }

      setServiceOffered(uniqueServices);
      console.log("Available services from database:", uniqueServices);
    } catch (err) {
      console.error("Error fetching services:", err);
      // Fallback to static options if fetch fails
      setServiceOffered(["All", "Home service", "walk-in only", "Welder available"]);
    }
  }, []);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Function to fetch like status for all shops
  const fetchLikesForShops = useCallback(async (shopIds) => {
    const userId = getUserId();
    if (!userId || !shopIds?.length) return {};

    try {
      const { data, error } = await supabase
        .from("shop_likes")
        .select("shop_id, isLiked")
        .eq("user_id", userId)
        .in("shop_id", shopIds);

      if (error) throw error;

      const likesMap = {};
      data.forEach((like) => {
        likesMap[like.shop_id] = like.isLiked;
      });

      return likesMap;
    } catch (err) {
      console.error("Error fetching likes:", err);
      return {};
    }
  }, []);

  const fetchShops = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching shops with query:", query);

      let { data, error } = await supabase
        .from("shops")
        .select('*, coordinates')
        .order("shopname", { ascending: true });

      if (error) throw error;
      console.log("Total shops fetched:", data?.length);

      if (data && data.length > 0) {
        data.slice(0, 5).forEach((shop, index) => {
          console.log(`Shop ${index}: ${shop.shopname}`);
          console.log('Coordinates:', shop.coordinates);
          console.log('Services:', shop.Services); // Log services
          console.log('Services type:', typeof shop.Services);
          console.log('Services is array?', Array.isArray(shop.Services));
          console.log('Services array length:', shop.Services?.length);
          console.log('---');
        });
      }

      // ✅ If there's a search query, filter it at the Supabase level where possible
      if (query && query.trim() !== "") {
        const lowerQuery = query.toLowerCase();

        data = data.filter((shop) => {
          const nameMatch = shop.shopname?.toLowerCase().includes(lowerQuery);
          const locationMatch = shop.shoplocation?.toLowerCase().includes(lowerQuery);
          const tagsMatch =
            Array.isArray(shop.shoptags) &&
            shop.shoptags.some((tag) => tag.toLowerCase().includes(lowerQuery));
          const categoryMatch = shop.shopcategory?.toLowerCase().includes(lowerQuery);
          const emailMatch = shop.shopemail?.toLowerCase().includes(lowerQuery);
          const contactMatch = shop.shopcontact?.toLowerCase().includes(lowerQuery);

          // UPDATED: Services search - handle array
          const servicesMatch =
            Array.isArray(shop.Services) &&
            shop.Services.some((service) =>
              service?.toLowerCase().includes(lowerQuery)
            );

          return (
            nameMatch ||
            locationMatch ||
            tagsMatch ||
            categoryMatch ||
            servicesMatch
          );
        });
      }

      console.log("Filtered shops:", data);

      // Fetch like status for all shops
      if (data && data.length > 0) {
        const shopIds = data.map(shop => shop.id);
        const likesMap = await fetchLikesForShops(shopIds);

        // Merge shop data with like status
        const shopsWithLikes = data.map(shop => ({
          ...shop,
          isLiked: likesMap[shop.id] || "No" // Default to "No" if no like record exists
        }));

        setShopDetails(shopsWithLikes);
        setLocationName(query);
      } else {
        setShopDetails([]);
        setLocationName("No location");
      }
    } catch (err) {
      console.error("Error fetching shops:", err);
      setError(err.message);
      setShopDetails([]);
    } finally {
      setLoading(false);
    }
  }, [fetchLikesForShops]);

  useEffect(() => {
    // Fetch services when component mounts
    fetchServices();

    if (initialQuery !== null) {
      console.log("Running search for:", initialQuery);
      setSearchQuery(initialQuery);
      fetchShops(initialQuery);
    }
  }, [initialQuery, fetchShops, fetchServices]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromURL = params.get("category");

    if (categoryFromURL) {
      setChoosen(categoryFromURL);
    }
  }, [location.search]);

  // Handle search from the Search component
  const handleSearch = (query) => {
    console.log("Search triggered:", query);
    setSearchQuery(query);
    setLoading(true); // Show skeleton when searching
    fetchShops(query);
  };

  const { user } = useAuth();

  const getUserId = () => {
    if (user?.id) return user.id;
    if (user?.user_id) return user.user_id;
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      return storedUser?.id || storedUser?.user_id || null;
    } catch {
      return null;
    }
  };

  const toggleLike = async (shopId, currentStatus) => {
    const userId = getUserId();
    if (!userId) {
      alert("Please log in to like shops");
      return;
    }

    const newStatus = currentStatus === "Yes" ? "No" : "Yes";

    try {
      // Check if record exists for this user + shop
      const { data: existing, error: fetchError } = await supabase
        .from("shop_likes")
        .select("id, isLiked")
        .eq("shop_id", shopId)
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        if (newStatus === "No") {
          // DELETE the row completely when unliking
          const { error: deleteError } = await supabase
            .from("shop_likes")
            .delete()
            .eq("shop_id", shopId)
            .eq("user_id", userId);
          if (deleteError) throw deleteError;
        } else {
          // Update existing like status
          const { error: updateError } = await supabase
            .from("shop_likes")
            .update({ isLiked: newStatus })
            .eq("shop_id", shopId)
            .eq("user_id", userId);
          if (updateError) throw updateError;
        }
      } else {
        // Insert new like only when liking (not when unliking)
        if (newStatus === "Yes") {
          const { error: insertError } = await supabase
            .from("shop_likes")
            .insert([{ shop_id: shopId, user_id: userId, isLiked: newStatus }]);
          if (insertError) throw insertError;
        }
      }

      // Update local state instantly
      setShopDetails((prev) =>
        prev.map((shop) =>
          shop.id === shopId ? { ...shop, isLiked: newStatus } : shop
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err.message);
    }
  };


  const incrementVisited = async (shopId) => {
    try {
      // Get current visited count
      const { data, error } = await supabase
        .from("shops")
        .select("visited")
        .eq("id", shopId)
        .single();

      if (error) throw error;

      const newVisitedCount = (data.visited || 0) + 1;

      // Update visited count
      const { error: updateError } = await supabase
        .from("shops")
        .update({ visited: newVisitedCount })
        .eq("id", shopId);

      if (updateError) throw updateError;

      console.log(`Shop ${shopId} visited count incremented to ${newVisitedCount}`);
    } catch (err) {
      console.error("Error incrementing visited count:", err);
    }
  };

  // UPDATED: Categories to match your ShopBuild form
  const categories = [
    "All",
    "Food & Beverages",
    "Clothing & Accessories",
    "Home & Furniture",
    "Electronics & Technology",
    "Health & Medical", "Toys",
    "Automobile & Transport",
    "Construction & Industrial"
  ];

  const verifyVendors = ["All", "Yes", "No"];

  const specialities = [
  // 🛒 Food & Beverages
  "Butter & Ghee",
  "Cakes",
  "Beer",
  "Whiskey",
  "Wines",
  "Coffee",
  "Snacks",
  "Vegetables",
  "Fruits",
  "Affordable Price",

  // 👕 Clothing & Accessories
  "Bags",
  "Belts",
  "Casual Shoes",
  "Watches",
  "Hats",
  "Perfumes",
  "Skincare",
  "Makeup",
  "Ethnic Wear",
  "Gold",

  // 🛋️ Home & Furniture
  "Beds",
  "Bedsheets",
  "Curtains",
  "Sofas",
  "Tables",
  "Lighting",
  "Wall Art",
  "Mattresses",
  "Pillows",
  "Vases",

  // ⚡ Electronics & Technology
  "Camera",
  "Laptops",
  "Headphones",
  "Speakers",
  "Smartphones",
  "Chargers",
  "Microphones",
  "VR Sets",
  "Monitors",
  "Consoles",

  // 💊 Health & Medical
  "Cardio",
  "Yoga",
  "Medicines",
  "Supplements",
  "Diagnostics",
  "Consultations",
  "Health Drinks",
  "Organic Products",
  "First Aid",
  "Therapy",

  // 🎮 Toys
  "Action Figures",
  "Board Games",
  "Puzzles",
  "Soft Toys",
  "Outdoor Toys",
  "Souvenirs",
  "Decor Items",
  "Guitars",
  "Drums",
  "Comics",

  // 🚗 Automobile & Transport
  "Air Check",
  "Battery Check",
  "Engine Repair",
  "Tire Services",
  "Petrol",
  "Motorcycles",
  "Helmets",
  "Lubricants",
  "Scooters",
  "General Service",

  // 🏗️ Construction & Industrial
  "Bricks",
  "Cement",
  "Pipes",
  "Steel",
  "Drills",
  "Nails",
  "Screws",
  "Hand Tools",
  "Cargo",
  "Delivery"
];


  const getOpinion = (noOfRaters) => {
    if (noOfRaters > 1000) return "Marvelous";
    if (noOfRaters > 800) return "Excellent";
    if (noOfRaters > 400) return "Good";
    if (noOfRaters > 200) return "Nice";
    return "Average";
  };

  // -----------------------------
  // HANDLERS
  // -----------------------------
  const handleCheck = (e) => {
    const { value, checked: isChecked } = e.target;
    if (isChecked) setChecked((prev) => [...prev, value]);
    else setChecked((prev) => prev.filter((item) => item !== value));
  };

  const handleDistanceChange = (event) => {
    let val = event.target.value;
    if (event.target.type === "text") val = Number(val) || 0;
    setMaxDistance(val);
  };

  const minDistance = 1; // 1km
  const maxDistanceLimit = 50; // 50km
  const percentage = ((maxDistance - minDistance) / (maxDistanceLimit - minDistance)) * 100;

  // -----------------------------
  // FILTERING AND SORTING LOGIC - FIXED
  // -----------------------------
  const filteredAndSortedShops = useMemo(() => {
    console.log("Filtering and sorting shops...");
    console.log("Selected category:", choose);
    console.log("Selected service:", offer);
    console.log("All shops:", shopDetails);
    console.log("User location:", userLocation);
    console.log("Max distance filter:", maxDistance, "km");

    // Add fallbacks for missing data with PROPER category handling
    const updatedShops = shopDetails.map((shop) => ({
      id: shop.id,
      shopname: shop.shopname || "Unknown Shop",
      shoplocation: shop.shoplocation || "Unknown Location",
      shopimage: shop.shopimage || "https://via.placeholder.com/450x250",
      shoprating: shop.shoprating || 0,
      noofraters: shop.noofraters || 0,
      shoptags: shop.shoptags || [],
      shopcategory: shop.shopcategory || "Uncategorized",
      Services: Array.isArray(shop.Services) ? shop.Services : [], // Ensure Services is always an array
      isVerified: shop.isVerified || "No",
      isLiked: shop.isLiked || "No",
      coordinates: shop.coordinates || [],
      opinion: getOpinion(shop.noofraters || 0),
      shopTimings: shop.shoptimings,
      // Calculate distance if user location is available
      distance: userLocation && shop.coordinates && shop.coordinates.length >= 2
        ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          shop.coordinates[0],
          shop.coordinates[1]
        )
        : null
    }));

    console.log("Updated shops with distances:", updatedShops);

    let filteredShops = [...updatedShops];

    // FIXED: Category filtering logic
    if (choose !== "All") {
      filteredShops = filteredShops.filter((shop) => {
        const categoryMatch = shop.shopcategory?.toLowerCase() === choose.toLowerCase();
        const tagsMatch = shop.shoptags && shop.shoptags.some(tag =>
          tag.toLowerCase() === choose.toLowerCase()
        );
        const nameMatch = shop.shopname?.toLowerCase().includes(choose.toLowerCase());

        return categoryMatch || tagsMatch || nameMatch;
      });
      console.log(`After ${choose} filter:`, filteredShops);
    }

    // UPDATED: Service filtering logic - handle array matching
    if (offer !== "All") {
      filteredShops = filteredShops.filter((shop) => {
        return Array.isArray(shop.Services) && shop.Services.includes(offer);
      });
      console.log(`After ${offer} service filter:`, filteredShops);
    }

    // Distance filter - only apply if user location is available
    if (userLocation) {
      filteredShops = filteredShops.filter((shop) => {
        if (shop.distance === null) return false; // Exclude shops without coordinates
        return shop.distance <= maxDistance;
      });
      console.log(`After distance filter (${maxDistance}km):`, filteredShops);
    } else {
      console.log("User location not available, skipping distance filter");
    }

    if (verify !== "All") {
      filteredShops = filteredShops.filter((shop) => shop.isVerified === verify);
    }

    if (checked.length > 0) {
      filteredShops = filteredShops.filter((shop) =>
        checked.some((spec) => shop.shoptags.includes(spec))
      );
    }

    if (shopStatus !== undefined) {
      filteredShops = filteredShops.filter((shop) => shop.isOpen === shopStatus);
    }

    // FIXED: Enhanced sorting logic
    const sortedShops = [...filteredShops].sort((a, b) => {
      if (selected === "Rating (Highest)") {
        return b.shoprating - a.shoprating;
      }
      if (selected === "Rating (Lowest)") {
        return a.shoprating - b.shoprating;
      }
      if (selected === "Distance (Nearest)") {
        // Sort by actual distance if available
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        // Fallback to name if distance not available
        return a.shopname.localeCompare(b.shopname);
      }
      return 0;
    });

    console.log("Final filtered shops:", sortedShops);
    return sortedShops;
  }, [shopDetails, choose, verify, offer, checked, shopStatus, selected, userLocation, maxDistance]);

  // Show loading or error states
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="alert alert-danger" role="alert">
          <h5>Error loading shops</h5>
          <p>{error}</p>
          <button className="btn btn-warning" onClick={() => fetchShops()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      {/* HEADER */}
      <div className={`container-fluid d-flex justify-content-center ${styles.header} searchHomeBackground`}>
        <Search key="shopsearch-search" initialQuery={searchQuery} onSearch={handleSearch} />
      </div>

      <div className="container-fluid mt-3">
        <div className="row">
          {/* Sidebar Filters (desktop only) */}
          <div className="col-md-3 d-none d-md-block">
            <div className={`p-3 border rounded bg-light ${styles.filtersSticky}`}>
              <h5>Filters</h5>
              <p>Popular shops in {locationName}</p>

              {/* Filter info */}
              <div className="mb-2 p-2 bg-light border rounded">
                <small className="text-muted">
                  Total shops: {shopDetails.length}<br />
                  Filtered: {filteredAndSortedShops.length}<br />
                  {userLocation ? (
                    <span>📍 Location detected</span>
                  ) : (
                    <span className="text-warning">📍 Enable location for distance filter</span>
                  )}
                </small>
              </div>

              {/* Category Dropdown with Label */}
              <div className="mb-3">
                <label className="form-label fw-bold">Category</label>
                <Dropdown>
                  <Dropdown.Toggle className={`w-100 ${styles.dropDown}`}>
                    {choose}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {categories.map((categorie, index) => (
                      <Dropdown.Item
                        key={index}
                        active={choose === categorie}
                        onClick={() => setChoosen(categorie)}
                      >
                        {categorie}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Distance Slider */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Maximum Distance: {maxDistance} km
                  {!userLocation && <span className="text-warning ms-1">(Location required)</span>}
                </label>
                <div className="d-flex align-items-center">
                  <input
                    type="range"
                    value={maxDistance}
                    onChange={handleDistanceChange}
                    min={minDistance}
                    max={maxDistanceLimit}
                    step={1}
                    className={styles.range}
                    disabled={!userLocation}
                    style={{
                      background: `linear-gradient(to right, #ffc908 ${percentage}%, #e1e5e9 ${percentage}%)`,
                    }}
                  />
                  <input
                    type="text"
                    value={maxDistance}
                    onChange={handleDistanceChange}
                    className={styles.distance}
                    disabled={!userLocation}
                    style={{ width: "60px", marginLeft: "10px" }}
                  />
                  <span className="fw-bold ms-1">km</span>
                </div>
                <small className="text-muted">
                  {userLocation
                    ? `Showing shops within ${maxDistance} km of your location`
                    : "Enable location services to filter by distance"
                  }
                </small>
              </div>

              {/* Verified Vendors Dropdown with Label */}
              <div className="mb-3">
                <label className="form-label fw-bold">Verified Vendors</label>
                <Dropdown>
                  <Dropdown.Toggle className={`w-100 ${styles.dropDown}`}>
                    {verify}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {verifyVendors.map((verification, index) => (
                      <Dropdown.Item
                        key={index}
                        active={verify === verification}
                        onClick={() => setVerify(verification)}
                      >
                        {verification}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* UPDATED: Service Offered Dropdown with Label - Now Dynamic */}
              <div className="mb-3">
                <label className="form-label fw-bold">Service Offered</label>
                <Dropdown>
                  <Dropdown.Toggle className={`w-100 ${styles.dropDown}`}>
                    {offer}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    {serviceOffered.map((service, index) => (
                      <Dropdown.Item
                        key={index}
                        active={offer === service}
                        onClick={() => setOffer(service)}
                      >
                        {service}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Specialities */}
              <div>
                <p className="fw-bold mb-2">Speciality</p>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {specialities.map((spec) => (
                    <label key={spec} className="d-block mb-1">
                      <input
                        type="checkbox"
                        value={spec}
                        onChange={handleCheck}
                        className="me-2"
                      />
                      {spec}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Shops List */}
          <div className="col-md-9">
            {/* Mobile Hamburger Button */}
            <Button
              variant="outline-primary"
              className="d-md-none mb-3"
              onClick={handleShow}
            >
              ☰ Filters
            </Button>

            {/* UPDATED: Offcanvas Menu (mobile filters) with backdrop and close button */}
            <Offcanvas show={show} onHide={handleClose} placement="start" backdrop={true}>
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>Filters</Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <p>Popular shops in {locationName}</p>
                {/* Filter info */}
                <div className="mb-2 p-2 bg-light border rounded">
                  <small className="text-muted">
                    Total shops: {shopDetails.length}<br />
                    Filtered: {filteredAndSortedShops.length}<br />
                    Services available: {serviceOffered.length - 1}<br />
                    {userLocation ? (
                      <span>📍 Location detected</span>
                    ) : (
                      <span className="text-warning">📍 Enable location for distance filter</span>
                    )}
                  </small>
                </div>
                {/* Category Dropdown with Label */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Category</label>
                  <Dropdown>
                    <Dropdown.Toggle className={`w-100 ${styles.dropDown}`}>
                      {choose}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {categories.map((categorie, index) => (
                        <Dropdown.Item
                          key={index}
                          active={choose === categorie}
                          onClick={() => setChoosen(categorie)}
                        >
                          {categorie}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {/* Distance Slider */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Maximum Distance: {maxDistance} km
                    {!userLocation && <span className="text-warning ms-1">(Location required)</span>}
                  </label>
                  <div className="d-flex align-items-center">
                    <input
                      type="range"
                      value={maxDistance}
                      onChange={handleDistanceChange}
                      min={minDistance}
                      max={maxDistanceLimit}
                      step={1}
                      className={styles.range}
                      disabled={!userLocation}
                      style={{
                        background: `linear-gradient(to right, #ffc908 ${percentage}%, #e1e5e9 ${percentage}%)`,
                      }}
                    />
                    <input
                      type="text"
                      value={maxDistance}
                      onChange={handleDistanceChange}
                      className={styles.distance}
                      disabled={!userLocation}
                      style={{ width: "60px", marginLeft: "10px" }}
                    />
                    <span className="fw-bold ms-1">km</span>
                  </div>
                  <small className="text-muted">
                    {userLocation
                      ? `Showing shops within ${maxDistance} km of your location`
                      : "Enable location services to filter by distance"
                    }
                  </small>
                </div>

                {/* Verified Vendors Dropdown with Label */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Verified Vendors</label>
                  <Dropdown>
                    <Dropdown.Toggle className={`w-100 ${styles.dropDown}`}>
                      {verify}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {verifyVendors.map((verification, index) => (
                        <Dropdown.Item
                          key={index}
                          active={verify === verification}
                          onClick={() => setVerify(verification)}
                        >
                          {verification}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {/* UPDATED: Service Offered Dropdown with Label - Now Dynamic */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Service Offered</label>
                  <Dropdown>
                    <Dropdown.Toggle className={`w-100 ${styles.dropDown}`}>
                      {offer}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {serviceOffered.map((service, index) => (
                        <Dropdown.Item
                          key={index}
                          active={offer === service}
                          onClick={() => setOffer(service)}
                        >
                          {service}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {/* Specialities */}
                <div>
                  <p className="fw-bold mb-2">Speciality</p>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {specialities.map((spec) => (
                      <label key={spec} className="d-block mb-1">
                        <input
                          type="checkbox"
                          value={spec}
                          onChange={handleCheck}
                          className="me-2"
                        />
                        {spec}
                      </label>
                    ))}
                  </div>
                </div>

                {/* ADDED: Prominent close button at the bottom for mobile */}
                <div className="d-md-none mt-4 pt-3 border-top">
                  <button
                    className="btn btn-warning w-100 fw-bold"
                    onClick={handleClose}
                  >
                    Apply Filters & Close
                  </button>
                </div>
              </Offcanvas.Body>
            </Offcanvas>

            {/* Sorting */}
            <div className={`d-flex justify-content-between align-items-center mt-3 ${styles.sortingTab}`}>
              <p className="h5 m-0">
                {loading ? (
                  <Skeleton width={200} />
                ) : (
                  `${filteredAndSortedShops.length} shops in ${locationName}`
                )}
                {choose !== "All" && ` - Category: ${choose}`}
                {offer !== "All" && ` - Service: ${offer}`}
                {userLocation && ` - Within ${maxDistance} km`}
              </p>
              {loading ? (
                <Skeleton width={150} height={40} />
              ) : (
                <Dropdown>
                  <Dropdown.Toggle className={styles.dropDown}>{selected}</Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      active={selected === "Rating (Highest)"}
                      onClick={() => setSelected("Rating (Highest)")}
                    >
                      Rating (Highest)
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={selected === "Rating (Lowest)"}
                      onClick={() => setSelected("Rating (Lowest)")}
                    >
                      Rating (Lowest)
                    </Dropdown.Item>
                    <Dropdown.Item
                      active={selected === "Distance (Nearest)"}
                      onClick={() => setSelected("Distance (Nearest)")}
                    >
                      Distance (Nearest)
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>

            {/* Render Filtered Shops or Skeleton Loading */}
            <div className="mt-2">
              {loading ? (
                // Show skeleton loading
                Array.from({ length: skeletonCount }).map((_, index) => (
                  <ShopCardSkeleton key={index} />
                ))
              ) : filteredAndSortedShops.length > 0 ? (
                // Show actual shop cards
                filteredAndSortedShops.map((shop) => (
                  <div className="card mb-3 p-3 shadow-sm border rounded" key={shop.id}>
                    <div className="row g-3 align-items-center flex-md-row flex-column">
                      {/* Image Section */}
                      <div className="col-md-4 col-12 text-center">
                        <img
                          src={shop.shopimage}
                          alt={shop.shopname}
                          className="img-fluid rounded"
                          style={{ objectFit: "cover", height: "200px", width: "100%" }}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/300x200?text=Shop+Image";
                          }}
                        />
                      </div>

                      {/* Details Section */}
                      <div className="col-md-8 col-12">
                        <div className="d-flex justify-content-between align-items-start">
                          <h4 className="text-dark mb-0">
                            {shop.shopname}
                            {shop.isVerified === "Yes" && (
                              <span className="text-primary ms-1">
                                <MdVerified />
                              </span>
                            )}
                          </h4>
                          <button
                            className="btn p-0"
                            onClick={() => toggleLike(shop.id, shop.isLiked)}
                          >
                            {shop.isLiked === "Yes" ? (
                              <FaHeart className="text-danger fs-5" />
                            ) : (
                              <CiHeart className="fs-5" />
                            )}
                          </button>
                        </div>

                        <p className="text-muted mb-2">
                          <MdOutlineLocationOn className="text-danger" />{" "}
                          {shop.shoplocation}
                        </p>
                        <div className="d-flex align-items-center flex-wrap mb-2">
                          <span className="badge bg-warning text-dark me-2">
                            <FaStar className="text-dark" /> {shop.shoprating.toFixed(1)}
                          </span>
                          <small className="text-muted">
                            ({shop.noofraters} ratings) - <strong>{shop.opinion}</strong>
                          </small>
                        </div>

                        <div className="mb-2">
                          {shop.shoptags.map((tag, index) => {
                            const cleanTag = tag.trim();
                            const Icon = iconMapping[cleanTag] || FaRegStickyNote;
                            return (
                              <span
                                key={index}
                                className="badge bg-secondary me-1 mb-1 d-inline-flex align-items-center"
                              >
                                <Icon className="me-1" />
                                {tag}
                              </span>
                            );
                          })}
                        </div>

                        <div className="badge bg-warning text-dark mb-2">
                          <MdOutlineAccessTime className="me-1" />
                          Timings: {shop.shopTimings.openingTime}AM -
                          {shop.shopTimings.closingTime}PM
                        </div>

                        <div className="d-flex justify-content-between align-items-center flex-wrap mt-2">
                          {loading ? (
                            // Skeleton outside the badge
                            <Skeleton width={80} height={16} />
                          ) : (
                            <span className="badge bg-success text-light mb-2 mb-md-0">
                              {shop.coordinates &&
                                Array.isArray(shop.coordinates) &&
                                shop.coordinates.length >= 2 &&
                                shop.coordinates[0] != null &&
                                shop.coordinates[1] != null ? (
                                <DistanceCalculator
                                  destinationLat={shop.coordinates[0]}
                                  destinationLng={shop.coordinates[1]}
                                />
                              ) : (
                                <span>Location unavailable</span>
                              )}
                            </span>
                          )}

                          <button
                            className="btn btn-warning fw-bold"
                            onClick={() => {
                              incrementVisited(shop.id);
                              navigate(`/ShopPage/${shop.id}`);
                            }}
                          >
                            View Shop →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center mt-5 p-5">
                  <h4>No shops found</h4>
                  <p className="text-muted">
                    {searchQuery
                      ? `No shops found for "${searchQuery}"`
                      : shopDetails.length === 0
                        ? "No shops available in the database."
                        : `No shops found matching your filters. Try different categories or services.`}
                    {userLocation && maxDistance < 50 && (
                      <span> Try increasing the distance range.</span>
                    )}
                  </p>
                  {choose !== "All" && (
                    <button className="btn btn-warning mt-2" onClick={() => setChoosen("All")}>
                      Show All Categories
                    </button>
                  )}
                  {offer !== "All" && (
                    <button className="btn btn-warning mt-2 ms-2" onClick={() => setOffer("All")}>
                      Show All Services
                    </button>
                  )}
                  {userLocation && maxDistance < 50 && (
                    <button
                      className="btn btn-warning mt-2 ms-2"
                      onClick={() => setMaxDistance(50)}
                    >
                      Show All Distances
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ShopSearch;