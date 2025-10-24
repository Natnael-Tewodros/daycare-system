"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  HeartHandshake,
  Utensils,
  Gamepad2,
  Bed,
  GraduationCap,
  Stethoscope,
  FileText,
  Calendar,
  Users,
  Building,
  Star,
  CheckCircle,
  Bell,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  isActive: boolean;
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/announcements");
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.filter((ann: Announcement) => ann.isActive));
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAnnouncementAsViewed = async (announcementId: number) => {
    try {
      // Get user info from localStorage if available
      const parentInfo = localStorage.getItem('parentInfo');
      const userId = localStorage.getItem('userId');
      
      let userEmail = null;
      if (parentInfo) {
        const parent = JSON.parse(parentInfo);
        userEmail = parent.email;
      }

      // For anonymous users, generate a session ID
      let sessionEmail = null;
      if (!userId && !userEmail) {
        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('sessionId', sessionId);
        }
        sessionEmail = sessionId + '@anonymous.local';
      }

      const response = await fetch(`/api/announcements/${announcementId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || null,
          userEmail: userEmail || sessionEmail || null
        }),
      });

      // Dispatch event to update announcement count
      window.dispatchEvent(new CustomEvent('announcementViewed'));
    } catch (error) {
      console.error('Error marking announcement as viewed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "important":
        return <Bell className="h-5 w-5 text-red-600" />;
      case "general":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "event":
        return <Calendar className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "important":
        return "bg-red-50 border-red-200";
      case "general":
        return "bg-blue-50 border-blue-200";
      case "event":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-yellow-50">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[700px] overflow-hidden"
      >
        <Image
          src="/caregiver.jpg"
          alt="Professional Caregivers"
          fill
          className="object-cover brightness-75"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-orange-900/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-white max-w-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              >
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-semibold">Trusted Childcare Since 2010</span>
              </motion.div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
                Where Little Dreams
                <span className="block text-orange-300">Begin to Grow</span>
              </h1>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-800 px-4 py-2 text-sm font-semibold">
                <Bell className="h-4 w-4 mr-2" />
                Latest Updates
              </Badge>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Announcements & News</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Stay informed with the latest updates from our daycare center
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {announcements.slice(0, 3).map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group cursor-pointer"
                  onClick={() => markAnnouncementAsViewed(announcement.id)}
                >
                  <Card className={`${getAnnouncementColor(announcement.type)} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                    <div className="absolute top-4 right-4">
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="capitalize font-medium">
                          {announcement.type}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatDate(announcement.createdAt)}</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors">
                        {announcement.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{announcement.content}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* About Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          id="about"
          className="mb-20"
        >
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-800 px-4 py-2 text-sm font-semibold">
              <Building className="h-4 w-4 mr-2" />
              About Us
            </Badge>
            <h2 className="text-4xl font-extrabold text-blue-800 mb-4">Why Choose Our Daycare?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We provide a safe, nurturing, and educational environment where children thrive. Our dedicated caregivers and comprehensive programs ensure every child receives exceptional care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8 text-blue-600" />,
                title: "Certified Safety",
                description: "Fully licensed and certified with state-of-the-art security systems and protocols.",
              },
              {
                icon: <Clock className="h-8 w-8 text-orange-600" />,
                title: "Flexible Hours",
                description: "Extended hours to accommodate working parents with early drop-off and late pick-up options.",
              },
              {
                icon: <Sparkles className="h-8 w-8 text-yellow-600" />,
                title: "Quality Programs",
                description: "Developmentally appropriate curriculum designed by early childhood education experts.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="group"
              >
                <Card className="text-center border-2 border-blue-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 backdrop-blur-sm">
                  <CardContent className="pt-8 pb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-blue-800 group-hover:text-orange-600 transition-colors">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Services Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          id="services"
          className="mb-20"
        >
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-800 px-4 py-2 text-sm font-semibold">
              <HeartHandshake className="h-4 w-4 mr-2" />
              Our Services
            </Badge>
            <h2 className="text-4xl font-extrabold text-blue-800 mb-4">Comprehensive Childcare Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything your child needs for healthy development and happy learning
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Utensils className="h-6 w-6 text-orange-600" />,
                title: "Nutritious Meals",
                description: "Healthy, balanced meals and snacks prepared fresh daily.",
                items: ["Breakfast, lunch, and snacks", "Special dietary accommodations", "Fresh fruits and vegetables"],
              },
              {
                icon: <Gamepad2 className="h-6 w-6 text-blue-600" />,
                title: "Educational Games",
                description: "Age-appropriate games promoting learning and creativity.",
                items: ["Interactive learning games", "Creative arts and crafts", "Group activities and teamwork"],
              },
              {
                icon: <Bed className="h-6 w-6 text-yellow-600" />,
                title: "Comfortable Rest",
                description: "Safe and comfortable sleeping areas for rest and relaxation.",
                items: ["Individual sleeping spaces", "Clean, comfortable bedding", "Scheduled nap times"],
              },
              {
                icon: <GraduationCap className="h-6 w-6 text-blue-600" />,
                title: "Life Skills Training",
                description: "Developing independence, problem-solving, and social skills.",
                items: ["Self-care and hygiene", "Communication skills", "Problem-solving activities"],
              },
              {
                icon: <Stethoscope className="h-6 w-6 text-orange-600" />,
                title: "Health Monitoring",
                description: "Regular health checks and emergency care when needed.",
                items: ["Daily health assessments", "Medication management", "Emergency first aid"],
              },
              {
                icon: <HeartHandshake className="h-6 w-6 text-yellow-600" />,
                title: "Emotional Support",
                description: "Guidance to develop confidence and emotional intelligence.",
                items: ["Individual attention", "Emotional guidance", "Positive reinforcement"],
              },
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="border-2 border-orange-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        {service.icon}
                      </div>
                      <CardTitle className="text-xl font-bold text-orange-800 group-hover:text-blue-800 transition-colors">
                        {service.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                    <ul className="text-sm text-gray-500 space-y-3">
                      {service.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 group/item">
                          <CheckCircle className="h-4 w-4 text-green-600 group-hover/item:scale-110 transition-transform" />
                          <span className="group-hover/item:text-gray-700 transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Requirements Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          id="requirements"
          className="mb-12"
        >
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-2 bg-green-100 text-green-800 px-3 py-1 text-sm font-semibold">
              <FileText className="h-4 w-4 mr-2" />
              Enrollment
            </Badge>
            <h2 className="text-3xl font-extrabold text-blue-800 mb-3">
              Enrollment Requirements
            </h2>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              Key information for joining our daycare program
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: "Required Documents",
                icon: <FileText className="h-4 w-4 text-blue-600" />,
                items: [
                  "Medical Report",
                  "Birth Certificate",
                  "Vaccination Records",
                  "Parent/Guardian ID",
                  "Emergency Contacts",
                  "2 Passport Photos",
                ],
              },
              {
                title: "Personal Items",
                icon: <Utensils className="h-4 w-4 text-orange-600" />,
                items: [
                  "Extra Clothes",
                  "Blanket",
                  "Diapers/Wipes",
                  "Water Bottle",
                  "Comfort Item",
                  "Outerwear",
                ],
              },
            ].map((req, index) => (
              <motion.div
                key={index}
                initial={{ x: index === 0 ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <Card className="border-2 border-blue-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-blue-50/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-800 text-lg font-bold group-hover:text-orange-700 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        {req.icon}
                      </div>
                      {req.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {req.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50/50 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 group-hover/item:scale-105 transition-transform" />
                          <span className="text-sm text-gray-600 group-hover/item:text-gray-800 transition-colors">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}