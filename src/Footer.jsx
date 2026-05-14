import { useState } from "react";
import { supabase } from "./supabaseClient"; // adjust path if needed
import emailjs from "@emailjs/browser";
import { useRef } from "react";



function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", problem: "" });
  const [sending, setSending] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [workForm, setWorkForm] = useState({
    name: "",
    email: "",
    mobile: "",
    jobRole: "",
  });
  const [workSending, setWorkSending] = useState(false);
  const workFormRef = useRef();
  const handleWorkChange = (e) => {
    setWorkForm({ ...workForm, [e.target.name]: e.target.value });
  };
  const sendWorkEmail = async (e) => {
    e.preventDefault();
    setWorkSending(true);
    try {
      await emailjs.sendForm(
        "service_4m8fphq",
        "template_k0pts7r",
        workFormRef.current,
        { publicKey: "s7RlpAkvtw2rX19BS" }
      );
      alert("Message sent!");
      setWorkForm({ name: "", email: "", mobile: "", jobRole: "" });
      setIsWorkModalOpen(false);
    } catch (err) {
      alert("Error sending message.");
      console.error(err);
    } finally {
      setWorkSending(false);
    }
  };

  const contactFormRef = useRef()
  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  }; const sendContactEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await emailjs.sendForm(
        "service_4m8fphq",
        "template_7vxp6um",
        contactFormRef.current,
        { publicKey: "s7RlpAkvtw2rX19BS" }
      );
      alert("Message sent!");
      setContactForm({ name: "", email: "", problem: "" });
      setIsContactModalOpen(false);
    } catch (err) {
      alert("Error sending message.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Fetch username from localStorage
  const userData = JSON.parse(localStorage.getItem("user"));
  const username = userData?.full_name || "Anonymous";

  // Function to submit feedback to Supabase
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || rating === 0) {
      alert("Please provide feedback and rating.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("Testimonials").insert([
        {
          username: username,
          description: feedbackText.trim(),
          stars: rating,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Error submitting feedback!");
      } else {
        alert("Thank you for your feedback!");
        setFeedbackText("");
        setRating(0);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    } finally {
      setSubmitting(false);
    }
  };

  // Render star rating UI
  const renderStars = () => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        onClick={() => setRating(i + 1)}
        style={{
          cursor: "pointer",
          fontSize: "24px",
          color: i < rating ? "#ffc908" : "#ccc",
          transition: "color 0.2s",
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <>
      <footer
        style={{
          width: "100vw",
          background: "#22223b",
          color: "#fff",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.07)",
          paddingTop: "24px",
          paddingBottom: "16px",
          marginTop: "32px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            padding: "0 24px",
          }}
        >
          {/* Left Section */}
          <div style={{ minWidth: 260 }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>LocalHunt</span>{" "}
            <span style={{ fontSize: 14, color: "#b8b8d1" }}>
              &copy; {new Date().getFullYear()} All Rights Reserved.
            </span>
            <br />
            <span style={{ fontSize: 13 }}>
              Made with{" "}
              <span style={{ color: "#ff4d6d", fontWeight: "bold" }}>♥</span> by KMITIANS
            </span>
          </div>

          {/* Center Section - New Links */}
          <nav style={{ minWidth: 200 }}>
            <a
              href="#"
              onClick={() => setIsWorkModalOpen(true)}
              style={{
                marginRight: 20,
                color: "#f8f8fe",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#ffc908")}
              onMouseLeave={(e) => (e.target.style.color = "#f8f8fe")}
            >
              Work with Us
            </a>

            <a
              href="#"
              onClick={() => setIsContactModalOpen(true)}
              style={{
                marginRight: 20,
                color: "#f8f8fe",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#ffc908")}
              onMouseLeave={(e) => (e.target.style.color = "#f8f8fe")}
            >
              Contact Us
            </a>

            <a
              href="#"
              onClick={() => setIsModalOpen(true)}
              style={{
                color: "#f8f8fe",
                textDecoration: "none",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#ffc908")}
              onMouseLeave={(e) => (e.target.style.color = "#f8f8fe")}
            >
              Give Feedback
            </a>
          </nav>

        </div>
      </footer>

      {/* Feedback Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "#22223b", marginBottom: 16 }}>Give Feedback</h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Write your feedback here..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                resize: "none",
                marginBottom: "12px",
              }}
            />
            <div style={{ marginBottom: "12px" }}>{renderStars()}</div>
            <button
              onClick={handleSubmitFeedback}
              disabled={submitting}
              style={{
                background: submitting ? "#999" : "#22223b",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: "600",
              }}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
      {/* Contact Us Modal */}
      {isContactModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => !sending && setIsContactModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "#22223b", marginBottom: 16 }}>Contact Us</h3>
            <form ref={contactFormRef} onSubmit={sendContactEmail}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={handleContactChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <textarea
                name="problem"
                placeholder="Describe your problem"
                value={contactForm.problem}
                onChange={handleContactChange}
                required
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  resize: "none",
                  marginBottom: "12px",
                }}
              />
              <button
                type="submit"
                disabled={sending}
                style={{
                  background: sending ? "#999" : "#22223b",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: sending ? "not-allowed" : "pointer",
                  fontWeight: "600",
                }}
              >
                {sending ? "Sending..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
      {isWorkModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={() => !workSending && setIsWorkModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "#22223b", marginBottom: 16 }}>Work With Us</h3>
            <form ref={workFormRef} onSubmit={sendWorkEmail}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={workForm.name}
                onChange={handleWorkChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={workForm.email}
                onChange={handleWorkChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="tel"
                name="mobile"
                placeholder="Your Mobile Number"
                value={workForm.mobile}
                onChange={handleWorkChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="text"
                name="jobRole"
                placeholder="Current Job Role"
                value={workForm.jobRole}
                onChange={handleWorkChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                type="submit"
                disabled={workSending}
                style={{
                  background: workSending ? "#999" : "#22223b",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: workSending ? "not-allowed" : "pointer",
                  fontWeight: "600",
                }}
              >
                {workSending ? "Sending..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}

    </>
  );
}

export default Footer;
