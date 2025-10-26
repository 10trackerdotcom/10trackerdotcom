"use client";
import React, { useEffect } from "react";
import ReactGA from "react-ga4";

const Footer = () => {
  useEffect(() => {
    ReactGA.initialize("G-VYBMV6GVQQ");
    ReactGA.send("pageview");
    console.log("Sending the Google Analytics data");
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">
              10Tracker.com
            </span>
          </div>

          {/* Bottom Section */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              &copy; 2025 10tracker. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
