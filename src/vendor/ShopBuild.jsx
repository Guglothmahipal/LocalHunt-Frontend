import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from '../vendor/ShopBuild.module.css';
import { supabase } from '../supabaseClient';
import { TbHomeCog, TbCategoryFilled } from "react-icons/tb";
import { BiCurrentLocation } from "react-icons/bi";
// Fix for default markers in react-leaflet
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { FaStore } from "react-icons/fa";
import { MdMail } from 'react-icons/md';
import { IoIosContact } from 'react-icons/io';
import { CiTimer } from 'react-icons/ci';
import { FaLocationDot } from "react-icons/fa6";
import Lottie from "lottie-react";
import animationData from "../assets/LottieAnimations/shopBuilding.json";
import ScrollContainer from '../components/ScrollContainer';
import { useAuth } from '../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';

// Crop utility functions
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', error => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg');
    });
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetina,
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
});

// New component to handle map re-centering
const MapUpdater = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom(), { duration: 1.0 });
        }
    }, [position, map]);
    return null;
};

// Map click handler and drag handler component
function MapEventHandler({ onMapClick }) {
    const map = useMap();
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

const ShopBuild = () => {
    const [formData, setFormData] = useState({
        shopName: '',
        shopImage: null,
        shopLocation: '',
        shopRating: '',
        shopTags: [],
        shopcategory: '',
        shopEmail: '',
        shopContact: '',
        shopStatus: 'Open',
        openingTime: '',
        closingTime: ''
    });

    // Add the missing state variables
    const [selectedImage, setSelectedImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [croppedBlob, setCroppedBlob] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const OPENCAGE_KEY = "cf18c213c9174d8ea4b09def10ca0468";
    const [position, setPosition] = useState([17.4065, 78.4772]); // Default position to Hyderabad
    const [coordinates, setCoordinates] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const fileInputRef = useRef(null);
    const mapRef = useRef(null);
    const suggestionBoxRef = useRef(null);
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const tagOptions = [
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


    const categoryOptions = ["Food & Beverages", "Clothing & Accessories", "Home & Furniture", "Electronics & Technology", "Health & Medical", "Toys & Self-Care", "Automobile & Transport", "Construction & Industrial"];
    const [displayText, setDisplayText] = useState("");
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [locating, setLocating] = useState(false);
    const placeholders = [
        "Jai Solutions",
        "Varma",
        "Mega Mart",
        "Fresh Choice",
        "City Bazaar",
    ];

    // Crop completion handler
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                suggestionBoxRef.current &&
                !suggestionBoxRef.current.contains(event.target)
            ) {
                setLocationSuggestions([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (formData.shopName) return;

        const currentWord = placeholders[placeholderIndex];
        let typingSpeed = isDeleting ? 30 : 50;

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                setDisplayText(currentWord.substring(0, charIndex + 1));
                setCharIndex((c) => c + 1);

                if (charIndex + 1 === currentWord.length) {
                    setTimeout(() => setIsDeleting(true), 500);
                }
            } else {
                setDisplayText(currentWord.substring(0, charIndex - 1));
                setCharIndex((c) => c - 1);

                if (charIndex - 1 === 0) {
                    setIsDeleting(false);
                    setPlaceholderIndex((i) => (i + 1) % placeholders.length);
                }
            }
        }, typingSpeed);

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, placeholderIndex, formData.shopName]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const newPosition = [lat, lng];
                    setPosition(newPosition);
                    setCoordinates(newPosition);
                    reverseGeocode(lat, lng);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setPosition([17.4065, 78.4772]);
                    setCoordinates([17.4065, 78.4772]);
                }
            );
        }
    }, []);

    const handleUseMyLocation = () => {
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPosition = [latitude, longitude];
                setPosition(newPosition);
                setCoordinates(newPosition);

                if (mapRef.current) {
                    mapRef.current.flyTo(newPosition, 18, { duration: 1.2 });
                }

                reverseGeocode(latitude, longitude);
                setLocating(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                setLocating(false);
            }
        );
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            shopTags: checked
                ? [...prev.shopTags, value]
                : prev.shopTags.filter(tag => tag !== value)
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async () => {
        try {
            if (selectedImage && croppedAreaPixels) {
                const blob = await getCroppedImg(selectedImage, croppedAreaPixels);
                setCroppedBlob(blob);
                setImagePreview(URL.createObjectURL(blob));
                setShowCropper(false);

                // Update form data with the cropped image
                setFormData(prev => ({ ...prev, shopImage: blob }));
            }
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                setFormData(prev => ({ ...prev, shopLocation: data.results[0].formatted }));
            }
        } catch (error) {
            console.error('Error during reverse geocoding:', error);
        }
    };

    const forwardGeocode = async (query) => {
        try {
            const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_KEY}&limit=5`
            );
            const data = await response.json();
            if (data.results) {
                const suggestions = data.results.map(r => ({
                    place_id: r.annotations.geohash || r.geometry.lat + ',' + r.geometry.lng,
                    display_name: r.formatted,
                    lat: r.geometry.lat,
                    lon: r.geometry.lng,
                }));
                setLocationSuggestions(suggestions);
            }
        } catch (error) {
            console.error('Error during forward geocoding:', error);
        }
    };

    const debounce = (func, delay) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const debouncedForwardGeocode = useCallback(debounce(forwardGeocode, 300), []);

    const handleLocationInputChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, shopLocation: value }));
        if (value.length > 2) {
            debouncedForwardGeocode(value);
        } else {
            setLocationSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        const newPosition = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)];
        setPosition(newPosition);
        setCoordinates(newPosition);
        setFormData(prev => ({ ...prev, shopLocation: suggestion.display_name }));

        if (mapRef.current) {
            mapRef.current.flyTo(newPosition, 18, { duration: 1.0 });
        }

        setLocationSuggestions([]);
    };

    const highlightMatch = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, "<strong>$1</strong>");
    };

    const handleMapClick = (latlng) => {
        const newPosition = [latlng.lat, latlng.lng];
        setPosition(newPosition);
        setCoordinates(newPosition);
        reverseGeocode(latlng.lat, latlng.lng);

        if (mapRef.current) {
            mapRef.current.flyTo(newPosition, 18, { duration: 1.0 });
        }
    };

    const onMarkerDragEnd = (e) => {
        const latlng = e.target.getLatLng();
        const newPosition = [latlng.lat, latlng.lng];
        setPosition(newPosition);
        setCoordinates(newPosition);
        reverseGeocode(latlng.lat, latlng.lng);

        if (mapRef.current) {
            mapRef.current.flyTo(newPosition, 18, { duration: 0.8 });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage('');

        if (!user || user.user_type !== 'vendor') {
            setSubmitMessage('Error: You must be a vendor to create a shop.');
            setIsSubmitting(false);
            return;
        }

        try {
            let imageUrl = null;
            if (croppedBlob) {
                const fileExt = 'jpg'; // because you convert to jpeg in canvas
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('shop_images')
                    .upload(fileName, croppedBlob, { contentType: "image/jpeg" });
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('shop_images')
                    .getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }

            const shopData = {
                vendor_id: user.id,
                shopname: formData.shopName,
                shopimage: imageUrl,
                shoplocation: formData.shopLocation,
                shoprating: parseFloat(formData.shopRating) || 0,
                noofraters: 0,
                shopdistance: 0,
                shoptags: formData.shopTags,
                shopcategory: formData.shopcategory,
                shopemail: formData.shopEmail,
                shopcontact: formData.shopContact,
                shopitems: [],
                shoptimings: {
                    openingTime: formData.openingTime,
                    closingTime: formData.closingTime
                },
                shopstatus: formData.shopStatus,
                coordinates: coordinates.length === 2
                    ? [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
                    : null,
            };

            const { error: shopError } = await supabase.from('shops').insert([shopData]);
            if (shopError) throw shopError;

            // ✅ CRITICAL: Update vendor's shop_built status in Supabase
            const { error: vendorError } = await supabase
                .from('vendors')
                .update({ shop_built: true })
                .eq('id', user.id);

            if (vendorError) throw vendorError;

            setSubmitMessage('Shop created successfully!');

            // Update local user state
            const updatedUser = { ...user, shop_built: true };
            login(updatedUser, user.token);

            setTimeout(() => {
                navigate('/vendor-dashboard', { replace: true });
            }, 1000);

        } catch (error) {
            console.error('Error creating shop:', error);
            setSubmitMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.full_view}>
            <div className={styles.heading}>
                <h2>Hi User</h2>
                <h4 className={styles.build_caption}>Let's Build your Shop Profile <TbHomeCog></TbHomeCog> </h4>
            </div>
            <div>
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    className={styles.lottieAnime}
                />
            </div>
            <div className={`m-5 ${styles.shop_build_form}`}>
                <ScrollContainer>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.form_wrapper}>
                            <div className={styles.shopAndCategory}>
                                <div className="form-group">
                                    <label htmlFor="shopName">
                                        Shop Name <span className="text-danger">*</span>
                                    </label>

                                    <div className="input-group">
                                        <span className={`input-group-text ${styles.backico}`}>
                                            <FaStore className={styles.ico} />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="shopName"
                                            name="shopName"
                                            value={formData.shopName}
                                            onChange={handleInputChange}
                                            placeholder={formData.shopName ? "" : `eg. ${displayText}`}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={`form-group ${styles.form_group}`}>
                                    <label htmlFor="shopcategory">Categories <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className={`input-group-text ${styles.backico}`}>
                                            <TbCategoryFilled className={styles.ico} />
                                        </span>
                                        <select id="shopcategory" name="shopcategory" value={formData.shopcategory} onChange={handleInputChange} required>
                                            <option value="">Select a category</option>
                                            {categoryOptions.map(category => (<option key={category} value={category}>{category}</option>))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.shopAndCategory}>
                                <div className={`form-group ${styles.form_group}`}>
                                    <label htmlFor="shopEmail">Shop Email <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className={`input-group-text ${styles.backico}`}>
                                            <MdMail className={styles.ico} />
                                        </span>
                                        <input
                                            type="email"
                                            id="shopEmail"
                                            name="shopEmail"
                                            value={formData.shopEmail}
                                            onChange={handleInputChange}
                                            placeholder="eg. localhunt@gmail.com"
                                            className="form-control"
                                            required
                                            pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                            title="Please enter a valid email address"
                                        />
                                    </div>

                                </div>
                                <div className={`form-group ${styles.form_group}`}>
                                    <label htmlFor="shopContact">Shop Contact <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className={`input-group-text ${styles.backico}`}>
                                            <IoIosContact className={styles.ico} />
                                        </span>
                                        <input
                                            type="text"
                                            id="shopContact"
                                            name="shopContact"
                                            value={formData.shopContact}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, ''); // remove non-digits
                                                if (value.length <= 10) {
                                                    handleInputChange({
                                                        target: { name: 'shopContact', value }
                                                    });
                                                }
                                            }}
                                            placeholder="eg. 1234567890"
                                            className="form-control"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={`form-group ${styles.form_group}`}>
                                <label>Shop Specialities</label>
                                <div className={styles.checkbox_group}>
                                    {tagOptions.map(tag => (<label key={tag} className={styles.checkbox_label}><input type="checkbox" value={tag} checked={formData.shopTags.includes(tag)} onChange={handleCheckboxChange} />{tag}</label>))}
                                </div>
                            </div>
                            <div className={styles.shopAndCategory}>
                                <div className={`form-group ${styles.form_group}`}>
                                    <label htmlFor="openingTime">Shop Opening Time <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className={`input-group-text ${styles.backico}`}>
                                            <CiTimer className={styles.ico} />
                                        </span>
                                        <input type="time" id="openingTime" name="openingTime" value={formData.openingTime} onChange={handleInputChange} className='form-control' required />
                                    </div>
                                </div>
                                <div className={`form-group ${styles.form_group}`}>
                                    <label htmlFor="closingTime">Shop Closing Time <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className={`input-group-text ${styles.backico}`}>
                                            <CiTimer className={styles.ico} />
                                        </span>
                                        <input type="time" id="closingTime" name="closingTime" className='form-control' value={formData.closingTime} onChange={handleInputChange} required />
                                    </div>
                                </div>
                            </div>
                            <div className={`form-group ${styles.form_group}`}>
                                <label>Shop Image <span className="text-danger">*</span></label>
                                <div className={styles.drop_zone} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} required />
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className={styles.image_preview} />
                                    ) : (
                                        <p>Drag & drop an image here or click to browse</p>
                                    )}
                                </div>
                            </div>
                            <div className={`form-group ${styles.form_group}`}>
                                <div className={`form-group ${styles.form_group}`} ref={suggestionBoxRef}>
                                    <label htmlFor="shopLocation">Shop Location <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className={`input-group-text ${styles.backico}`}>
                                            <FaLocationDot className={styles.ico} />
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                id="shopLocation"
                                                name="shopLocation"
                                                className={styles.shopLocationInput}
                                                value={formData.shopLocation}
                                                onChange={handleLocationInputChange}
                                                placeholder="Type a location or click on the map"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={handleUseMyLocation}
                                                className={`btn btn-warning ${styles.useLocationButton}`}
                                                disabled={locating}
                                            >
                                                {locating ? (
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                ) : (
                                                    <BiCurrentLocation />
                                                )}
                                            </button>

                                        </div>
                                    </div>
                                    {locationSuggestions.length > 0 && (
                                        <ul className={styles.suggestions_list}>
                                            {locationSuggestions.map((suggestion) => (
                                                <li
                                                    key={suggestion.place_id}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightMatch(
                                                            suggestion.display_name,
                                                            formData.shopLocation
                                                        ),
                                                    }}
                                                />
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className={styles.map_container}>
                                    <MapContainer
                                        whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
                                        center={position}
                                        zoom={18}
                                        zoomControl={false}
                                        style={{ height: '300px', width: '100%' }}>
                                        <TileLayer
                                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
                                        />
                                        <TileLayer
                                            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
                                        />
                                        <TileLayer
                                            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                                            attribution="Labels &copy; Esri"
                                        />
                                        <Marker position={position} draggable={true} eventHandlers={{ dragend: onMarkerDragEnd }} />
                                        <MapEventHandler onMapClick={handleMapClick} />
                                        <MapUpdater position={position} />
                                    </MapContainer>
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className={`${styles.submit_button} btn`}>{isSubmitting ? 'Creating Shop...' : 'Create Shop'}</button>
                            {submitMessage && (<div className={`message ${submitMessage.includes('Error') ? 'error' : 'success'}`}>{submitMessage}</div>)}
                        </div>
                    </form>
                </ScrollContainer>

                {/* Cropper Modal */}
                {showCropper && (
                    <div className={styles.cropperModal}>
                        <div className={styles.cropperContent}>
                            <h3>Crop Your Shop Image</h3>
                            <div className={styles.cropperContainer}>
                                <Cropper
                                    image={selectedImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={2.14}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>
                            <div className={styles.zoomControls}>
                                <label>Zoom:</label>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className={styles.zoomSlider}
                                />
                            </div>
                            <div className={styles.cropperActions}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCropComplete}
                                >
                                    Crop & Save
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowCropper(false);
                                        setSelectedImage(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopBuild;