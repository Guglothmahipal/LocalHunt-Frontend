// categoryIcons.js
import {
  // Grocery & Food
  FaAppleAlt, FaPepperHot, FaCheese, FaIceCream, FaBreadSlice, FaCoffee, FaOilCan,
  FaUtensils, FaBoxOpen, FaCandyCane, FaSeedling, FaBaby,

  // Fashion & Lifestyle
  FaTshirt, FaFemale, FaChild, FaShoePrints, FaShoppingBag, FaClock, FaGem,
  FaGlasses, FaRunning, FaSpa,

  // Home & Furniture
  FaCouch, FaBed, FaChair, FaBriefcase, FaBox, FaPaintBrush, FaLightbulb,


  // Electronics & Appliances
  FaMobileAlt, FaLaptop, FaTabletAlt,FaHeadphones, FaTv,
  FaCamera, FaBlender, FaSnowflake, FaHome, FaGamepad, FaPrint, FaBatteryFull,

  // Automobile & Transport
  FaCar, FaMotorcycle, FaBicycle, FaCogs, FaTools, FaGasPump, FaHardHat,
  FaMapMarkedAlt, FaVolumeUp, FaTaxi, FaTruckMoving,

  // Health & Medical
  FaCapsules, FaPrescriptionBottleAlt, FaDumbbell, FaPumpSoap, FaStethoscope,
  FaFirstAid, FaGlassWhiskey, FaLeaf, FaHeart, FaHospital, FaUserMd,

  // Books & Stationery
  FaBook, FaBookOpen, FaAtlas, FaNewspaper, FaTablet, FaPenFancy,
  FaPaintRoller, FaPuzzlePiece, FaMusic,

  // Pets & Animals
  FaBone, FaPaw, FaBath, FaTshirt as FaPetClothes, FaGamepad as FaPetToy,
  FaFish, FaFeather, FaSyringe, FaHandsHelping, FaSchool,

  // Industrial & Professional
  FaIndustry, FaBuilding, FaHammer, FaShieldAlt, FaFlask, FaBolt,
  FaBoxes, FaClipboard, FaPrint as FaBusinessPrint, FaBriefcase as FaConsulting,

  // Eco & Nature
  FaSeedling as FaEcoSeed, FaRecycle, FaSolarPanel, FaTint, FaLeaf as FaCompost,
  FaTree, FaPagelines, FaMortarPestle, FaFilter, FaWarehouse,

  // Travel & Services
  FaUmbrellaBeach, FaGlobe, FaPlane, FaBus, FaHotel, FaHome as FaHomestay,
  FaHiking, FaShip, FaShieldAlt as FaInsurance, FaPassport, FaGlassCheers,
  FaBroom, FaWrench, FaCameraRetro,
} from "react-icons/fa";

import { MdOutlineBed, MdWatch } from "react-icons/md";
import { BiSolidBlanket } from "react-icons/bi";
import { SiCodefresh } from "react-icons/si";

export const categoryIcons = {
  // 🛒 Grocery & Food
  "Fresh Produce": SiCodefresh,
  "Spices & Masalas": FaPepperHot,
  "Dairy, Cheese & Butter": FaCheese,
  "Frozen Foods & Ice Creams": FaIceCream,
  "Bakery & Breads": FaBreadSlice,
  "Beverages": FaCoffee,
  "Oils & Ghee": FaOilCan,
  "Rice, Atta & Pulses": FaUtensils,
  "Ready-to-Eat Meals": FaBoxOpen,
  "Packaged Snacks & Namkeen": FaBoxOpen,
  "Sweets & Chocolates": FaCandyCane,
  "Organic & Health Foods": FaSeedling,
  "Baby Food & Formula": FaBaby,

  // 👕 Fashion & Lifestyle
  "Men’s Clothing": FaTshirt,
  "Women’s Clothing": FaFemale,
  "Kids & Baby Wear": FaChild,
  "Footwear": FaShoePrints,
  "Accessories": FaShoppingBag,
  "Watches": FaClock,
  "Jewellery": FaGem,
  "Eyewear": FaGlasses,
  "Sportswear & Activewear": FaRunning,
  "Beauty & Grooming": FaSpa,

  // 🛋️ Home & Furniture
  "Living Room Furniture": FaCouch,
  "Bedroom Furniture": FaBed,
  "Kitchen & Dining Furniture": FaChair,
  "Office Furniture": FaBriefcase,
  "Storage Solutions": FaBox,
  "Home Decor": FaPaintBrush,
  "Lighting": FaLightbulb,
  "Carpets, Rugs & Curtains": BiSolidBlanket,
  "Bedding & Linen": MdOutlineBed,
  "Kitchenware & Cookware": FaBlender,

  // ⚡ Electronics & Appliances
  "Smartphones & Accessories": FaMobileAlt,
  "Laptops & Desktops": FaLaptop,
  "Tablets & E-Readers": FaTabletAlt,
  "Smart Watches & Wearables": MdWatch,
  "Audio Devices": FaHeadphones,
  "TVs & Home Entertainment": FaTv,
  "Cameras & Photography": FaCamera,
  "Kitchen Appliances": FaBlender,
  "Large Appliances": FaSnowflake,
  "Smart Home Devices": FaHome,
  "Gaming Consoles & Accessories": FaGamepad,
  "Printers & Scanners": FaPrint,
  "Power Banks & Chargers": FaBatteryFull,

  // 🚗 Automobile & Transport
  "Cars": FaCar,
  "Motorbikes & Scooters": FaMotorcycle,
  "Bicycles & E-Bikes": FaBicycle,
  "Spare Parts & Accessories": FaCogs,
  "Car Care & Maintenance": FaTools,
  "Oils & Lubricants": FaGasPump,
  "Helmets & Safety Gear": FaHardHat,
  "GPS & Navigation": FaMapMarkedAlt,
  "Car Audio Systems": FaVolumeUp,
  "Transport Services": FaTaxi,
  "Logistics & Courier": FaTruckMoving,

  // 💊 Health & Medical
  "Medicines": FaCapsules,
  "Vitamins & Supplements": FaPrescriptionBottleAlt,
  "Fitness Equipment": FaDumbbell,
  "Personal Care": FaPumpSoap,
  "Medical Devices": FaStethoscope,
  "First Aid Kits": FaFirstAid,
  "Health Drinks & Protein Powders": FaGlassWhiskey,
  "Ayurvedic & Herbal Products": FaLeaf,
  "Skincare & Dermatology": FaHeart,
  "Hospitals & Clinics": FaHospital,
  "Online Doctor Consultation": FaUserMd,

  // 📚 Books & Stationery
  "Academic Books": FaBook,
  "Fiction": FaBookOpen,
  "Non-Fiction": FaAtlas,
  "Children’s Books & Comics": FaChild,
  "Magazines & Journals": FaNewspaper,
  "E-Books & Subscriptions": FaTablet,
  "Office Stationery": FaPenFancy,
  "Art & Craft Supplies": FaPaintRoller,
  "Educational Toys & Kits": FaPuzzlePiece,
  "Music & Hobby Books": FaMusic,

  // 🐾 Pets & Animals
  "Pet Food": FaBone,
  "Pet Accessories": FaPaw,
  "Pet Grooming & Hygiene": FaBath,
  "Pet Clothing & Costumes": FaPetClothes,
  "Pet Toys": FaPetToy,
  "Aquarium Supplies": FaFish,
  "Bird Cages & Feeders": FaFeather,
  "Veterinary Medicines": FaSyringe,
  "Adoption & Rescue Services": FaHandsHelping,
  "Pet Training & Boarding": FaSchool,

  // 🏗️ Industrial & Professional
  "Machinery & Equipment": FaIndustry,
  "Construction Materials": FaBuilding,
  "Tools & Hardware": FaHammer,
  "Safety Equipment": FaShieldAlt,
  "Industrial Chemicals": FaFlask,
  "Electricals": FaBolt,
  "Packaging & Shipping": FaBoxes,
  "Office Supplies & Equipment": FaClipboard,
  "Printing & Advertising": FaBusinessPrint,
  "Business & Consulting": FaConsulting,

  // 🌱 Eco & Nature
  "Organic Products": FaEcoSeed,
  "Eco-Friendly Packaging": FaRecycle,
  "Solar Panels & Renewable": FaSolarPanel,
  "Rainwater Harvesting": FaTint,
  "Compost & Recycling": FaCompost,
  "Indoor Plants & Kits": FaTree,
  "Outdoor Plants & Seeds": FaPagelines,
  "Herbal Remedies": FaMortarPestle,
  "Water Purifiers & Filters": FaFilter,
  "Green Building Materials": FaWarehouse,

  // 🌍 Travel & Services
  "Domestic Travel Packages": FaUmbrellaBeach,
  "International Tours": FaGlobe,
  "Flights & Train Tickets": FaPlane,
  "Bus & Cab Bookings": FaBus,
  "Hotels & Resorts": FaHotel,
  "Holiday Rentals & Homestays": FaHomestay,
  "Adventure Travel": FaHiking,
  "Cruise Trips": FaShip,
  "Travel Insurance": FaInsurance,
  "Visa & Passport Services": FaPassport,
  "Event & Wedding Services": FaGlassCheers,
  "Cleaning & Home Services": FaBroom,
  "Repair & Maintenance": FaWrench,
  "Photography & Videography": FaCameraRetro,
};
