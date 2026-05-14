// src/Components/SignupChoice.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../style.css";

export default function SignupChoice() {
  return (
    <main className="signup-choice-main">
      <section className="signup-choice-form">
        <header className="signup-choice-content">
          <h2>Join Local Hunt</h2>
          <p>Choose your role to get started</p>
        </header>

        <nav className="signup-choice-links">
          <Link to="/signupchoice/vendor" className="signup-btn vendor">
            Signup as Vendor
          </Link>
          <Link to="/signupchoice/user" className="signup-btn user">
            Signup as User
          </Link>
        </nav>

        <footer className="signup-choice-back">
          <Link to="/" className="back">
            Back
          </Link>
        </footer>
      </section>
    </main>
  );
}
