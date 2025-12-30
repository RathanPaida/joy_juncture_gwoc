'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
// import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="toggle-track">
        <div className="toggle-thumb">
          {theme === 'dark' ? (
            // Moon icon for dark mode
            <svg className="toggle-icon moon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.4,13.7C20.6,13.9,19.8,14,19,14c-5,0-9-4-9-9c0-0.8,0.1-1.6,0.3-2.4c0.1-0.3,0-0.7-0.3-1 c-0.3-0.3-0.6-0.4-1-0.3C4.3,2.7,1,7.1,1,12c0,6.1,4.9,11,11,11c4.9,0,9.3-3.3,10.6-8.1c0.1-0.3,0-0.7-0.3-1 C22.1,13.7,21.7,13.6,21.4,13.7z"/>
            </svg>
          ) : (
            // Sun icon for light mode
            <svg className="toggle-icon sun" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,9c1.7,0,3,1.3,3,3s-1.3,3-3,3s-3-1.3-3-3S10.3,9,12,9z M12,7c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S14.8,7,12,7z M2,13 h2c0.6,0,1-0.4,1-1s-0.4-1-1-1H2c-0.6,0-1,0.4-1,1S1.4,13,2,13z M20,13h2c0.6,0,1-0.4,1-1s-0.4-1-1-1h-2c-0.6,0-1,0.4-1,1 S19.4,13,20,13z M11,2v2c0,0.6,0.4,1,1,1s1-0.4,1-1V2c0-0.6-0.4-1-1-1S11,1.4,11,2z M11,20v2c0,0.6,0.4,1,1,1s1-0.4,1-1v-2 c0-0.6-0.4-1-1-1S11,19.4,11,20z M5.6,6.6l1.4,1.4C7.4,8.4,7.9,8.6,8.4,8.6s1-0.2,1.4-0.6c0.8-0.8,0.8-2,0-2.8L8.4,4.2 c-0.8-0.8-2-0.8-2.8,0S4.8,5.8,5.6,6.6z M18.4,17.4l-1.4-1.4c-0.8-0.8-2-0.8-2.8,0s-0.8,2,0,2.8l1.4,1.4c0.4,0.4,0.9,0.6,1.4,0.6 s1-0.2,1.4-0.6C19.2,19.4,19.2,18.2,18.4,17.4z M4.2,15.6l1.4-1.4c0.8-0.8,0.8-2,0-2.8s-2-0.8-2.8,0l-1.4,1.4c-0.8,0.8-0.8,2,0,2.8 C2.2,16.4,3.4,16.4,4.2,15.6z M19.8,8.4l-1.4,1.4c-0.4,0.4-0.4,1,0,1.4c0.4,0.4,1,0.4,1.4,0l1.4-1.4c0.8-0.8,0.8-2,0-2.8 S20.6,7.6,19.8,8.4z"/>
            </svg>
          )}
        </div>
      </div>
      <span className="toggle-label">
        {theme === 'dark' ? 'Dark' : 'Light'} Mode
      </span>
    </button>
  );
};

export default ThemeToggle;