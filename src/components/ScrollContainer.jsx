import React from "react";
import styles from "./ScrollContainer.module.css";

const ScrollContainer = ({ children }) => {
  return (
    <div className={styles.scrollContainer}>
      {children}
    </div>
  );
};

export default ScrollContainer;