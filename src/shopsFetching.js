import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabase-client.js"; // ✅ importing your existing client

// Add your Google Places API key here or through an environment variable
const GOOGLE_API_KEY = "AIzaSyB3_-UqDrCY9ZAW78uzvG33SirHeYfTET0";

// Mapping your main categories to relevant Google search keywords
const CATEGORY_KEYWORDS = {
  "Food & Beverages": ["restaurant", "cafe", "bakery", "food"],
  "Clothing & Accessories": ["clothing store", "boutique", "shoe store", "fashion"],
  "Home & Furniture": ["furniture store", "home decor", "interior design"],
  "Electronics & Technology": ["electronics store", "mobile shop", "computer store"],
  "Health & Medical": ["pharmacy", "clinic", "hospital", "health store"],
  "Toys & Self-Care": ["toy store", "gift shop", "salon", "spa"],
  "Automobile & Transport": ["car repair", "auto parts", "bike shop", "fuel station"],
  "Construction & Industrial": ["hardware store", "construction supply", "paint store"]
};

async function getNearbyShops(lat, lng, radius = 2000, keyword = "store") {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function shopExists(shopname, shoplocation) {
  const { data, error } = await supabase
    .from("shops")
    .select("id")
    .eq("shopname", shopname)
    .eq("shoplocation", shoplocation)
    .maybeSingle();

  if (error) {
    console.error("Duplication check error:", error);
    return false;
  }

  return !!data;
}

async function insertShop(shop) {
  const { error } = await supabase.from("shops").insert([shop]);
  if (error) console.error("❌ Insert error:", error.message);
  else console.log(`✅ Inserted: ${shop.shopname}`);
}

async function scrapeAndUpload(lat, lng, radius = 2000, category, keywords) {
  console.log(`\n🔍 Fetching category: ${category}`);
  
  for (const keyword of keywords) {
    console.log(`  → Searching for "${keyword}"...`);
    const shops = await getNearbyShops(lat, lng, radius, keyword);

    for (const place of shops) {
      const shopname = place.name;
      const shoplocation = place.vicinity || "Unknown";
      const exists = await shopExists(shopname, shoplocation);

      if (exists) {
        console.log(`⚠️ Skipped duplicate: ${shopname}`);
        continue;
      }

      const shop = {
        id: uuidv4(),
        shopname,
        shopimage: place.photos
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
          : null,
        shoplocation,
        shoprating: place.rating || 0,
        noofraters: place.user_ratings_total || 0,
        shopdistance: 0,
        shoptags: place.types ? place.types.slice(0, 3) : [],
        Services: null,
        shopemail: null,
        shopcontact: null,
        shopitems: "[]",
        shopstatus: place.business_status || "Unknown",
        coordinates: [
          place.geometry.location.lat,
          place.geometry.location.lng
        ],
        shoptimings: null,
        vendor_id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isVerified: "No",
        visited: 0,
        shopcategory: category,
        ShopOffers: null,
        shopdescription: null,
        packups: null,
        packing_facility: null
      };

      await insertShop(shop);
    }
  }
}

async function runAllCategories() {
  const latitude = 18.4061;
  const longitude = 79.1792;
  const radius = 3000;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    await scrapeAndUpload(latitude, longitude, radius, category, keywords);
  }

  console.log("\n🎯 All categories processed successfully!");
}

runAllCategories().catch(console.error);
