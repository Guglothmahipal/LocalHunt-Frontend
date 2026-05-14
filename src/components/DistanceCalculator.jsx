import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const DistanceCalculator = ({ 
  destinationLat, 
  destinationLng 
}) => {
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Format distance based on value
  const formatDistance = (distanceInKm) => {
    const distanceInMeters = distanceInKm * 1000;
    
    if (distanceInMeters < 1000) {
      // Show in meters for distances under 1km
      return `${Math.round(distanceInMeters)} m`;
    } else {
      // Show in kilometers for distances 1km and above
      return `${distanceInKm.toFixed(1)} km`;
    }
  };

  // Get current location and calculate distance
  useEffect(() => {
    if (!destinationLat || !destinationLng) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        
        const calculatedDistance = calculateDistance(
          currentLat, 
          currentLng, 
          destinationLat, 
          destinationLng
        );
        
        setDistance(calculatedDistance);
        setLoading(false);
      },
      (error) => {
        setError('Location unavailable');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [destinationLat, destinationLng]);

  if (loading) {
    return <Skeleton width={80} height={16} />;
  }

  if (error) {
    return <span>Location unavailable</span>;
  }

  if (distance === null) {
    return <span>Location unavailable</span>;
  }

  return <span>{formatDistance(distance)} away</span>;
};

export default DistanceCalculator;