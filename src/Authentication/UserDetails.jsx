import { useAuth } from "../context/AuthProvider";
import React, { useEffect } from "react";

export default function MyComponent() {
  const { user } = useAuth();

  useEffect(() => {
    // This will print the user object to the browser's console.
    // It will log whenever the user object changes (e.g., on login or logout).
    console.log("Current logged-in user:", user);
  }, [user]);

  return (
    <div>
      {/* You can also display the user's name or email on the page for visual debugging */}
      {user ? (
        <p>Logged in as: {user.email || user.full_name}</p>
      ) : (
        <p>Not logged in.</p>
      )}
    </div>
  );
}