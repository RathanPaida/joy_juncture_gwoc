"use client";

import React, { useState } from 'react';

const CarnivalsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    eventType: '',
    attendees: '',
    location: '',
    date: '',
    duration: '',
    requirements: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Carnival enquiry submitted! Our carnival specialists will contact you.');
    setFormData({
      name: '', email: '', phone: '', organization: '', eventType: '', attendees: '',
      location: '', date: '', duration: '', requirements: ''
    });
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Carnivals & Experience Zones</h1>
          <p style={styles.heroSubtitle}>
            Large-scale immersive experience zones & activities for unforgettable events
          </p>
          <div style={styles.heroTags}>
            <span style={styles.tag}>🎪 Full Carnival Setup</span>
            <span style={styles.tag}>🎮 Interactive Zones</span>
            <span style={styles.tag}>🎯 Large-scale Events</span>
          </div>
        </div>
      </section>

      {/* Scale & Impact */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <div style={styles.scaleImpact}>
            <div style={styles.scaleCard}>
              <h2 style={styles.sectionTitle}>Event Scale</h2>
              <div style={styles.scaleGrid}>
                <div style={styles.scaleItem}>
                  <div style={styles.scaleIcon}>🎪</div>
                  <div style={styles.scaleInfo}>
                    <div style={styles.scaleNumber}>50-50,000</div>
                    <div style={styles.scaleLabel}>Attendees Capacity</div>
                  </div>
                </div>
                <div style={styles.scaleItem}>
                  <div style={styles.scaleIcon}>⏱️</div>
                  <div style={styles.scaleInfo}>
                    <div style={styles.scaleNumber}>1-7 Days</div>
                    <div style={styles.scaleLabel}>Event Duration</div>
                  </div>
                </div>
                <div style={styles.scaleItem}>
                  <div style={styles.scaleIcon}>🎮</div>
                  <div style={styles.scaleInfo}>
                    <div style={styles.scaleNumber}>20+</div>
                    <div style={styles.scaleLabel}>Activity Zones</div>
                  </div>
                </div>
                <div style={styles.scaleItem}>
                  <div style={styles.scaleIcon}>👥</div>
                  <div style={styles.scaleInfo}>
                    <div style={styles.scaleNumber}>100%</div>
                    <div style={styles.scaleLabel}>Engagement Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zone Types */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.sectionTitle}>Experience Zones</h2>
          <div style={styles.zonesGrid}>
            {[
              { name: 'Game Arena', activities: ['Classic carnival games', 'Prize-winning challenges', 'Skill-based competitions'] },
              { name: 'VR Zone', activities: ['Virtual reality experiences', 'Immersive simulations', '360° adventures'] },
              { name: 'Food Court', activities: ['Gourmet food stalls', 'Interactive cooking', 'Food challenges'] },
              { name: 'Performance Stage', activities: ['Live entertainment', 'Interactive shows', 'Talent showcases'] },
              { name: 'Artisan Market', activities: ['Handcrafted goods', 'DIY workshops', 'Local artisans'] },
              { name: 'Kids Wonderland', activities: ['Child-friendly games', 'Educational activities', 'Safe play zones'] },
            ].map((zone, index) => (
              <div key={index} style={styles.zoneCard}>
                <h3 style={styles.zoneName}>{zone.name}</h3>
                <ul style={styles.zoneActivities}>
                  {zone.activities.map((activity, i) => (
                    <li key={i} style={styles.activityItem}>🎯 {activity}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Types */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.sectionTitle}>Perfect For</h2>
          <div style={styles.clientGrid}>
            {[
              { type: 'Corporate Festivals', icon: '🏢', desc: 'Company-wide celebrations' },
              { type: 'School Events', icon: '🏫', desc: 'Annual functions & carnivals' },
              { type: 'Community Fairs', icon: '🏘️', desc: 'Local community gatherings' },
              { type: 'Shopping Malls', icon: '🛍️', desc: 'Promotional events' },
              { type: 'Music Festivals', icon: '🎵', desc: 'Entertainment enhancements' },
              { type: 'Charity Events', icon: '🤝', desc: 'Fundraising carnivals' },
            ].map((client, index) => (
              <div key={index} style={styles.clientCard}>
                <div style={styles.clientIcon}>{client.icon}</div>
                <h3 style={styles.clientType}>{client.type}</h3>
                <p style={styles.clientDesc}>{client.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section style={styles.formSection}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.formTitle}>Bring the Carnival to You</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                type="text"
                placeholder="Organization"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                style={styles.input}
                required
              />
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                style={styles.input}
                required
              >
                <option value="">Event Type</option>
                <option value="corporate">Corporate Carnival</option>
                <option value="school">School Event</option>
                <option value="community">Community Fair</option>
                <option value="festival">Music Festival</option>
                <option value="charity">Charity Event</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                placeholder="Expected Attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Location/City"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                style={styles.input}
                required
              />
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                style={styles.input}
                required
              >
                <option value="">Event Duration</option>
                <option value="1">1 Day</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="weekend">Weekend</option>
                <option value="week">Full Week</option>
              </select>
            </div>
            <textarea
              placeholder="Tell us about your event vision, specific requirements, or any special considerations..."
              value={formData.requirements}
              onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              style={styles.textarea}
              rows={4}
              required
            />
            <button type="submit" style={styles.submitButton}>
              Get Carnival Proposal
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
  heroTags: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    flexWrap: 'wrap' as const,
  },
  tag: {
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
  scaleImpact: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
  },
  scaleCard: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '30px',
    color: '#1a1a1a',
    textAlign: 'center' as const,
  },
  scaleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '30px',
  },
  scaleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
  },
  scaleIcon: {
    fontSize: '40px',
  },
  scaleInfo: {
    flex: 1,
  },
  scaleNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  scaleLabel: {
    fontSize: '14px',
    color: '#666',
  },
  zonesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    marginTop: '40px',
  },
  zoneCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    borderLeft: '5px solid #FF6B35',
  },
  zoneName: {
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  zoneActivities: {
    listStyle: 'none',
    padding: 0,
  },
  activityItem: {
    marginBottom: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  clientGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    marginTop: '40px',
  },
  clientCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    textAlign: 'center' as const,
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease',
  },
  clientIcon: {
    fontSize: '40px',
    marginBottom: '20px',
  },
  clientType: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '10px',
    color: '#1a1a1a',
  },
  clientDesc: {
    color: '#666',
    fontSize: '14px',
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

export default CarnivalsPage;