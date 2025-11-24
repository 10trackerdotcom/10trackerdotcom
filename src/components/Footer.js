"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Twitter, Instagram, Mail } from "lucide-react";
import ReactGA from "react-ga4";

const Footer = () => {
  useEffect(() => {
    ReactGA.initialize("G-VYBMV6GVQQ");
    ReactGA.send("pageview");
    console.log("Sending the Google Analytics data");
  }, []);

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top: Brand + Social */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 pb-8">
          {/* Brand Section - Left */}
          <div className="flex flex-col items-start max-w-md">
            <div className="border-2 border-black px-3 md:px-4 py-1.5 mb-3">
              <span className="text-lg md:text-xl font-semibold text-black tracking-wide">
                10tracker.com
              </span>
            </div>
            <p className="text-sm md:text-base text-gray-600 italic font-light leading-relaxed">
              Get the latest news, insights, and updates summarized into 10 clear and easy-to-read points. Stay informed quickly and efficiently with 10tracker.
            </p>
          </div>

          {/* Social Section - Right */}
          <div className="flex flex-col items-start md:items-end">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-4">STAY IN TOUCH</p>
            <div className="flex items-center gap-3">
              <Link 
                href="mailto:jain10gunjan@gmail.com" 
                className="w-10 h-10 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                aria-label="Email"
              >
                <Mail size={18} />
              </Link>
              <Link 
                href="https://x.com/10Tracker" 
                className="w-10 h-10 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </Link>
              <Link 
                href="https://www.instagram.com/10tracker/" 
                className="w-10 h-10 rounded-md border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} 10tracker. All rights reserved.</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <span className="text-gray-300">•</span>
            <Link href="/terms-and-services" className="hover:text-gray-700 transition-colors">Terms</Link>
            <span className="text-gray-300">•</span>
            <Link href="/disclaimer" className="hover:text-gray-700 transition-colors">Disclaimer</Link>
            <span className="text-gray-300">•</span>
            <Link href="/articles" className="hover:text-gray-700 transition-colors">Articles</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
