import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import "./OfferCarousel.css";
import { useNavigate } from 'react-router-dom';

const OfferCarousel = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);
  const navigate = useNavigate();
  const totalOffers = offers.length;

  // --- Supabase Data Fetching (Unchanged from your last working version) ---
  useEffect(() => {
    async function fetchAllOffers() {
      setLoading(true);
      try {
        // Ensure shopimage is selected here to keep data structure consistent, 
        // even though we aren't displaying it.
        const { data, error } = await supabase
          .from("shops")
          .select("ShopOffers, shopname, shoplocation, id, shopstatus, shopimage");

        if (error) {
          console.error("❌ Error fetching shops:", error);
          setOffers([]);
        } else {
          const allOffers = [];
          data.forEach(shop => {
            if (!shop.ShopOffers) return;
            let shopOffers = shop.ShopOffers;
            if (typeof shopOffers === "string") {
              try {
                shopOffers = JSON.parse(shopOffers);
              } catch (parseError) {
                console.warn("⚠️ Could not parse ShopOffers JSON for shop:", shop.id, parseError);
                return;
              }
            }
            const processOffer = (offer) => {
              if (offer?.img || offer?.name) {
                allOffers.push({
                  ...offer,
                  shopName: shop.shopname,
                  shopLocation: shop.shoplocation,
                  shopId: shop.id,
                  shopStatus: shop.shopstatus,
                  shopLogo: shop.shopimage,
                });
              }
            };
            if (Array.isArray(shopOffers)) {
              shopOffers.forEach(processOffer);
            } else if (shopOffers && typeof shopOffers === 'object') {
              processOffer(shopOffers);
            }
          });
          setOffers(allOffers);
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
        setOffers([]);
      }
      setLoading(false);
    }
    fetchAllOffers();
  }, []);

  // --- Auto-slide, Carousel Logic, UI States (Unchanged) ---
  useEffect(() => {
    if (totalOffers > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalOffers);
      }, 3000);
    }
    return () => clearInterval(intervalRef.current);
  }, [totalOffers]);

  const handlePrev = () => {
    clearInterval(intervalRef.current);
    setCurrentIndex((prev) => (prev === 0 ? totalOffers - 1 : prev - 1));
  };

  const handleNext = () => {
    clearInterval(intervalRef.current);
    setCurrentIndex((prev) => (prev + 1) % totalOffers);
  };

  const getCardClass = (index) => {
    if (totalOffers === 0) return 'hidden';
    const prevIndex = (currentIndex - 1 + totalOffers) % totalOffers;
    const nextIndex = (currentIndex + 1) % totalOffers;
    if (index === currentIndex) return 'center';
    if (index === nextIndex) return 'right';
    if (index === prevIndex) return 'left';
    return 'hidden';
  };

  if (loading) {
    return (
      <div className="carousel-container">
        <p>Loading offers from all shops...</p>
      </div>
    );
  }

  if (!totalOffers) {
    return (
      <div className="carousel-container">
        <p>No active offers available from any shops.</p>
      </div>
    );
  }

  // --- Carousel Display with 3D Structure (MODIFIED) ---
  return (
    <div className="carousel-container">
      <div className="cards-wrapper">
        {offers.map((offer, index) => (
          <div
            key={offer.shopId + '-' + index}
            className={`offer-card ${getCardClass(index)}`}
            style={{
              backgroundImage: `url(${offer.img || 'https://via.placeholder.com/350x210/CCCCCC/888888?text=No+Image'})`,
            }}
            // <<< ADDED: Click handler is now on the main card DIV
            onClick={() => {
              navigate(`/ShopPage/${offer.shopId}`);
            }}
          >
            {/* <<< REMOVED: shop-logo-container and img element */}

            {/* Text on the card */}
            <div className="card-offer-title">
              {offer.name || "Special Offer"}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="navigation-controls">
        <button onClick={handlePrev} className="nav-button prev-button">
          &#8592; Prev
        </button>
        <button onClick={handleNext} className="nav-button next-button">
          Next &#8594;
        </button>
      </div>
    </div>
  );
};

export default OfferCarousel;