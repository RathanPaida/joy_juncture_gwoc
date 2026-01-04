"use client";

import React, { useState, useEffect, useRef } from "react";
import data from "../../../data/eventsData.json";

export default function Events() {
  const [locationType, setLocationType] = useState("fixed");
  const [formData, setFormData] = useState({
    type: "birthday",
    name: "",
    phone: "",
    date: "",
    location: "",
    customAddress: "",
    package: ""
  });
  const [showTravelNote, setShowTravelNote] = useState(false);

  const bookingRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isServiceableLocation = (address) => {
    if (!address) return false;
    return data.locations.some((loc) =>
      address.toLowerCase().includes(loc.toLowerCase())
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you! We will contact you for your ${formData.type} event 🎉`);
    setFormData({
      type: "birthday",
      name: "",
      phone: "",
      date: "",
      location: "",
      customAddress: "",
      package: ""
    });
    setShowTravelNote(false);
  };

  const scrollToForm = (eventType) => {
    setFormData({ ...formData, type: eventType });
    bookingRef.current.scrollIntoView({ behavior: "smooth" });
  };

  // Demo carousel
  const [currentDemo, setCurrentDemo] = useState(0);
  const demoRef = useRef();
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % data.demoPhotos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const pauseCarousel = () => clearInterval(demoRef.current);
  const resumeCarousel = () => {
    demoRef.current = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % data.demoPhotos.length);
    }, 3000);
  };

  const renderGallery = (items) => (
    <div style={styles.galleryContainer}>
      {items.map((item) => (
        <div key={item.id} style={styles.galleryCard}>
          <img src={item.image} alt={item.title} style={styles.galleryImage} />
          <div style={styles.galleryOverlay}>
            <h3>{item.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPackages = (packages) => (
    <div style={styles.packagesContainer}>
      {packages.map((pkg) => (
        <div key={pkg.id} style={styles.packageCard}>
          <h3>{pkg.name}</h3>
          <p style={styles.packagePrice}>{pkg.price}</p>
          <ul>
            {pkg.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <button
            style={styles.bookBtn}
            onClick={() => scrollToForm(pkg.name.includes("Birthday") ? "birthday" : "anniversary")}
          >
            Book Now
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Joy Juncture Events</h1>
        <p style={styles.heroSubtitle}>
          Birthdays & Anniversaries made memorable
        </p>
      </section>

      {/* DEMO PHOTOS */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Demo Moments</h2>
        <div
          style={styles.demoContainer}
          onMouseEnter={pauseCarousel}
          onMouseLeave={resumeCarousel}
        >
          <img
            src={data.demoPhotos[currentDemo]}
            alt="Demo"
            style={styles.demoImage}
          />
        </div>
      </section>

      {/* BIRTHDAY SECTION */}
      <section style={{ ...styles.section, backgroundColor: "#1A1A1A" }}>
        <h2 style={styles.sectionTitle}>Birthday Celebrations</h2>
        {renderGallery(data.birthdayGallery)}
        {renderPackages(data.birthdayPackages)}
      </section>

      {/* ANNIVERSARY SECTION */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Anniversary Celebrations</h2>
        {renderGallery(data.anniversaryGallery)}
        {renderPackages(data.anniversaryPackages)}
      </section>

      {/* BOOKING FORM */}
      <section style={{ ...styles.section, backgroundColor: "#0F0F0F" }} ref={bookingRef}>
        <h2 style={styles.sectionTitle}>Book Your Event</h2>

        <form style={styles.form} onSubmit={handleSubmit}>
          <select
            name="type"
            style={styles.input}
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="birthday">Birthday</option>
            <option value="anniversary">Anniversary</option>
          </select>

          <input
            style={styles.input}
            placeholder="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            placeholder="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          {/* LOCATION TYPE */}
          <div style={styles.radioGroup}>
            <label>
              <input
                type="radio"
                value="fixed"
                checked={locationType === "fixed"}
                onChange={() => setLocationType("fixed")}
              />
              Our Locations
            </label>
            <label>
              <input
                type="radio"
                value="custom"
                checked={locationType === "custom"}
                onChange={() => setLocationType("custom")}
              />
              My Address
            </label>
          </div>

          {/* FIXED LOCATIONS */}
          {locationType === "fixed" && (
            <select
              style={styles.input}
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            >
              <option value="">Select Location</option>
              {data.locations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          )}

          {/* CUSTOM ADDRESS */}
          {locationType === "custom" && (
            <>
              <textarea
                style={styles.textarea}
                name="customAddress"
                placeholder="Enter full event address"
                value={formData.customAddress}
                onChange={(e) => {
                  handleChange(e);
                  setShowTravelNote(!isServiceableLocation(e.target.value));
                }}
                required
              />
              {showTravelNote && (
                <p style={styles.travelNote}>
                  ⚠️ This address is outside our service locations. <br />
                  <strong>
                    Travelling & logistics must be arranged by the booking person.
                  </strong>
                </p>
              )}
            </>
          )}

          {/* PACKAGE */}
          <select
            style={styles.input}
            name="package"
            value={formData.package}
            onChange={handleChange}
            required
          >
            <option value="">Select Package</option>
            {(formData.type === "birthday"
              ? data.birthdayPackages
              : data.anniversaryPackages
            ).map((pkg) => (
              <option key={pkg.id} value={pkg.name}>
                {pkg.name} - {pkg.price}
              </option>
            ))}
          </select>

          <button style={styles.button} type="submit">
            Request Booking
          </button>
        </form>
      </section>
    </div>
  );
}

const styles = {
  page: { fontFamily: "Arial, sans-serif" },
  hero: {
    padding: "80px 20px",
    textAlign: "center",
    background: "linear-gradient(120deg, #FF6B35 0%, #0F0F0F 60%)",
    color: "#fff"
  },
  heroTitle: { fontSize: "42px", fontWeight: "bold" },
  heroSubtitle: { fontSize: "18px", marginTop: "10px" },
  section: { padding: "60px 20px" },
  sectionTitle: { textAlign: "center", fontSize: "32px", marginBottom: "40px", color: "#FF6B35" },
  galleryContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
  },
  galleryCard: { position: "relative", borderRadius: "12px", overflow: "hidden", cursor: "pointer" },
  galleryImage: { width: "100%", height: "200px", objectFit: "cover", transition: "transform 0.3s" },
  galleryOverlay: {
    position: "absolute",
    bottom: "0",
    width: "100%",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    textAlign: "center",
    padding: "8px"
  },
  packagesContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" },
  packageCard: { backgroundColor: "#1A1A1A", padding: "20px", borderRadius: "12px", border: "2px solid #FF6B35", textAlign: "center" },
  packagePrice: { color: "#FF6B35", fontWeight: "bold" },
  bookBtn: { marginTop: "10px", padding: "10px 20px", backgroundColor: "#FF6B35", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" },
  demoContainer: { width: "80%", maxWidth: "600px", margin: "auto", overflow: "hidden", borderRadius: "12px", border: "2px solid #FF6B35", marginBottom: "50px" },
  demoImage: { width: "100%", display: "block" },
  form: { display: "grid", gap: "15px", maxWidth: "500px", margin: "auto" },
  input: { padding: "12px", borderRadius: "6px", border: "1px solid #FF6B35", backgroundColor: "#1A1A1A", color: "#fff", fontSize: "16px" },
  textarea: { padding: "12px", borderRadius: "6px", border: "1px solid #FF6B35", backgroundColor: "#1A1A1A", color: "#fff", fontSize: "16px", resize: "vertical", minHeight: "80px" },
  radioGroup: { display: "flex", justifyContent: "center", gap: "20px", margin: "15px 0", color: "#fff" },
  button: { backgroundColor: "#FF6B35", color: "#fff", padding: "15px", border: "none", borderRadius: "6px", fontSize: "16px", cursor: "pointer" },
  travelNote: { marginTop: "10px", color: "#FFB347", fontSize: "14px", fontWeight: "bold" }
};
