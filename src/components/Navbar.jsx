import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthProvider";
import logo from "../assets/logo-png.png";
import styles from "./Navbar.module.css";

function ModernNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.modernNavbar}>
      <div className={styles.modernNavbarContainer}>
        {/* Logo */}
        <Link
          className={styles.modernBrand}
          to={user.user_type === "vendor" ? "/vendor-dashboard" : "/user-dashboard"}
        >
          <img src={logo} alt="Logo" className={styles.modernLogo} />
          <span className={styles.modernTitle}>LocalHunt</span>
        </Link>

        {/* Hamburger Menu */}
        <button
          className={`${styles.modernToggler} ${isOpen ? styles.active : ''}`}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={styles.togglerIcon}></span>
        </button>

        {/* Links */}
        <div className={`${styles.modernNavMenu} ${isOpen ? styles.show : ""}`}>
          <ul className={styles.modernNavList}>
            <li>
              <Link
                to={user.user_type === "vendor" ? "/vendor-dashboard" : "/user-dashboard"}
                className={`${styles.modernNavLink} ${
                  isActive("/vendor-dashboard") || isActive("/user-dashboard")
                    ? styles.active
                    : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/FavouritePage"
                className={`${styles.modernNavLink} ${
                  isActive("/FavouritePage") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Favourites
              </Link>
            </li>
            <li>
              <Link
                to="/ShopSearch"
                className={`${styles.modernNavLink} ${
                  isActive("/ShopSearch") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Search Shops
              </Link>
            </li>
          </ul>

          {/* User section */}
          <div className={styles.modernUserSection}>
            <span className={styles.modernUserText}>
              Hello, {user.full_name || user.email?.split("@")[0] || "User"}
            </span>
            <Link
              to="/profile"
              className={styles.modernProfileIcon}
              onClick={() => setIsOpen(false)}
            >
              <FaUser size={20} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default ModernNavbar;