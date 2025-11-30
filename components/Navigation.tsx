"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  HeartHandshake,
  Home,
  Users,
  UserPlus,
  LogIn,
  Bell,
  FileText,
  Building,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [pendingEnrollmentCount, setPendingEnrollmentCount] = useState(0);

  const fetchAnnouncementCount = async () => {
    try {
      // Get user info from localStorage if available
      const parentInfo = localStorage.getItem("parentInfo");
      const userId = localStorage.getItem("userId");
      const sessionId = localStorage.getItem("sessionId");

      let userEmail = null;
      if (parentInfo) {
        const parent = JSON.parse(parentInfo);
        userEmail = parent.email;
      } else if (sessionId) {
        // For anonymous users, use session email
        userEmail = sessionId + "@anonymous.local";
      }

      // Build URL with user parameters
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (userEmail) params.append("userEmail", userEmail);

      const response = await fetch(
        `/api/announcements/count?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnnouncementCount(data.count);
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  useEffect(() => {
    fetchAnnouncementCount();
    fetchPendingEnrollmentCount();

    // Listen for announcement view events
    const handleAnnouncementViewed = () => {
      // Immediately decrease count by 1 as a quick response
      setAnnouncementCount((prev) => Math.max(0, prev - 1));
      // Then fetch the actual count from API
      fetchAnnouncementCount();
    };

    // Fallback: Check for updates every 5 seconds when on announcements page
    const checkForUpdates = () => {
      if (window.location.pathname === "/announcements") {
        fetchAnnouncementCount();
      }
    };

    const interval = setInterval(checkForUpdates, 5000);

    window.addEventListener("announcementViewed", handleAnnouncementViewed);

    // Also listen for storage changes (in case user info changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "parentInfo" ||
        e.key === "userId" ||
        e.key === "sessionId"
      ) {
        fetchAnnouncementCount();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "announcementViewed",
        handleAnnouncementViewed
      );
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const fetchPendingEnrollmentCount = async () => {
    try {
      const res = await fetch("/api/enrollment-requests?status=pending");
      if (!res.ok) return setPendingEnrollmentCount(0);
      const data = await res.json();
      setPendingEnrollmentCount((data?.data || []).length ?? 0);
    } catch (err) {
      // ignore errors
      setPendingEnrollmentCount(0);
    }
  };

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Rooms", href: "#room-availability", icon: Building },
    {
      name: "Enrollment",
      href: "/dashboard/enrollment-requests",
      icon: UserPlus,
      showCount: true,
    },
    { name: "Services", href: "#services", icon: HeartHandshake },
    {
      name: "Announcements",
      href: "/announcements",
      icon: Bell,
      showCount: true,
    },
    { name: "Requirements", href: "#requirements", icon: FileText },
    { name: "Contact", href: "#contact", icon: Users },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 backdrop-blur-sm">
                <Image
                  src="/Logo_of_Ethiopian_INSA.png"
                  alt="INSA Daycare Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  INSA Daycare
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  Management System
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.showCount && item.name === "Announcements" && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {announcementCount}
                        </span>
                      )}
                      {item.showCount && item.name === "Enrollment" && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {pendingEnrollmentCount}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Auth Buttons - Right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3 flex-shrink-0"
          >
            <div className="hidden lg:flex items-center space-x-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full px-4 py-2 text-sm font-medium"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-5 py-2 text-sm font-bold shadow-lg shadow-slate-200 transition-all duration-200">
                  Sign Up
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-slate-200"
          >
            <div className="px-2 pt-2 pb-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-all duration-200 font-medium text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.showCount && (
                      <>
                        {item.name === "Announcements" && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {announcementCount}
                          </span>
                        )}
                        {item.name === "Enrollment" && (
                          <span className="bg-rose-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {pendingEnrollmentCount}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <Link
                  href="/login"
                  className="block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-center space-x-2 text-slate-600 hover:bg-slate-50 rounded-md py-2 text-sm font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </Button>
                </Link>
                <Link
                  href="/signup"
                  className="block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-md py-2 text-sm font-bold">
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
