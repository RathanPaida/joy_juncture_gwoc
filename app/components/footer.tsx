// components/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import "./Footer.css";

const Footer: React.FC = () => {
  const handleJoinClick = () => {
    console.log("Join the Collective clicked");
    // Add your join logic here, e.g., redirect to signup or open modal
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter submitted");
    // Add your newsletter signup logic here
  };

  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Left Column: Brand & Motto */}
        <div className="footer-brand">
          <div className="logo-container">
            <span className="logo-icon">🎮</span>
            <span className="logo-text">JoyJuncture</span>
          </div>
          <p className="brand-motto">
            JOIN THE COLLECTIVE. FUEL THE VIBE. WIN THE NIGHT.
          </p>
          <p className="brand-tagline">
            We don&apos;t just sell games. We create legends.
          </p>
          <button
            className="btn-join"
            onClick={handleJoinClick}
            aria-label="Join the JoyJuncture community"
          >
            JOIN THE COLLECTIVE
          </button>
        </div>

        {/* Middle Column: Quick Links */}
        <div className="footer-links">
          <div className="link-group">
            <h3>PLAY</h3>
            <ul>
              <li>
                <Link href="/games">All Games</Link>
              </li>
              <li>
                <Link href="/games/board">Board Games</Link>
              </li>
              <li>
                <Link href="/games/card">Card Games</Link>
              </li>
              <li>
                <Link href="/games/new">New Releases</Link>
              </li>
              <li>
                <Link href="/archives">Game Archives</Link>
              </li>
            </ul>
          </div>

          <div className="link-group">
            <h3>EXPERIENCE</h3>
            <ul>
              <li>
                <Link href="/events">Events</Link>
              </li>
              <li>
                <Link href="/community">Community</Link>
              </li>
              <li>
                <Link href="/leaderboard">Leaderboard</Link>
              </li>
              <li>
                <Link href="/vault">Token Vault</Link>
              </li>
              <li>
                <Link href="/rewards">System Rewards</Link>
              </li>
            </ul>
          </div>

          <div className="link-group">
            <h3>SUPPORT</h3>
            <ul>
              <li>
                <Link href="/faq">Game Guides & FAQ</Link>
              </li>
              <li>
                <Link href="/shipping">Shipping & Returns</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
              <li>
                <Link href="/wholesale">Wholesale</Link>
              </li>
              <li>
                <Link href="/careers">Careers</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Community & Legal */}
        <div className="footer-legal">
          <div className="community-updates">
            <h3>🔥 LIVE NOW</h3>
            <p className="live-stats">
              1,240 PLAYERS ONLINE • LEADERBOARD RESET IN 2 DAYS
            </p>
          </div>

          <div className="newsletter">
            <h3>Get Game Night Tips</h3>
            <p>Strategies, new releases, and event invites.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Your email"
                required
                aria-label="Email address for newsletter"
              />
              <button type="submit">SUBSCRIBE</button>
            </form>
          </div>

          <div className="legal-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookie Policy</Link>
            <span className="copyright">
              © {new Date().getFullYear()} JoyJuncture. Forge your legacy.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
