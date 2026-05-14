// itemCategoryIconMapping.js
import {
  // 🛒 Grocery & Food
  FaAppleAlt, FaCoffee, FaBreadSlice, FaDrumstickBite, FaCheese,
  FaCocktail, FaWineBottle, FaBeer, FaShoppingBag, FaBirthdayCake,
  FaCookie, FaUtensils, FaTint as FaBottle,FaDollarSign,

  // 👕 Fashion & Lifestyle
  FaTshirt, FaShoePrints, FaRing, FaGem, FaSpa, FaClock,

  // 🛋️ Home & Furniture
  FaCouch, FaHome, FaBed, FaLightbulb, FaPaintBrush, FaTable, FaChair,

  // ⚡ Electronics & Appliances
  FaTv, FaMobileAlt, FaLaptop, FaCamera, FaHeadphones, FaGamepad,
  FaVrCardboard, FaBolt, FaKeyboard, FaDesktop, FaMicrophone,

  // 🚗 Automobile & Transport
  FaCar, FaMotorcycle, FaGasPump, FaTools, FaBatteryFull, FaHardHat,
  FaBicycle, FaOilCan, FaWind, FaCircle,

  // 💊 Health & Medical
  FaCapsules, FaBriefcaseMedical, FaClinicMedical, FaStethoscope,
  FaDumbbell, FaSyringe, FaUserMd, FaAmbulance, FaHospital,

  // 📚 Books, Stationery & Hobbies
  FaBook, FaPenFancy, FaMusic, FaGuitar, FaGift, FaPuzzlePiece,
  FaFolder, FaFileAlt, FaPrint, FaTint,

  // 🐾 Pets & Animals
  FaDog, FaCat, FaFish, FaBone, FaTree, FaFilter,

  // 🏗️ Industrial & Professional
  FaHammer, FaIndustry, FaBuilding, FaTruckLoading, FaTruck,

  // 🌱 Eco & Nature
  FaLeaf, FaRecycle, FaSeedling,

  // 🌍 Travel & Services
  FaGlobe, FaMapMarkedAlt, FaPlane, FaHotel, FaSuitcaseRolling, FaTicketAlt,

  // Miscellaneous
  FaBoxOpen
} from "react-icons/fa";

import { MdVerified } from "react-icons/md";
//Icon Tags
export const iconMapping = {
  // 🛒 Grocery & Food
  "Food Grains": FaShoppingBag,
  "Beverages": FaCoffee,
  "Snacks": FaAppleAlt,
  "Household Essentials": FaBoxOpen,
  "Rice & Pulses": FaShoppingBag,
  "Flours": FaBreadSlice,
  "Oils": FaBottle,
  "Sugar & Salt": FaShoppingBag,
  "Fruits": FaAppleAlt,
  "Vegetables": FaLeaf,
  "Leafy Greens": FaSeedling,
  "Herbs": FaLeaf,
  "Breads": FaBreadSlice,
  "Cakes": FaBirthdayCake,
  "Pastries": FaCookie,
  "Cookies": FaCookie,
  "Chicken": FaDrumstickBite,
  "Mutton": FaDrumstickBite,
  "Beef": FaDrumstickBite,
  "Cold Cuts": FaDrumstickBite,
  "Fish": FaFish,
  "Prawns": FaFish,
  "Crabs": FaFish,
  "Shellfish": FaFish,
  "Milk": FaCheese,
  "Cheese": FaCheese,
  "Paneer": FaCheese,
  "Butter & Ghee": FaCheese,
  "Starters": FaUtensils,
  "Main Course": FaUtensils,
  "Desserts": FaCookie,
  "Coffee": FaCoffee,
  "Tea": FaCoffee,
  "Sandwiches": FaBreadSlice,
  "Beer": FaBeer,
  "Cocktails": FaCocktail,
  "Whiskey": FaWineBottle,
  "Wines": FaWineBottle,
  "Vodka": FaWineBottle,
  "Rum": FaWineBottle,
  "Gin": FaWineBottle,

  // 👕 Fashion & Lifestyle
  "Men's Wear": FaTshirt,
  "Women's Wear": FaTshirt,
  "Kids' Wear": FaTshirt,
  "Ethnic Wear": FaTshirt,
  "Casual Shoes": FaShoePrints,
  "Formal Shoes": FaShoePrints,
  "Sports Shoes": FaShoePrints,
  "Sandals": FaShoePrints,
  "Gold": FaRing,
  "Silver": FaRing,
  "Diamond": FaGem,
  "Imitation": FaGem,
  "Bags": FaShoppingBag,
  "Belts": FaGem,
  "Hats": FaGem,
  "Watches": FaClock,
  "Makeup": FaSpa,
  "Perfumes": FaSpa,
  "Skincare": FaSpa,
  "Haircare": FaSpa,
  "Haircut": FaTools, // used FaTools instead of missing Scissors
  "Facial": FaSpa,
  "Shaving": FaTools,
  "Styling": FaSpa,
  "Massages": FaSpa,
  "Relaxation": FaSpa,
  "Therapy": FaSpa,

  // 🛋️ Home & Furniture
  "Sofas": FaCouch,
  "Beds": FaBed,
  "Tables": FaTable,
  "Chairs": FaChair,
  "Wall Art": FaPaintBrush,
  "Lighting": FaLightbulb,
  "Curtains": FaHome,
  "Vases": FaHome,
  "Mattresses": FaBed,
  "Bedsheets": FaBed,
  "Blankets": FaBed,
  "Pillows": FaBed,

  // ⚡ Electronics & Appliances
  "TVs": FaTv,
  "Refrigerators": FaBoxOpen,
  "Washing Machines": FaBoxOpen,
  "Microwaves": FaBoxOpen,
  "Smartphones": FaMobileAlt,
  "Chargers": FaBolt,
  "Cases": FaMobileAlt,
  "Earphones": FaHeadphones,
  "Laptops": FaLaptop,
  "Desktops": FaLaptop,
  "Keyboards": FaKeyboard,
  "Monitors": FaDesktop,
  "Camera": FaCamera,
  "Lenses": FaCamera,
  "Tripods": FaCamera,
  "Memory Cards": FaCamera,
  "Speakers": FaHeadphones,
  "Headphones": FaHeadphones,
  "Microphones": FaMicrophone,
  "Amplifiers": FaHeadphones,
  "Consoles": FaGamepad,
  "Games": FaGamepad,
  "Controllers": FaGamepad,
  "VR Sets": FaVrCardboard,

  // 🚗 Automobile & Transport
  "Sedans": FaCar,
  "SUVs": FaCar,
  "Hatchbacks": FaCar,
  "EV Cars": FaCar,
  "Motorcycles": FaMotorcycle,
  "Scooters": FaBicycle,
  "Helmets": FaHardHat,
  "Bike Accessories": FaTools,
  "Petrol": FaGasPump,
  "Diesel": FaGasPump,
  "Lubricants": FaOilCan,
  "Air Check": FaWind,
  "Engine Repair": FaTools,
  "Tire Services": FaCircle,
  "Battery Check": FaBatteryFull,
  "General Service": FaTools,

  // 💊 Health & Medical
  "Medicines": FaCapsules,
  "Supplements": FaCapsules,
  "First Aid": FaBriefcaseMedical,
  "OTC Products": FaCapsules,
  "General Checkups": FaStethoscope,
  "Diagnostics": FaClinicMedical,
  "Vaccinations": FaSyringe,
  "Consultations": FaUserMd,
  "Emergency": FaAmbulance,
  "Surgery": FaHospital,
  "Inpatient Care": FaHospital,
  "Organic Products": FaLeaf,
  "Health Drinks": FaLeaf,
  "Essential Oils": FaSpa,
  "Cardio": FaDumbbell,
  "Strength Training": FaDumbbell,
  "Yoga": FaSpa,

  // 📚 Books, Stationery & Hobbies
  "Novels": FaBook,
  "Comics": FaBook,
  "Magazines": FaBook,
  "Academic Books": FaBook,
  "Pens": FaPenFancy,
  "Notebooks": FaBook,
  "Markers": FaPenFancy,
  "Files": FaFolder,
  "Documents": FaFileAlt,
  "Guitars": FaGuitar,
  "Drums": FaMusic,
  "Violins": FaMusic,
  "Greeting Cards": FaGift,
  "Decor Items": FaGift,
  "Soft Toys": FaGift,
  "Souvenirs": FaGift, // kept only once
  "Action Figures": FaPuzzlePiece,
  "Board Games": FaPuzzlePiece,
  "Puzzles": FaPuzzlePiece,
  "Outdoor Toys": FaPuzzlePiece,
  "Printers": FaPrint,
  "Cartridges": FaTint,

  // 🐾 Pets & Animals
  "Pet Food": FaBone,
  "Leashes": FaDog,
  "Pet Toys": FaPuzzlePiece,
  "Pet Beds": FaBed,
  "Pet Vaccinations": FaSyringe,
  "Pet Checkups": FaStethoscope,
  "Pet Surgery": FaHospital,
  "Pet Medicines": FaCapsules,
  "Fish Tanks": FaFish,
  "Filters": FaFilter,
  "Aquarium Decor": FaTree,
  "Fish Food": FaFish,

  // 🏗️ Industrial & Professional
  "Nails": FaHammer,
  "Screws": FaHammer,
  "Drills": FaTools,
  "Hand Tools": FaTools,
  "Cement": FaIndustry,
  "Bricks": FaIndustry,
  "Pipes": FaIndustry,
  "Steel": FaIndustry,
  "Cargo": FaTruckLoading,
  "Courier": FaTruck,
  "Warehousing": FaTruck,
  "Delivery": FaTruck,

  // 🌱 Eco & Nature
  "Indoor Plants": FaTree,
  "Outdoor Plants": FaTree,
  "Seeds": FaSeedling,
  "Soil & Fertilizers": FaLeaf,
  "Organic Vegetables": FaLeaf,
  "Organic Fruits": FaAppleAlt,
  "Herbal Juices": FaLeaf,
  "Millets": FaLeaf,
  "Plastic Recycling": FaRecycle,
  "Paper Recycling": FaRecycle,
  "Electronics Recycling": FaRecycle,
  "Metal Recycling": FaRecycle,

  // 🌍 Travel & Services
  "Flight Tickets": FaPlane,
  "Hotel Booking": FaHotel,
  "Tour Packages": FaSuitcaseRolling,
  "Travel Insurance": FaTicketAlt,
  "Maps": FaMapMarkedAlt,
  "Guides": FaMapMarkedAlt,
  "Local Tours": FaMapMarkedAlt,

  // Miscellaneous
  "General Items": FaBoxOpen,
  "Mixed Products": FaBoxOpen,
  "Daily Use Goods": FaBoxOpen,
  "Essential Daily Store": FaLeaf,
  "Trusted": MdVerified,
  "Affordable Price": FaDollarSign,

};

