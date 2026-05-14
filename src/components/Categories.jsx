import styles from "./Categories.module.css";
import { CiShoppingCart } from "react-icons/ci";
import { IoBagHandleOutline } from "react-icons/io5";
import { FaTv,FaCar } from "react-icons/fa";
import { LuSofa } from "react-icons/lu";
import { PiBabyCarriage } from "react-icons/pi";
import { GiHeartPlus } from "react-icons/gi";
import { IoIosConstruct } from "react-icons/io";
import  {Link} from "react-router-dom";

function Categories() {
    const categories = [
  { name: "Food & Beverages", icon: CiShoppingCart, link: "/food" },
  { name: "Clothing & Accessories", icon: IoBagHandleOutline, link: "/clothing" },
  { name: "Home & Furniture", icon: LuSofa, link: "/furniture" },
  { name: "Electronics & Technology", icon: FaTv, link: "/electronics" },
  { name: "Health & Medical", icon: GiHeartPlus, link: "/health" },
  { name: "Toys & Self-Care", icon: PiBabyCarriage, link: "/toys" },
  { name: "Automobile & Transport", icon: FaCar, link: "/automobile" },
  { name: "Construction & Industrial", icon: IoIosConstruct, link: "/construction" },
];

    const colors = [
        "linear-gradient(135deg, #FF6A00, #FFB347)",
        "linear-gradient(135deg, #FF4E50, #FC913A)",
        "linear-gradient(135deg, #FFD700, #FFA500)",
        "linear-gradient(135deg, #3A7BD5, #3A6073)",
        "linear-gradient(135deg, #56ab2f, #a8e063)",
        "linear-gradient(135deg, #606c88, #3f4c6b)",
        "linear-gradient(135deg, #FF512F, #DD2476)",
        "linear-gradient(135deg, #8360c3, #2ebf91)",
    ];

    return (
        <div className="container mt-3">
            <div className="row g-2">
                {categories.map((cat, index) => (
                    <div key={index} className={`col-6 col-md-4 col-lg-3 ${styles.outerCard}`}>
                        <Link to={`/shopsearch?category=${encodeURIComponent(cat.name)}`} className={styles.cardLink}>
                        <div
                            className={styles.innerCard}
                            style={{ background: colors[index] }}
                        >
                            <cat.icon className={styles.icon} />
                            <p style={{fontWeight:"bold"}}>{cat.name}</p>
                        </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Categories;
