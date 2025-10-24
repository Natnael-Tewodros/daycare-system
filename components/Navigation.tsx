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
  Building
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(0);

  const fetchAnnouncementCount = async () => {
    try {
      // Get user info from localStorage if available
      const parentInfo = localStorage.getItem('parentInfo');
      const userId = localStorage.getItem('userId');
      const sessionId = localStorage.getItem('sessionId');
      
      let userEmail = null;
      if (parentInfo) {
        const parent = JSON.parse(parentInfo);
        userEmail = parent.email;
      } else if (sessionId) {
        // For anonymous users, use session email
        userEmail = sessionId + '@anonymous.local';
      }

      // Build URL with user parameters
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (userEmail) params.append('userEmail', userEmail);

      const response = await fetch(`/api/announcements/count?${params.toString()}`);
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

    // Listen for announcement view events
    const handleAnnouncementViewed = () => {
      // Immediately decrease count by 1 as a quick response
      setAnnouncementCount(prev => Math.max(0, prev - 1));
      // Then fetch the actual count from API
      fetchAnnouncementCount();
    };

    // Fallback: Check for updates every 5 seconds when on announcements page
    const checkForUpdates = () => {
      if (window.location.pathname === '/announcements') {
        fetchAnnouncementCount();
      }
    };
    
    const interval = setInterval(checkForUpdates, 5000);

    window.addEventListener('announcementViewed', handleAnnouncementViewed);
    
    // Also listen for storage changes (in case user info changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'parentInfo' || e.key === 'userId' || e.key === 'sessionId') {
        fetchAnnouncementCount();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('announcementViewed', handleAnnouncementViewed);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);


  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "#about", icon: Building },
    { name: "Services", href: "#services", icon: HeartHandshake },
    { name: "Announcements", href: "/announcements", icon: Bell, showCount: true },
    { name: "Requirements", href: "#requirements", icon: FileText },
    { name: "Apply", href: "/parent-application", icon: UserPlus },
    { name: "Contact", href: "#contact", icon: Users },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gray-50 shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-800">
                <Image
                  src="/Logo_of_Ethiopian_INSA.png"
                  alt="INSA Daycare Logo"
                  width={26}
                  height={26}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-blue-900">INSA Daycare</h1>
                <p className="text-xs text-blue-600">Management System</p>
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
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md transition-all duration-200 font-medium text-sm"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.showCount && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {announcementCount}
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
            <div className="hidden lg:flex items-center space-x-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-md px-4 py-2 text-sm font-medium"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  className="bg-orange-400 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm font-medium shadow-md hover:shadow-full transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200 font-medium text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.showCount && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                        {announcementCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Link href="/login" className="block" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md py-2 text-sm font-medium"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link href="/signup" className="block" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    className="w-full bg-orange-400 hover:bg-orange-700 text-white rounded-md py-2 text-sm font-medium"
                  >
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