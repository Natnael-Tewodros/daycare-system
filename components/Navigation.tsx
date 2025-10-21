"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  HeartHandshake, 
  Home, 
  Users, 
  UserCheck, 
  LogIn, 
  UserPlus,
  Bell,
  FileText,
  BarChart3,
  Building
} from "lucide-react";
import Image from "next/image";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "#about", icon: Building },
    { name: "Services", href: "#services", icon: HeartHandshake },
    { name: "Announcements", href: "/announcements", icon: Bell },
    { name: "Requirements", href: "#requirements", icon: FileText },
    { name: "Apply", href: "/parent-application", icon: UserPlus },
    { name: "Contact", href: "#contact", icon: Users },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg sticky top-0 z-50 border-b-2 border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo - Left */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-start shadow-md border border-gray-200">
                <Image
                  src="/Logo_of_Ethiopian_INSA.png"
                  alt="INSA Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-blue-800 leading-tight">INSA Daycare</h1>
                <p className="text-xs text-blue-600 leading-tight">Management System</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-1 text-blue-700 hover:text-orange-500 hover:bg-orange-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side - Auth Buttons + Mobile Menu */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="flex items-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl flex items-center space-x-2 transition-all duration-200">
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-blue-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gradient-to-b from-blue-50 to-orange-50 border-t-2 border-orange-200">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-blue-700 hover:text-orange-500 hover:bg-orange-100 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t-2 border-orange-200 space-y-2">
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full flex items-center justify-center space-x-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg flex items-center justify-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
