import React from 'react';
import { motion } from 'framer-motion';
import './About.css';
import FruitCarousel from './corousel.jsx';
import Footer from '../Footer.jsx';
import Jai from "../assets/Developers/Jai.png";
import Vinay from "../assets/Developers/Vinay.png";
import Varma from "../assets/Developers/varma.png";
import Mahipal from "../assets/Developers/Mahipal.png";
import Manideep from "../assets/Developers/Manideep.png";
import { Link } from 'react-router-dom';
import { FaLocationDot} from "react-icons/fa6";
import { FaRegEdit, FaSearchLocation } from "react-icons/fa";
import { TiMessages } from "react-icons/ti";
import { GiBoxUnpacking } from "react-icons/gi";
import { MdEventAvailable } from "react-icons/md";
import FuturisticNavigationAnimation from '../assets/AboutVideos/Futuristic_Navigation_Route_Animation.mp4'
import ChatConnectCollect from '../assets/AboutVideos/LocalHunt_Chat_Connect_Collect.mp4';
import RegistrationDemo from '../assets/AboutVideos/localhunt_regestration.mp4';
import LocationSearch from '../assets/AboutVideos/Location_search_video.mp4';
import PrePack from '../assets/AboutVideos/Pre_packaging.mp4';
import OutStock from '../assets/AboutVideos/Out_Of_Stock.mp4'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const heroImageVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      yoyo: Infinity
    }
  },
  tap: {
    scale: 0.95
  }
};

// Enhanced Professional Feature Animations
const featureContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
};

const featureCardVariants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  hover: {
    y: -10,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(255, 215, 0, 0.15)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

const featureIconVariants = {
  hidden: { 
    scale: 0,
    rotate: -180 
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      duration: 0.8
    }
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const featureTextVariants = {
  hidden: { 
    opacity: 0,
    x: -30 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: 0.2
    }
  }
};

const featureTextReverseVariants = {
  hidden: { 
    opacity: 0,
    x: 30 
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: 0.2
    }
  }
};

const floatingIcon = {
  animate: {
    y: [0, -12, 0],
    rotate: [0, 5, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Video component with intersection observer for play/pause
const VideoPlayer = ({ src, className = "" }) => {
  const videoRef = React.useRef(null);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          video.play().catch(error => {
            console.log("Video play failed:", error);
          });
        } else {
          video.pause();
        }
      },
      {
        threshold: 0.8 // Play when 80% of video is in view
      }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView) {
      video.play().catch(error => {
        console.log("Video play failed:", error);
      });
    } else {
      video.pause();
    }
  }, [isInView]);

  return (
    <motion.div
      className={`aboutus-media-container ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.6 }}
    >
      <video
        ref={videoRef}
        className="aboutus-feature-video"
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </motion.div>
  );
};

// Lottie Animation component
const LottieAnimation = ({ src, className = "" }) => {
  return (
    <motion.div
      className={`aboutus-media-container ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.6 }}
    >
      <div className="aboutus-lottie-animation">
        {/* Replace this div with your actual Lottie component */}
        <div className="aboutus-lottie-placeholder">
          <p>Lottie Animation</p>
          <small>Path: {src}</small>
        </div>
      </div>
    </motion.div>
  );
};

const LandingPage = () => {
  const howItWorks = [
    {
      icon: <FaLocationDot />,
      title: 'Location Feature',
      description: 'Find vendor shops near you with precise location tracking. Navigate easily to your desired shop with integrated maps and real-time directions.',
      side: 'left',
      media: 'video',
      src:  LocationSearch
    },
    {
      icon: <FaRegEdit/>,
      title: 'Vendor Registration',
      description: 'Seamless vendor onboarding process with verification system. Get your verified badge and start connecting with customers instantly.',
      side: 'right',
      media: 'video', 
      src: RegistrationDemo
    },
    {
      icon: <FaSearchLocation/>,
      title: 'Smart Search',
      description: 'Search vendors based on ratings, distance, and popularity. Find the best shops that match your preferences with our intelligent filtering.',
      side: 'left',
      media: 'video',
      src: FuturisticNavigationAnimation
    },
    {
      icon: <TiMessages/>,
      title: 'Chat System',
      description: 'Direct communication between customers and vendors. Discuss products, negotiate prices, and build relationships through our real-time chat.',
      side: 'right',
      media: 'video',
      src: ChatConnectCollect
    },
    {
      icon: <GiBoxUnpacking/>,
      title: 'Pre-Packaging',
      description: 'Place orders and pre-package your items after communicating with vendors. Save time with ready-to-pickup orders.',
      side: 'left',
      media: 'video',
      src: PrePack
    },
    {
      icon: <MdEventAvailable/>,
      title: 'Product Availability',
      description: 'Check real-time product availability across vendor shops. Know before you go and never face out-of-stock disappointments.',
      side: 'right',
      media: 'video',
      src: OutStock
    }
  ];

  const team = [
    {
      name: 'DHANUNJAY',
      role: 'Full Stack Developer',
      image: Jai,
      bgColor: '#ffc908',
      textColor: '#000'
    },
    {
      name: 'VENU VARMA',
      role: 'Frontend Developer',
      image: Varma,
      bgColor: '#5AC8FA',
      textColor: '#1C1C1E'
    },
    {
      name: 'VINAY SHANKAPALLI',
      role: 'Frontend Developer',
      image: Vinay,
      bgColor: '#E8E2DD',
      textColor: '#1C1C1E'
    },
    {
      name: 'MAHIPAL',
      role: 'UI/UX Designer & Backend Developer',
      image: Mahipal,
      bgColor: '#AF52DE',
      textColor: '#FFFFFF'
    },
    {
      name: 'MANIDEEP',
      role: 'Backend Developer',
      image: Manideep,
      bgColor: '#1C1C1E',
      textColor: '#FFFFFF'
    }
  ];

  return (
    <>
      <motion.div
        className="aboutus-container"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Intro Heading */}
        <motion.div
          className="aboutus-intro-heading-container"
          variants={itemVariants}
        >
          <h6 className="aboutus-section-title aboutus-intro-heading">
            About Us
          </h6>
        </motion.div>

        {/* 1. Hero / Discovery Section */}
        <section className="aboutus-hero-section">
          <motion.div
            className="aboutus-hero-content"
            variants={itemVariants}
          >
            <motion.h1
              className="aboutus-hero-title"
              variants={itemVariants}
            >
              Connecting Communities<br />One Vendor at a Time
            </motion.h1>
            <motion.p
              className="aboutus-hero-tagline"
              variants={itemVariants}
            >
              Bridging the gap between local vendors and customers
            </motion.p>
          </motion.div>

          <motion.div
            className="aboutus-map-visual"
            variants={heroImageVariants}
          >
            <FruitCarousel />
          </motion.div>
        </section>

        {/* 2. Our features */}
        <section className="aboutus-section aboutus-features-section">
          <motion.h2
            className="aboutus-section-title centered-title"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            Our Features
          </motion.h2>

          <motion.div
            className="aboutus-features-container"
            variants={featureContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                className={`aboutus-feature-row ${index % 2 === 1 ? "reverse" : ""}`}
                variants={featureCardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                whileHover="hover"
              >
                {/* Media on the opposite side */}
                {item.side === 'right' && (
                  <>
                    {item.media === 'video' ? (
                      <VideoPlayer src={item.src} className="aboutus-feature-media" />
                    ) : (
                      <LottieAnimation src={item.src} className="aboutus-feature-media" />
                    )}
                  </>
                )}

                <div className="aboutus-feature-content">
                  <motion.div
                    className="aboutus-feature-icon aboutus-amber-bg"
                    variants={featureIconVariants}
                    whileHover="hover"
                  >
                    <motion.span
                      variants={floatingIcon}
                      animate="animate"
                    >
                      {item.icon}
                    </motion.span>
                  </motion.div>

                  <motion.div 
                    className="aboutus-feature-text"
                    variants={index % 2 === 0 ? featureTextVariants : featureTextReverseVariants}
                  >
                    <motion.h3
                      whileHover={{ 
                        color: "#FFD700",
                        x: 5,
                        transition: { duration: 0.2 }
                      }}
                    >
                      {item.title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      {item.description}
                    </motion.p>
                  </motion.div>
                </div>

                {/* Media on the opposite side */}
                {item.side === 'left' && (
                  <>
                    {item.media === 'video' ? (
                      <VideoPlayer src={item.src} className="aboutus-feature-media" />
                    ) : (
                      <LottieAnimation src={item.src} className="aboutus-feature-media" />
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 3. Meet Our Team*/}
        <section className="aboutus-section aboutus-team-section">
          <motion.h2
            className="aboutus-section-title aboutus-team-title"
            variants={itemVariants}
          >
            Meet Our Team
          </motion.h2>

          <motion.div
            className="aboutus-grid aboutus-team-grid"
            variants={containerVariants}
          >
            {team.map((member, index) => (
              <motion.div
                key={index}
                className="aboutus-card aboutus-team-member-card"
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover="hover"
                style={{ backgroundColor: member.bgColor }}
              >
                <div className="aboutus-member-text-container">
                  <p className="aboutus-member-name" style={{ color: member.textColor }}>
                    {member.name}
                  </p>
                  <p className="aboutus-member-role" style={{ color: member.textColor }}>
                    {member.role}
                  </p>
                </div>

                {member.image.includes('👨‍💻') ? (
                  <div className="aboutus-member-emoji">{member.image}</div>
                ) : (
                  <img
                    className="aboutus-member-image"
                    src={member.image}
                    alt={`${member.name} - ${member.role}`}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 4. Ready to Explore ? */}
        <section className="aboutus-final-cta-section mt-2" style={{background: "linear-gradient(135deg, #FFD700 0%, #FFB300 100%)"}}>
          <motion.h2
            className="aboutus-final-cta-title"
            variants={itemVariants}
          >
            Ready to Explore ?
          </motion.h2>
          <motion.p
            style={{ fontSize: '1.3rem', color: '#666', marginBottom: '40px' }}
            variants={itemVariants}
          >
            Join thousands of customers finding their perfect local vendors
          </motion.p>
          <Link to="/signupchoice">
            <motion.button
              className="aboutus-cta-button aboutus-secondary-cta bg-dark text-light"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Get Started
            </motion.button>
          </Link>
        </section>

        {/* 5. Footer */}
        <motion.footer
          variants={itemVariants}
        >
          <Footer></Footer>
        </motion.footer>
      </motion.div>
    </>
  );
};

export default LandingPage;