import React, { useState, useMemo, useCallback } from 'react';
import './corousel.css';
import { FaLocationDot} from "react-icons/fa6";
import { FaRegEdit, FaSearchLocation } from "react-icons/fa";
import { TiMessages } from "react-icons/ti";
import { GiBoxUnpacking } from "react-icons/gi";


const FRUITS = [
  { name: 'Location', color: '#B30000', icon: <FaLocationDot/> }, // A deep red
  { name: 'Vendor Registration', color: '#FCD700', icon: <FaRegEdit/> }, // A vibrant yellow
  { name: 'Smart Search', color: '#E30B5C', icon: <FaSearchLocation/> }, // A bright pink/magenta
  { name: 'Pre-Packaging', color: '#FF8C00', icon: <GiBoxUnpacking/> },
  { name: 'Chat-Vendor', color: '#E30B5C', icon: <TiMessages/> }, // A lively orange
];

// Helper to determine the background color based on the active fruit
const getBackgroundColor = (activeIndex) => {
  return '#ffffff'; // white background for About page integration
};

const FruitCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Helper to determine if a card is the *very next* or *very previous* to the active one
  const getCardPosition = useCallback((index) => {
    const total = FRUITS.length;
    const diff = index - activeIndex;

    // Standard cases
    if (diff === 0) return 'active';
    if (diff === 1) return 'next';
    if (diff === -1) return 'prev';

    // Looping cases (for a continuous look)
    if (activeIndex === 0 && index === total - 1) return 'prev'; // last item before first
    if (activeIndex === total - 1 && index === 0) return 'next'; // first item after last

    // All others are "hidden" and positioned far away.
    return 'hidden';
  }, [activeIndex]);

  // Handle slide movement (left/right clicks)
  const goToNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % FRUITS.length);
  };

  const goToPrev = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + FRUITS.length) % FRUITS.length);
  };

  // The main card click logic to navigate to a specific card
  const handleCardClick = (index, position) => {
    if (position === 'next') {
      goToNext();
    } else if (position === 'prev') {
      goToPrev();
    }
    // If 'active', do nothing, or you could add a primary action here
  };
  
  const currentBackgroundColor = useMemo(() => getBackgroundColor(activeIndex), [activeIndex]);

  return (
    <div className="carousel-wrapper" style={{ '--bg-color': currentBackgroundColor }}>
      <div className="carousel-container">
        {FRUITS.map((fruit, index) => {
          const position = getCardPosition(index);
          const isMainActive = position === 'active';

          return (
            <div
              key={fruit.name}
              className={`carousel-card ${position}`}
              style={{ backgroundColor: fruit.color }}
              onClick={() => handleCardClick(index, position)}
            >
              <div className="card-icon">{fruit.icon}</div>
              <div className="card-label">
                {/* The main active card shows the name horizontally */}
                {isMainActive ? (
                  <span className="main-title">{fruit.name}</span>
                ) : (
                  // Side cards show the name vertically
                  <span className="side-title">{fruit.name}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FruitCarousel;