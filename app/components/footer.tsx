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
const policySection = 'cookies';
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
        </div>

        {/* Middle Column: Quick Links */}
        <div className="footer-links">
          <div className="link-group">
            <h3>PLAY</h3>
            <ul>
              <li>
                <Link href="/zone">All Games</Link>
              </li>
              <li>
                <Link href="/zone">Board Games</Link>
              </li>
              <li>
                <Link href="/zone">Card Games</Link>
              </li>
              <li>
                <Link href="/store">Store</Link>
              </li>
              <li>
                <Link href="/zone">Game Archives</Link>
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
                <Link href="/walletandpoints">Leaderboard</Link>
              </li>
              <li>
                <Link href="/walletandpoints">Token Vault</Link>
              </li>
              <li>
                <Link href="/walletandpoints">System Rewards</Link>
              </li>
            </ul>
          </div>

          <div className="link-group">
            <h3>SUPPORT</h3>
            <ul>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/cart">Shipping & Returns</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
              <li>
                <Link href="/about">Wholesale</Link>
              </li>
              <li>
                <Link href="/about">Careers</Link>
              </li>
            </ul>
          </div>
        </div>

    
          <div className="legal-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Cookie Policy</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/shipping-policy">Shipping Policy</Link>
            <Link href="/cancellation-policy">Cancellation Policy</Link>
            <span className="copyright">
              © {new Date().getFullYear()} JoyJuncture. Forge your legacy.
            </span>
          </div>
        </div>
    </footer>
  );
};

export default Footer;