import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage with validation
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        
        console.log("AuthProvider: Initializing auth from localStorage", {
          hasStoredUser: !!storedUser,
          hasStoredToken: !!storedToken
        });

        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          
          // ✅ Validate that we have minimum required data
          if ((userData.email || userData.phone) && userData.user_type) {
            console.log("AuthProvider: Valid user found in localStorage", userData);
            setUser(userData);
          } else {
            console.warn("AuthProvider: Invalid user data in localStorage, clearing");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
          }
        } else {
          console.log("AuthProvider: No valid auth data found in localStorage");
        }
      } catch (error) {
        console.error("AuthProvider: Error initializing auth:", error);
        // Clear corrupted data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
        console.log("AuthProvider: Initialization complete", { 
          user: !!user, 
          loading: false 
        });
      }
    };

    initializeAuth();
  }, []);

  // ✅ Enhanced login function with complete data fetch
  const login = async (userData, token = null) => {
    try {
      console.log("AuthProvider: Starting login process", userData);

      const finalToken = token || userData.token || "mock-token";
      
      // ✅ Ensure we have the basic required fields
      if (!userData.email && !userData.phone) {
        throw new Error("User data missing email/phone");
      }

      if (!userData.user_type) {
        throw new Error("User data missing user_type");
      }

      // ✅ Fetch complete user data from Supabase
      const completeUserData = await fetchCompleteUserData(
        userData.email || userData.phone, 
        userData.user_type
      );

      // Merge data
      const finalUserData = {
        id: completeUserData?.id || userData.id || userData.user_id,
        email: completeUserData?.email || userData.email,
        phone: completeUserData?.phone || userData.phone,
        user_type: completeUserData?.user_type || userData.user_type,
        token: finalToken,
        shop_built: completeUserData?.shop_built || userData.shop_built || false,
        auth_uid: completeUserData?.auth_uid || userData.id,
        full_name: completeUserData?.full_name || userData.full_name || "",
        avatar_url: completeUserData?.avatar_url || "",
        // Include all data
        ...completeUserData,
        ...userData
      };

      console.log("AuthProvider: Final user data to store", finalUserData);
      
      // Store in state and localStorage
      setUser(finalUserData);
      localStorage.setItem("user", JSON.stringify(finalUserData));
      localStorage.setItem("token", finalToken);

      return finalUserData;

    } catch (error) {
      console.error("AuthProvider: Login error, using fallback data", error);
      // Fallback with basic data - ensure minimum required fields
      const fallbackUserData = {
        ...userData,
        token: token || userData.token || "mock-token",
        shop_built: userData.shop_built || false
      };
      
      setUser(fallbackUserData);
      localStorage.setItem("user", JSON.stringify(fallbackUserData));
      if (token) {
        localStorage.setItem("token", token);
      }
      return fallbackUserData;
    }
  };

  // ✅ Fetch complete user data from Supabase
  const fetchCompleteUserData = async (identifier, userType) => {
    try {
      if (!identifier || !userType) return null;

      const tableName = userType === "vendor" ? "vendors" : "users";
      
      // Try to find by email first, then by phone
      let { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("email", identifier)
        .single();

      if (error || !data) {
        // If not found by email, try by phone
        ({ data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("phone", identifier)
          .single());
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("AuthProvider: Error fetching user data from Supabase:", error);
      return null;
    }
  };

  // Logout function
  const logout = () => {
    console.log("AuthProvider: Logging out user");
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("shopId");
  };

  // Update user function
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}