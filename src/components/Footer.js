"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Facebook, Twitter, Youtube, Instagram, Github, Mail } from "lucide-react";
import ReactGA from "react-ga4";

const Footer = () => {
  useEffect(() => {
    ReactGA.initialize("G-VYBMV6GVQQ");
    ReactGA.send("pageview");
    console.log("Sending the Google Analytics data");
  }, []);

  return (
    <footer className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top: Brand + Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center">
              <span className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">10Tracker.com</span>
            </Link>
            <p className="text-sm text-gray-600 leading-6">
              Practice smarter. Stay updated with curated articles, results, answer keys, admit cards and the latest exam news.
            </p>
          </div>

          {/* Company Links (Horizontal) */}
          <div className="flex flex-col md:items-center md:justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Company</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="https://10tracker.com/about/" className="text-sm text-gray-700 hover:text-gray-900">About</Link>
              <span className="hidden md:inline text-gray-300">•</span>
              <Link href="https://10tracker.com/contact/" className="text-sm text-gray-700 hover:text-gray-900">Contact</Link>
              <span className="hidden md:inline text-gray-300">•</span>
              <Link href="https://10tracker.com/privacy/" className="text-sm text-gray-700 hover:text-gray-900">Privacy</Link>
              <span className="hidden md:inline text-gray-300">•</span>
              <Link href="https://10tracker.com/terms/" className="text-sm text-gray-700 hover:text-gray-900">Terms</Link>
            </div>
          </div>

          {/* Newsletter / Social */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Stay in touch</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email for updates"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-sm"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black">
                Subscribe
              </button>
            </form>
            <div className="flex items-center gap-3 pt-1">
              <Link href="mailto:support@10tracker.com" className="p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"><Mail size={16} /></Link>
              <Link href="https://twitter.com" className="p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"><Twitter size={16} /></Link>
              <Link href="https://facebook.com" className="p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"><Facebook size={16} /></Link>
              <Link href="https://instagram.com" className="p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"><Instagram size={16} /></Link>
              <Link href="https://youtube.com" className="p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"><Youtube size={16} /></Link>
              <Link href="https://github.com" className="p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"><Github size={16} /></Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} 10tracker. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="https://10tracker.com/privacy/" className="hover:text-gray-900">Privacy</Link>
            <span className="text-gray-300">•</span>
            <Link href="https://10tracker.com/terms/" className="hover:text-gray-900">Terms</Link>
            <span className="text-gray-300">•</span>
            <Link href="/articles" className="hover:text-gray-900">Articles</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
