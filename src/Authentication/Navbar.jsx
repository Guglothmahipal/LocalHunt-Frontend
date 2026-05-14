import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./ModernHomeNavbar.module.css";
import logo from "../assets/logo-png.png";


function ModernHomeNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className={styles.modernHomeHeader}>
      <nav className={`navbar navbar-expand-lg ${styles.modernHomeNavbar}`}>
        <div className="container">
          {/* Brand */}
          <NavLink className={`navbar-brand ${styles.modernHomeBrand}`} to="/">
            <img src={logo} alt="Logo" height={40} />
            <h4 className={styles.modernHomeTitle}>Local Hunt</h4>
          </NavLink>

          {/* Hamburger */}
          <button
            className={`navbar-toggler ${styles.modernHomeToggler}`}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav Links */}
          <div
            className={`collapse navbar-collapse ${
              isOpen ? "show" : ""
            } ${styles.modernHomeMenu}`}
            id="navbarNav"
          >
            <ul className={`navbar-nav ms-auto ${styles.modernHomeList}`}>
              <li className="nav-item">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `${styles.modernHomeLink} ${isActive ? styles.active : ""}`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `${styles.modernHomeLink} ${isActive ? styles.active : ""}`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  About
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/login" className="nav-link">
                  <button className={styles.modernHomeLoginBtn}>Login</button>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink to="/signupchoice" className="nav-link">
                  <button className={styles.modernHomeSignupBtn}>Signup</button>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default ModernHomeNavbar;
