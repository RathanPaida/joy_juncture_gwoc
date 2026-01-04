"use client";

import React, { useState } from 'react';

const CorporateKitsPage = () => {
  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    email: '',
    phone: '',
    employees: '',
    frequency: 'monthly',
    duration: '3',
    kitType: 'standard',
    customRequirements: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Corporate Kit enquiry submitted! We will send you sample options.');
    setFormData({
      company: '', contact: '', email: '', phone: '', employees: '', frequency: 'monthly',
      duration: '3', kitType: 'standard', customRequirements: ''
    });
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Monthly Corporate Engagement Kits</h1>
          <p style={styles.heroSubtitle}>
            Ready-to-play kits delivered to employees - Keep engagement high, month after month
          </p>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>500+</div>
              <div style={styles.statLabel}>Companies Served</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>50,000+</div>
              <div style={styles.statLabel}>Kits Delivered</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>94%</div>
              <div style={styles.statLabel}>Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem-Solution */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <div style={styles.problemSolution}>
            <div style={styles.problemBox}>
              <h2 style={styles.sectionTitle}>The Engagement Gap</h2>
              <ul style={styles.list}>
                <li>📉 Declining employee engagement over time</li>
                <li>💼 Remote/hybrid work challenges</li>
                <li>💰 High cost of one-off events</li>
                <li>⏰ No time for continuous engagement planning</li>
                <li>📦 Inconsistent employee experience</li>
                <li>🎯 Difficulty measuring engagement ROI</li>
              </ul>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.solutionBox}>
              <h2 style={styles.sectionTitle}>Kit-Based Solution</h2>
              <ul style={styles.list}>
                <li>📦 Curated monthly engagement kits</li>
                <li>🏠 Perfect for remote & hybrid teams</li>
                <li>💰 Cost-effective subscription model</li>
                <li>📅 Consistent monthly delivery</li>
                <li>📊 Measurable engagement metrics</li>
                <li>🎯 Customizable to company culture</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Kit Types */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.sectionTitle}>Our Kit Collections</h2>
          <div style={styles.kitGrid}>
            {[
              { 
                name: 'Team Bonding Kit', 
                price: '$29/employee',
                includes: ['Icebreaker games', 'Virtual event codes', 'Team challenges', 'Discussion guides'],
                color: '#FF6B35'
              },
              { 
                name: 'Wellness Kit', 
                price: '$39/employee',
                includes: ['Mindfulness exercises', 'Desk yoga guide', 'Healthy snacks', 'Stress relief tools'],
                color: '#4CAF50'
              },
              { 
                name: 'Skill Builder Kit', 
                price: '$49/employee',
                includes: ['Learning materials', 'Puzzle challenges', 'Creative projects', 'Skill assessment'],
                color: '#2196F3'
              },
              { 
                name: 'Celebration Kit', 
                price: '$59/employee',
                includes: ['Award certificates', 'Recognition tools', 'Party supplies', 'Memory journals'],
                color: '#9C27B0'
              },
            ].map((kit, index) => (
              <div key={index} style={{...styles.kitCard, borderTop: `5px solid ${kit.color}`}}>
                <h3 style={styles.kitName}>{kit.name}</h3>
                <div style={styles.kitPrice}>{kit.price}</div>
                <ul style={styles.kitIncludes}>
                  {kit.includes.map((item, i) => (
                    <li key={i} style={styles.kitItem}>✓ {item}</li>
                  ))}
                </ul>
                <div style={styles.kitFrequency}>Monthly Delivery</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.section}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.process}>
            <div style={styles.processStep}>
              <div style={styles.stepNumber}>1</div>
              <h3>Consultation</h3>
              <p>We understand your company culture and goals</p>
            </div>
            <div style={styles.processArrow}>→</div>
            <div style={styles.processStep}>
              <div style={styles.stepNumber}>2</div>
              <h3>Customization</h3>
              <p>We tailor kits to your specific needs</p>
            </div>
            <div style={styles.processArrow}>→</div>
            <div style={styles.processStep}>
              <div style={styles.stepNumber}>3</div>
              <h3>Delivery</h3>
              <p>Kits shipped directly to employees</p>
            </div>
            <div style={styles.processArrow}>→</div>
            <div style={styles.processStep}>
              <div style={styles.stepNumber}>4</div>
              <h3>Engagement</h3>
              <p>Monthly activities and follow-ups</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section style={styles.formSection}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.formTitle}>Start Your Engagement Journey</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <input
                type="text"
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Contact Person"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                style={styles.input}
                required
              />
              <input
                type="email"
                placeholder="Work Email"
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
                type="number"
                placeholder="Number of Employees"
                value={formData.employees}
                onChange={(e) => setFormData({...formData, employees: e.target.value})}
                style={styles.input}
                required
              />
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                style={styles.input}
              >
                <option value="monthly">Monthly Delivery</option>
                <option value="quarterly">Quarterly Delivery</option>
                <option value="bi-monthly">Bi-Monthly Delivery</option>
              </select>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                style={styles.input}
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
              <select
                value={formData.kitType}
                onChange={(e) => setFormData({...formData, kitType: e.target.value})}
                style={styles.input}
              >
                <option value="standard">Standard Kit</option>
                <option value="premium">Premium Kit</option>
                <option value="custom">Custom Kit</option>
              </select>
            </div>
            <textarea
              placeholder="Special requirements or company culture notes..."
              value={formData.customRequirements}
              onChange={(e) => setFormData({...formData, customRequirements: e.target.value})}
              style={styles.textarea}
              rows={4}
            />
            <button type="submit" style={styles.submitButton}>
              Get Kit Samples & Pricing
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
    marginBottom: '40px',
    opacity: 0.9,
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    flexWrap: 'wrap' as const,
  },
  stat: {
    textAlign: 'center' as const,
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '16px',
    opacity: 0.9,
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
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  kitGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    marginTop: '40px',
  },
  kitCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  kitName: {
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '10px',
    color: '#1a1a1a',
  },
  kitPrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: '20px',
  },
  kitIncludes: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '20px',
    textAlign: 'left' as const,
  },
  kitItem: {
    marginBottom: '10px',
    padding: '5px 0',
  },
  kitFrequency: {
    backgroundColor: '#f0f0f0',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 600,
    display: 'inline-block',
  },
  process: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap' as const,
    marginTop: '40px',
  },
  processStep: {
    flex: 1,
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '15px',
    textAlign: 'center' as const,
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    minWidth: '200px',
  },
  stepNumber: {
    width: '50px',
    height: '50px',
    backgroundColor: '#FF6B35',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 auto 20px',
  },
  processArrow: {
    fontSize: '30px',
    color: '#FF6B35',
    fontWeight: 'bold',
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

export default CorporateKitsPage;