import React from 'react';
import './about.css';
import { FaGamepad, FaUsers, FaHeart, FaAward, FaLightbulb, FaSmile } from 'react-icons/fa';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1>Where Every Game is a <span className="highlight">Memory in the Making</span></h1>
          <p className="subtitle">We don't just sell games. We create moments, foster connections, and build communities through shared play.</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">5000+</span>
              <span className="stat-label">Happy Players</span>
            </div>
            <div className="stat">
              <span className="stat-number">200+</span>
              <span className="stat-label">Events Hosted</span>
            </div>
            <div className="stat">
              <span className="stat-number">15+</span>
              <span className="stat-label">Original Games</span>
            </div>
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Corporate Clients</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-placeholder">
            {/* In production, replace with actual image */}
            <div className="image-mockup">
              <div className="mockup-content">
                <FaUsers className="mockup-icon" />
                <p>People playing & laughing together</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="philosophy-section">
        <div className="section-header">
          <h2>Our <span className="highlight">Playful</span> Philosophy</h2>
          <p className="section-subtitle">The core beliefs that guide everything we do at Joy Juncture</p>
        </div>
        
        <div className="philosophy-cards">
          <div className="philosophy-card">
            <div className="card-icon">
              <FaHeart />
            </div>
            <h3>Games Create Bonds</h3>
            <p>We believe games are the ultimate social glue - bringing people together, breaking barriers, and creating lasting memories.</p>
          </div>
          
          <div className="philosophy-card">
            <div className="card-icon">
              <FaGamepad />
            </div>
            <h3>Play is Productive</h3>
            <p>Play isn't just for fun. It builds teams, sparks creativity, solves problems, and teaches valuable life skills.</p>
          </div>
          
          <div className="philosophy-card">
            <div className="card-icon">
              <FaUsers />
            </div>
            <h3>Community First</h3>
            <p>Our players aren't customers - they're part of our growing community of game enthusiasts and joy-seekers.</p>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="founder-story">
        <div className="section-header">
          <h2>The <span className="highlight">Story</span> Behind the Joy</h2>
          <p className="section-subtitle">How one game night changed everything</p>
        </div>
        
        <div className="story-timeline">
          <div className="timeline-item">
            <div className="timeline-date">2018</div>
            <div className="timeline-content">
              <h3>The Spark</h3>
              <p>Our founder organized a game night for friends during a difficult time, realizing how games could lift spirits and connect people.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-date">2019</div>
            <div className="timeline-content">
              <h3>First Prototype</h3>
              <p>Created "Dead Man's Deck" - a custom card game that became an instant hit at parties and gatherings.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-date">2020</div>
            <div className="timeline-content">
              <h3>Pandemic Pivot</h3>
              <p>Started virtual game nights when physical gatherings paused, discovering the power of digital connection through play.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-date">2022</div>
            <div className="timeline-content">
              <h3>Joy Juncture Born</h3>
              <p>Officially launched with 5 original games and a mission to make every gathering more joyful through play.</p>
            </div>
          </div>
          
          <div className="timeline-item">
            <div className="timeline-date">Today</div>
            <div className="timeline-content">
              <h3>Growing Community</h3>
              <p>15+ original games, 200+ events, thousands of players, and a growing community of joy-seekers.</p>
            </div>
          </div>
        </div>
        
        <div className="founder-quote">
          <div className="quote-icon">
            <FaSmile />
          </div>
          <blockquote>
            "Games aren't just about winning or losing. They're about the laughter in between, the stories created, and the connections forged. At Joy Juncture, we're not just making games - we're crafting experiences that turn ordinary moments into extraordinary memories."
          </blockquote>
          <div className="quote-author">
            <span className="author-name">— Founder, Joy Juncture</span>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="values-section">
        <div className="section-header">
          <h2>Our <span className="highlight">Core</span> Values</h2>
          <p className="section-subtitle">The principles that guide our every move</p>
        </div>
        
        <div className="values-grid">
          <div className="value-item">
            <div className="value-icon">
              <FaLightbulb />
            </div>
            <h3>Creativity</h3>
            <p>We approach everything with a playful, innovative mindset.</p>
          </div>
          
          <div className="value-item">
            <div className="value-icon">
              <FaUsers />
            </div>
            <h3>Inclusivity</h3>
            <p>Everyone is welcome at our table, regardless of skill level.</p>
          </div>
          
          <div className="value-item">
            <div className="value-icon">
              <FaHeart />
            </div>
            <h3>Authenticity</h3>
            <p>We keep it real, from our games to our interactions.</p>
          </div>
          
          <div className="value-item">
            <div className="value-icon">
              <FaAward />
            </div>
            <h3>Excellence</h3>
            <p>Every game, every event, every experience is crafted with care.</p>
          </div>
        </div>
      </section>

      {/* Join the Community */}
      <section className="join-community">
        <div className="join-content">
          <h2>Ready to Play Your Part?</h2>
          <p>Join thousands of players who've discovered the joy of shared play.</p>
          <div className="join-actions">
            <a href="/community" className="btn-primary">Explore Community</a>
            <a href="/events" className="btn-secondary">Join an Event</a>
          </div>
        </div>
        <div className="join-image">
          <div className="image-mockup">
            <div className="mockup-content">
              <FaGamepad className="mockup-icon" />
              <p>Community members playing together</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;