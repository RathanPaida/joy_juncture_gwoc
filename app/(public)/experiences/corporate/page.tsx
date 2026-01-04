"use client";

import React, { useState } from 'react';

const WeddingsPage = () => {
  const [formData, setFormData] = useState({
    coupleName: '',
    email: '',
    phone: '',
    weddingDate: '',
    venue: '',
    guests: '',
    hamperType: '',
    entertainment: '',
    budget: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Wedding enquiry submitted! Our wedding specialists will contact you.');
    setFormData({
      coupleName: '', email: '', phone: '', weddingDate: '', venue: '', guests: '',
      hamperType: '', entertainment: '', budget: '', message: ''
    });
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Weddings & Entertainment Hampers</h1>
          <p style={styles.heroSubtitle}>
            Custom games, entertainment hampers & interactive setups for unforgettable weddings
          </p>
          <div style={styles.heroStats}>
            <span style={styles.stat}>💍 Custom Wedding Games</span>
            <span style={styles.stat}>🎁 Entertainment Hampers</span>
            <span style={styles.stat}>🎪 Interactive Setups</span>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <div style={styles.problemSolution}>
            <div style={styles.problemBox}>
              <h2 style={styles.sectionTitle}>The Wedding Challenge</h2>
              <ul style={styles.list}>
                <li>😴 Boring gaps between ceremony & reception</li>
                <li>📸 Limited photo-worthy moments</li>
                <li>🎭 Generic entertainment options</li>
                <li>⏰ Overwhelming planning process</li>
                <li>👥 Guests feeling disconnected</li>
                <li>🎯 Lack of personalized elements</li>
              </ul>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.solutionBox}>
              <h2 style={styles.sectionTitle}>Our Wedding Solution</h2>
              <ul style={styles.list}>
                <li>🎁 Custom entertainment hampers</li>
                <li>🎮 Personalized wedding games</li>
                <li>📸 Interactive photo experiences</li>
                <li>⏱️ Seamless event flow</li>
                <li>🤝 Guest connection activities</li>
                <li>✨ Unique personalized touches</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.sectionTitle}>Our Wedding Services</h2>
          <div style={styles.featuresGrid}>
            {[
              { 
                icon: '🎁', 
                title: 'Entertainment Hampers', 
                desc: 'Curated boxes with games and activities for guests' 
              },
              { 
                icon: '🎮', 
                title: 'Custom Wedding Games', 
                desc: 'Personalized games that tell your love story' 
              },
              { 
                icon: '📸', 
                title: 'Photo Experiences', 
                desc: 'Interactive photo booths and stations' 
              },
              { 
                icon: '🎪', 
                title: 'Activity Zones', 
                desc: 'Engaging areas for guest interaction' 
              },
              { 
                icon: '🎵', 
                title: 'Live Entertainment', 
                desc: 'Unique performers and interactive acts' 
              },
              { 
                icon: '💝', 
                title: 'Guest Experiences', 
                desc: 'Memorable takeaways and participation' 
              },
            ].map((feature, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hamper Packages */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.sectionTitle}>Wedding Hamper Packages</h2>
          <div style={styles.packagesGrid}>
            {[
              {
                name: 'Essential Package',
                price: '$999',
                color: '#FF6B35',
                features: [
                  '2 custom wedding games',
                  'Basic photo booth setup',
                  '50 guest entertainment packs',
                  'Game coordination',
                  'Setup & breakdown'
                ]
              },
              {
                name: 'Premium Package',
                price: '$1,999',
                color: '#1a1a1a',
                features: [
                  '4 custom wedding games',
                  'Deluxe photo experience',
                  '100 guest entertainment packs',
                  'MC-hosted games',
                  'Interactive guest book',
                  'Full coordination'
                ]
              },
              {
                name: 'Luxury Package',
                price: '$3,999',
                color: '#FF6B35',
                features: [
                  '6+ custom wedding games',
                  'Multiple activity zones',
                  '200+ guest entertainment packs',
                  'Live entertainer',
                  'Customized hampers',
                  'Month-of coordination',
                  'Post-wedding memory book'
                ]
              },
            ].map((pkg, index) => (
              <div key={index} style={{...styles.packageCard, borderTop: `5px solid ${pkg.color}`}}>
                <h3 style={styles.packageName}>{pkg.name}</h3>
                <div style={styles.packagePrice}>{pkg.price}</div>
                <ul style={styles.packageFeatures}>
                  {pkg.features.map((feature, i) => (
                    <li key={i} style={styles.featureItem}>✓ {feature}</li>
                  ))}
                </ul>
                <button 
                  style={styles.packageButton}
                  onClick={() => setFormData({...formData, hamperType: pkg.name.toLowerCase()})}
                >
                  Select Package
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section style={styles.gallerySection}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.sectionTitle}>Wedding Moments We've Created</h2>
          <div style={styles.gallery}>
            <div style={styles.galleryItem}>
              <div style={styles.galleryImage}>📸 Photo Booth Setup</div>
              <p>Interactive photo experiences</p>
            </div>
            <div style={styles.galleryItem}>
              <div style={styles.galleryImage}>🎮 Game Station</div>
              <p>Custom wedding games</p>
            </div>
            <div style={styles.galleryItem}>
              <div style={styles.galleryImage}>🎁 Hamper Display</div>
              <p>Entertainment hampers</p>
            </div>
            <div style={styles.galleryItem}>
              <div style={styles.galleryImage}>🎪 Activity Zone</div>
              <p>Guest engagement areas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section style={styles.formSection}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.formTitle}>Plan Your Dream Wedding Experience</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Couple's Names"
                value={formData.coupleName}
                onChange={(e) => setFormData({...formData, coupleName: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="date"
                placeholder="Wedding Date"
                value={formData.weddingDate}
                onChange={(e) => setFormData({...formData, weddingDate: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Wedding Venue"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
                style={styles.input}
              />
              <input
                type="number"
                placeholder="Number of Guests"
                value={formData.guests}
                onChange={(e) => setFormData({...formData, guests: e.target.value})}
                style={styles.input}
                required
              />
              <select
                value={formData.hamperType}
                onChange={(e) => setFormData({...formData, hamperType: e.target.value})}
                style={styles.input}
              >
                <option value="">Package Interest</option>
                <option value="essential">Essential Package</option>
                <option value="premium">Premium Package</option>
                <option value="luxury">Luxury Package</option>
                <option value="custom">Custom Package</option>
              </select>
              <input
                type="text"
                placeholder="Entertainment Preferences"
                value={formData.entertainment}
                onChange={(e) => setFormData({...formData, entertainment: e.target.value})}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Budget Range"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                style={styles.input}
              />
            </div>
            <textarea
              placeholder="Tell us about your wedding vision, theme, and any special requests..."
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              style={styles.textarea}
              rows={4}
              required
            />
            <button type="submit" style={styles.submitButton}>
              Get Wedding Proposal
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  hero: {
    backgroundColor: '#1a1a1a',
    backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #FF6B35 100%)',
    color: 'white',
    padding: '80px 20px',
    textAlign: 'center' as const,
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: 800,
    marginBottom: '20px',
    color: 'white',
  },
  heroSubtitle: {
    fontSize: '22px',
    marginBottom: '30px',
    opacity: 0.9,
  },
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  stat: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '10px 20px',
    borderRadius: '25px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  section: {
    padding: '60px 20px',
  },
  contentWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  problemSolution: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '40px',
    flexWrap: 'wrap' as const,
  },
  problemBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
    minWidth: '300px',
  },
  solutionBox: {
    flex: 1,
    backgroundColor: '#FF6B35',
    color: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(255,107,53,0.3)',
    minWidth: '300px',
  },
  arrow: {
    fontSize: '40px',
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '30px',
    color: '#1a1a1a',
    textAlign: 'center' as const,
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    marginTop: '40px',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    textAlign: 'center' as const,
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease',
  },
  featureIcon: {
    fontSize: '40px',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '10px',
    color: '#1a1a1a',
  },
  featureDesc: {
    color: '#666',
    lineHeight: 1.6,
  },
  packagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    marginTop: '40px',
  },
  packageCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  packageName: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '15px',
    color: '#1a1a1a',
  },
  packagePrice: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: '25px',
  },
  packageFeatures: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '30px',
    textAlign: 'left' as const,
  },
  featureItem: {
    marginBottom: '12px',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  packageButton: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    width: '100%',
  },
  gallerySection: {
    backgroundColor: '#f9f9f9',
    padding: '60px 20px',
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '40px',
  },
  galleryItem: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    textAlign: 'center' as const,
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  },
  galleryImage: {
    width: '100%',
    height: '150px',
    backgroundColor: '#FF6B35',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    borderRadius: '10px',
    marginBottom: '15px',
  },
  formSection: {
    backgroundColor: '#1a1a1a',
    padding: '60px 20px',
  },
  formTitle: {
    fontSize: '36px',
    fontWeight: 700,
    marginBottom: '40px',
    color: 'white',
    textAlign: 'center' as const,
  },
  form: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  input: {
    padding: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  textarea: {
    width: '100%',
    padding: '15px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s',
    marginBottom: '20px',
    resize: 'vertical' as const,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    color: 'white',
    padding: '18px 40px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.3s',
  },
};

export default WeddingsPage;