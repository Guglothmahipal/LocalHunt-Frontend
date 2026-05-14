import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // path as needed
import styles from "./TopSeller.module.css";
import { Link } from "react-router-dom";
import { FaCrown, FaBox, FaMapMarkerAlt } from "react-icons/fa";
import Skeleton,{ SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

function TopSellers() {
    const [sellers, setSellers] = useState([]);

    useEffect(() => {
        fetchTopSellers();
    }, []);

    async function fetchTopSellers() {
        let { data, error } = await supabase
            .from("shops")
            .select("*")
            .order("shoprating", { ascending: false })
            .limit(3);

        if (error) {
            console.error("Error fetching sellers:", error);
        } else {
            setTimeout(()=>{
            setSellers(
                data.map((seller, index) => ({
                    rank: index + 1,
                    name: seller.shopname,
                    rating: seller.shoprating,
                    image: seller.shopimage, // your column for image
                    icons: [<FaBox />, <FaMapMarkerAlt />],
                    id: seller.id,
                }))
            );
            },1000)
        }
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                <FaCrown className={styles.crown} /> Top 3 Best Sellers
            </h2>

            <div className={styles.cards}>
                {sellers.length === 0 ? (
                    Array.from({ length:3 }).map((_, i) => (
                        <div key={i} className={styles.card}>
                            <SkeletonTheme baseColor="#202020" highlightColor="#444">
                            <div style={{margin:"10px"}}>
                            <Skeleton height={100}/>
                            <Skeleton width={150} />
                            <Skeleton width={40} />
                            <Skeleton height={60} />

                            </div>
                            </SkeletonTheme>
                        </div>
                    ))
                ) : (
                    sellers.map((seller) => (
                        <div key={seller.id} className={styles.card}>
                            <img src={seller.image} alt={seller.name} className={styles.imgSize} />
                            <div className={`${styles.rank} ${styles[`rank${seller.rank}`]}`}>
                                {seller.rank}
                            </div>
                            <div className={styles.cardContent}>
                                <p className={styles.name}>{seller.name}</p>
                                <p className={styles.rating}>⭐ {seller.rating}</p>
                                <div className={styles.innerCard}>
                                    <Link to={`/ShopPage/${seller.id}`} className={styles.btn}>
                                        {seller.icons[0]} Products
                                    </Link>
                                    <Link to={`/ShopPage/${seller.id}`} className={styles.btn}>
                                        {seller.icons[1]} Location
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}

export default TopSellers;
