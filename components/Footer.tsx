"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                <Image
                  src="/Logo_of_Ethiopian_INSA.png"
                  alt="INSA Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">INSA Daycare</h3>
                <p className="text-xs text-slate-500">Management System</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Providing exceptional childcare services with love, care, and professional expertise.
              We nurture young minds and create a safe, educational environment for your children.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                  Announcements
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                  Signup
                </Link>
              </li>
              <li>
                <Link href="/parent-application" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                  Request
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Our Services</h4>
            <ul className="space-y-2">
              <li className="text-slate-500 text-sm">Nutritious Meals</li>
              <li className="text-slate-500 text-sm">Educational Games</li>
              <li className="text-slate-500 text-sm">Comfortable Rest</li>
              <li className="text-slate-500 text-sm">Life Skills Training</li>
              <li className="text-slate-500 text-sm">Health Monitoring</li>
              <li className="text-slate-500 text-sm">Emotional Support</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-sm">
                    Addis Ababa, Ethiopia<br />
                    Near INSA Building
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <p className="text-slate-500 text-sm">+251 11 123 4567</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                <p className="text-slate-500 text-sm">info@insadaycare.et</p>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-sm">
                    Mon - Fri: 8:00 AM - 11:00 PM<br />
                    Sat: 2:00 AM - 12:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2025 INSA Daycare Management System. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-slate-400 hover:text-slate-900 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-slate-400 hover:text-slate-900 text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-slate-400 hover:text-slate-900 text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
