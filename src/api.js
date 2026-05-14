// src/api.js
// Shared frontend settings + phone normalization helper

export const API_BASE = "http://127.0.0.1:5000";

export function normalizePhoneClient(p) {
  if (!p) return "";
  let s = String(p).trim();

  // remove spaces, dashes, parentheses
  s = s.replace(/[()\s-]/g, "");

  // remove leading zeros
  s = s.replace(/^0+/, "");

  // if only digits and exactly 10 digits, assume India +91
  if (/^\d{10}$/.test(s)) {
    s = "+91" + s;
  } else if (/^\d+$/.test(s) && s.length > 0 && !s.startsWith("+")) {
    // if digits and includes country code but missing +
    s = "+" + s;
  }

  return s;
}
