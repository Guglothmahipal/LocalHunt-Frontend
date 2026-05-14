import {Link} from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import styles from "./Home.module.css";
import "../style.css";
// Fix for default markers in Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { FaMapMarkedAlt, FaSearchLocation, FaComment} from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import {supabase} from ".././supabaseClient";
import { Quote } from "lucide-react";

// Define custom location icon
const userLocationIcon = L.icon({
  iconUrl: '/girl1.png',   
  iconSize: [100, 100],             
  iconAnchor: [50, 70],           
  popupAnchor: [0, -35],         
});

// Fallback location (New York City coordinates as example)
const FALLBACK_LOCATION = [40.7128, -74.0060];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const bounceIn = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      damping: 10,
      stiffness: 100
    }
  }
};

// Animated component wrapper
const AnimatedSection = ({ children, variants = fadeInUp, className = "" }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const AnimatedStagger = ({ children, className = "" }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Skeleton Loading Component
const MapSkeleton = () => (
  <div className={styles.HomeshowMapSkeleton}>
    <div className={styles.HomeshowSkeletonPulse}></div>
    <div className={styles.HomeshowSkeletonContent}>
      <div className={styles.HomeshowSkeletonText}></div>
      <div className={styles.HomeshowSkeletonText}></div>
      <div className={styles.HomeshowSkeletonButton}></div>
    </div>
  </div>
);

function Home() {
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);

  // Refs to store map and marker instances
  const mapRef = useRef(null);
  const mobileMapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mobileUserMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  const [shops, setShops] = useState([]);
  const [testMonials, setTestMonials] = useState([]);

  // ✅ Fetch shops function
  const fetchShops = async () => {
    const { data, error } = await supabase
            .from("shops")
            .select("*")
            .order("shoprating", { ascending: false })
            .limit(6);
    if (error) {
      console.error("Error fetching shops:", error);
      return [];
    }
    return data;
  };

  // ✅ Fetch testimonials function
  const testMonialsData = async () => {
    const { data, error } = await supabase
            .from("Testimonials")
            .select("*")
            .order("stars", { ascending: false })
            .limit(6);
    if (error) {
      console.error("Error fetching testimonials:", error);
      return [];
    }
    return data;
  };

  // ✅ Fetch and set data
  useEffect(() => {
    const getShops = async () => {
      const data = await fetchShops();
      setShops(data);
    };
    
    const getTestmonials = async () => {
      const data = await testMonialsData();
      setTestMonials(data);
    };
    
    getShops();
    getTestmonials();
  }, []);

  const Services = [
    {
      name: "Medical Stores",
      icon: "fas fa-notes-medical",
      quote: "Stay Healthy Always",
    },
    {
      name: "Kiranam Stores",
      icon: "fas fa-shopping-basket",
      quote: "Essentials Every Day",
    },
    {
      name: "Furniture Stores",
      icon: "fas fa-couch",
      quote: "Comfort Meets Style",
    },
    {
      name: "Internet Centers",
      icon: "fas fa-wifi",
      quote: "Connect Without Limits",
    },
    {
      name: "Fashion Malls",
      icon: "fas fa-tshirt",
      quote: "Style That Speaks",
    },
  ];

  // Function to update user location on both maps
  const updateUserLocation = (position) => {
    const newCoords = [position.coords.latitude, position.coords.longitude];
    setUserLocation(newCoords);
    setUsingFallbackLocation(false);

    // Update desktop map
    if (mapRef.current) {
      mapRef.current.setView(newCoords, mapRef.current.getZoom());

      // Update or create user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(newCoords);
      } else {
        userMarkerRef.current = L.marker(newCoords, { icon: userLocationIcon })
          .addTo(mapRef.current)
          .openPopup();
      }
    }

    // Update mobile map
    if (mobileMapRef.current) {
      mobileMapRef.current.setView(newCoords, mobileMapRef.current.getZoom());

      // Update or create mobile user marker
      if (mobileUserMarkerRef.current) {
        mobileUserMarkerRef.current.setLatLng(newCoords);
      } else {
        mobileUserMarkerRef.current = L.marker(newCoords, { icon: userLocationIcon })
          .addTo(mobileMapRef.current)
          .openPopup();
      }
    }
  };

  // Function to handle location tracking errors
  const handleLocationTrackingError = (error) => {
    console.warn("Location tracking error:", error);
    // Don't reinitialize for tracking errors, just log them
    // The fallback location is already set from getCurrentPosition
  };

  // Function to initialize maps with fallback location
  const initializeMaps = (userCoords, isFallback = false) => {
    setUserLocation(userCoords);
    setUsingFallbackLocation(isFallback);

    // -------- Desktop Map --------
    const mapElement = document.getElementById("HomeshowMap");
    if (mapElement && !mapRef.current) {
      const map = L.map("HomeshowMap", {
        center: userCoords,
        zoom: isFallback ? 12 : 16,
        // Disable all zoom controls and interactions
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: false,
        tap: false,
        touchZoom: false,
        zoomSnap: 0,
        zoomDelta: 0
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 30,
      }).addTo(map);

      // Add user marker
      userMarkerRef.current = L.marker(userCoords, { icon: userLocationIcon })
        .addTo(map)
        .openPopup();

      // Add sample shops (adjust coordinates based on whether it's fallback or real location)
      const shops = isFallback ? [
        { name: "Grocery Store", coords: [userCoords[0] + 0.01, userCoords[1] + 0.01] },
        { name: "Medical Shop", coords: [userCoords[0] - 0.01, userCoords[1] + 0.01] },
        { name: "Furniture Store", coords: [userCoords[0] + 0.01, userCoords[1] - 0.01] },
      ] : [
        { name: "Grocery Store", coords: [userCoords[0] + 0.001, userCoords[1] + 0.001] },
        { name: "Medical Shop", coords: [userCoords[0] - 0.001, userCoords[1] + 0.001] },
        { name: "Furniture Store", coords: [userCoords[0] + 0.001, userCoords[1] - 0.001] },
      ];

      shops.forEach((shop, i) => {
        setTimeout(() => {
          const marker = L.marker(shop.coords)
            .addTo(map)
            .bindTooltip(shop.name, {
              permanent: false,
              direction: "top",
              offset: [0, -10],
              className: styles.HomeshowShopTooltip,
            });
          marker.bindPopup(`<b>${shop.name}</b><br>Welcome to our store!`);
        }, i * 500);
      });

      mapRef.current = map;

      // Handle map resize
      const resizeHandler = () => map.invalidateSize();
      window.addEventListener("resize", resizeHandler);
    }

    // -------- Mobile Map --------
    const mobileMapElement = document.getElementById("HomeshowMapMobile");
    if (mobileMapElement && !mobileMapRef.current) {
      const mobileMap = L.map("HomeshowMapMobile", {
        center: userCoords,
        zoom: isFallback ? 10 : 15,
        // Disable all zoom controls and interactions
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: false,
        tap: false,
        touchZoom: false,
        zoomSnap: 0,
        zoomDelta: 0
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mobileMap);

      // Add user marker
      mobileUserMarkerRef.current = L.marker(userCoords, { icon: userLocationIcon })
        .addTo(mobileMap)
        .openPopup();

      // Add sample shops
      const mobileShops = isFallback ? [
        { name: "Grocery Store", coords: [userCoords[0] + 0.02, userCoords[1] + 0.02] },
        { name: "Medical Shop", coords: [userCoords[0] - 0.02, userCoords[1] + 0.02] },
      ] : [
        { name: "Grocery Store", coords: [userCoords[0] + 0.002, userCoords[1] + 0.002] },
        { name: "Medical Shop", coords: [userCoords[0] - 0.002, userCoords[1] + 0.002] },
      ];

      mobileShops.forEach((shop, i) => {
        setTimeout(() => {
          L.marker(shop.coords)
            .addTo(mobileMap)
            .bindTooltip(shop.name, {
              permanent: false,
              className: styles.HomeshowShopTooltip,
            });
        }, i * 500);
      });

      mobileMapRef.current = mobileMap;

      // Handle map resize
      const resizeHandler = () => mobileMap.invalidateSize();
      window.addEventListener("resize", resizeHandler);
    }

    // Finalize loading
    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
      if (mobileMapRef.current) mobileMapRef.current.invalidateSize();
      setMapLoading(false);
    }, 1000);
  };

  // Function to handle location errors and use fallback
  const handleLocationError = (error) => {
    console.warn("Location access denied or unavailable:", error);
    
    // Show a more user-friendly message
    if (error.code === error.PERMISSION_DENIED) {
      console.log("User denied location access. Using fallback location.");
    } else {
      console.log("Location unavailable. Using fallback location.");
    }
    
    // Use fallback location
    initializeMaps(FALLBACK_LOCATION, true);
    setMapError(false); // Don't show error since we have a fallback
  };

  useEffect(() => {
    // Fix Leaflet default icons
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl,
      iconUrl: iconUrl,
      shadowUrl: shadowUrl,
    });

    const initLocationTracking = () => {
      setMapLoading(true);
      setMapError(false);

      // Check if geolocation is available
      if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        initializeMaps(FALLBACK_LOCATION, true);
        return;
      }

      // First, try to get current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude];
          initializeMaps(userCoords, false);

          // Then start watching position for continuous updates
          watchIdRef.current = navigator.geolocation.watchPosition(
            updateUserLocation,
            handleLocationTrackingError, // Use the separate tracking error handler
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000, // Update every minute max
            }
          );
        },
        handleLocationError, // Use the error handler function for initial location
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    };

    // Initialize after DOM + animations settle
    const timer = setTimeout(() => {
      initLocationTracking();
    }, 800);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mobileMapRef.current) {
        mobileMapRef.current.remove();
        mobileMapRef.current = null;
      }
    };
  }, []);

  return (
    <>

      {/* ----------------------------- Hero Section ----------------------------- */}
      <section className={styles.HomeshowHero}>
        <div className={styles.HomeshowHeroContent}>
          <AnimatedSection variants={slideInLeft} className={styles.HomeshowHeroLeft}>
            <motion.h1
              className={styles.HomeshowHeroTitle}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Discover Local Shops Effortlessly
            </motion.h1>
            <motion.div
              className={styles.HomeshowHeroSubtitle}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Find nearby stores, hidden gems, and trusted vendors in seconds.
              {usingFallbackLocation && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.HomeshowFallbackNotice}
                >
                </motion.span>
              )}
            </motion.div>
            <Link to="/signupchoice" style={{textDecoration:"none"}}>
            <motion.button
              className={styles.HomeshowExploreBtn}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6, type: "spring" }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(255, 200, 0, 0.5)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              Start Exploring
            </motion.button>
            </Link>
            

            {/* Mobile Map - Visible only on mobile */}
            <div className={styles.HomeshowMobileMap}>
              <div className={styles.HomeshowMapWrapper}>
                {mapLoading && !mapError && <MapSkeleton />}
                {mapError && (
                  <div className={styles.HomeshowMapError}>
                    <p>Unable to load map. Please check your location permissions.</p>
                  </div>
                )}
                {usingFallbackLocation && (
                  <div className={styles.HomeshowFallbackBadge}>
                    Demo Mode
                  </div>
                )}
                <div
                  id="HomeshowMapMobile"
                  className={`${styles.HomeshowMap} ${mapLoading ? styles.HomeshowMapHidden : ''}`}
                ></div>
              </div>
            </div>

          </AnimatedSection>

          {/* Desktop Map - Hidden on mobile */}
          <AnimatedSection variants={slideInRight} className={styles.HomeshowHeroRight}>
            <motion.div
              className={styles.HomeshowMapWrapper}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {mapLoading && !mapError && <MapSkeleton />}
              {mapError && (
                <div className={styles.HomeshowMapError}>
                  <p>Unable to load map. Please check your location permissions.</p>
                </div>
              )}
              {usingFallbackLocation && (
                <div className={styles.HomeshowFallbackBadge}>
                  Demo Mode
                </div>
              )}
              <div
                id="HomeshowMap"
                className={`${styles.HomeshowMap} ${mapLoading ? styles.HomeshowMapHidden : ''}`}
              ></div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ----------------------------- Popular Shops Section ----------------------------- */}
      <section className={styles.HomeshowService}>
        <div className={styles.HomeshowContainer}>
          <motion.div
            className={styles.HomeshowPopularShops}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            You can explore
          </motion.div>
          <AnimatedStagger className={styles.HomeshowServiceGrid}>
            {Services.map((store, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className={styles.HomeshowServiceCard}
                whileHover={{
                  y: -15,
                  scale: 1.05,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                <div className={styles.HomeshowServiceIconContainer}>
                  <motion.i
                    className={`${store.icon} ${styles.HomeshowServiceIcon}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  ></motion.i>
                  <div className={styles.HomeshowOverlay}>
                    <span className={styles.HomeshowOverlayText}>{store.quote}</span>
                  </div>
                </div>
                <div className={styles.HomeshowServiceContent}>
                  <h6 className={styles.HomeshowServiceName}>{store.name}</h6>
                </div>
              </motion.div>
            ))}
          </AnimatedStagger>
        </div>
      </section>

      {/* ----------------------------- How It Works Section ----------------------------- */}
      <AnimatedSection className={styles.HomeshowSteps}>
        <motion.h2
          className={styles.HomeshowSectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        <AnimatedStagger className={styles.HomeshowStepCards}>
          {[
            { icon: <FaMapMarkedAlt />, text: "Locate nearby shops" },
            { icon: <FaSearchLocation />, text: "Explore categories" },
            { icon: <FaComment />, text: "Connect & Review" },
            { icon: <FiShoppingCart />, text: "Shop Smart" }
          ].map((step, index) => (
            <motion.div
              key={index}
              variants={bounceIn}
              className={styles.HomeshowStepCard}
              whileHover={{
                y: -10,
                transition: { type: "spring", stiffness: 300 }
              }}
            >
              <motion.div
                className={styles.HomeshowStepIcon}
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {step.icon}
              </motion.div>
              <h3>{step.text}</h3>
            </motion.div>
          ))}
        </AnimatedStagger>
      </AnimatedSection>

      {/* ----------------------------- Top Vendors Section ----------------------------- */}
      <AnimatedSection className={styles.HomeshowVendors}>
        <motion.h2
          className={styles.HomeshowSectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Top Rated Vendors Near You
        </motion.h2>
        <AnimatedStagger className={styles.HomeshowVendorGrid}>
          {shops.map((vendor, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className={styles.HomeshowVendorCard}
              whileHover={{
                y: -8,
                transition: { type: "spring", stiffness: 300 }
              }}
            >
              <h4 className={styles.HomeshowVendorName}>{vendor.shopname}</h4>
              <motion.div
                className={styles.HomeshowVendorRating}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                viewport={{ once: true }}
              >
                {"★".repeat(Math.round(vendor.shoprating))}{"☆".repeat(5 - Math.round(vendor.shoprating))}
              </motion.div>
              <p className={styles.HomeshowVendorCategory}>{vendor.shopcategory}</p>
            </motion.div>
          ))}
        </AnimatedStagger>
      </AnimatedSection>

      {/* ----------------------------- Testimonials Section ----------------------------- */}
      <AnimatedSection className={styles.HomeshowTestimonials}>
        <motion.h2
          className={styles.HomeshowSectionTitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          What Our Users Say
        </motion.h2>
        <AnimatedStagger className={styles.HomeshowTestimonialCards}>
          {testMonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className={styles.HomeshowTestimonialCard}
              whileHover={{
                y: -5,
                transition: { type: "spring", stiffness: 400 }
              }}
            >
              <motion.div
                className={styles.HomeshowTestimonialStars}
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.2, type: "spring" }}
                viewport={{ once: true }}
              >
               {"★".repeat(Math.round(testimonial.stars))}{"☆".repeat(5 - Math.round(testimonial.stars))}
              </motion.div>
              <div className={styles.HomeshowTestimonialText}>
                <div className="testimonial">
                  <span className="decorative-quote left">❛❛</span>
                  {testimonial.description}
                  <span className="decorative-quote right">❜❜</span>
                </div>
              </div>
              <div className={styles.HomeshowTestimonialAuthor}>
                <strong>{testimonial.username}</strong>
              </div>
            </motion.div>
          ))}
        </AnimatedStagger>
      </AnimatedSection>

      {/* ----------------------------- Final CTA Section ----------------------------- */}
      <AnimatedSection className={styles.HomeshowFinalCTA}>
        <motion.h2
          className={styles.HomeshowCTATitle}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Ready to Explore Your Neighborhood?
        </motion.h2>
        <Link to="/signupchoice">
        <motion.button
          className={styles.HomeshowCTABtn}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileHover={{
            scale: 1.1,
            transition: { type: "spring", stiffness: 400 }
          }}
          whileTap={{ scale: 0.9 }}
          transition={{ delay: 0.3, type: "spring" }}
          viewport={{ once: true }}
        >
          Get Started
        </motion.button>
        </Link>
      </AnimatedSection>
    </>
  );
}

export default Home;