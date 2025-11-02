"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Building,
  CheckCircle,
  Bell,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Award,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  isActive: boolean;
  isRead: boolean;
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const parentInfo = localStorage.getItem('parentInfo');
      const userId = localStorage.getItem('userId');
      
      let userEmail = null;
      if (parentInfo) {
        const parent = JSON.parse(parentInfo);
        userEmail = parent.email;
      }

      let sessionEmail = null;
      if (!userId && !userEmail) {
        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('sessionId', sessionId);
        }
        sessionEmail = sessionId + '@anonymous.local';
      }

      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (userEmail) params.append('userEmail', userEmail);
      if (sessionEmail) params.append('userEmail', sessionEmail);

      const response = await fetch(`/api/announcements/with-status?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.filter((ann: Announcement) => !ann.isRead));
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAnnouncementAsViewed = async (announcementId: number) => {
    try {
      const parentInfo = localStorage.getItem('parentInfo');
      const userId = localStorage.getItem('userId');
      
      let userEmail = null;
      if (parentInfo) {
        const parent = JSON.parse(parentInfo);
        userEmail = parent.email;
      }

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

      if (response.ok) {
        setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
        window.dispatchEvent(new CustomEvent('announcementViewed'));
      }
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[80vh] min-h-[600px] overflow-hidden"
      >
        <Image
          src="/caregiver.jpg"
          alt="Professional Caregivers"
          fill
          className="object-cover brightness-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/60 flex items-center">
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
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/30"
              >
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-lg font-semibold">Trusted Childcare Since 2010</span>
              </motion.div>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight tracking-tight">
                Where Little
                <span className="block bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                  Dreams Grow
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                Nurturing young minds with love, learning, and laughter in a safe environment designed for growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg">
                  Enroll Today <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 px-8 py-4 text-lg rounded-xl font-semibold">
                  Learn More
                </Button>
              </div>
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
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 text-base font-semibold border-0">
                <Bell className="h-5 w-5 mr-2" />
                Latest Updates
              </Badge>
              <h2 className="text-5xl font-black text-gray-900 mb-6">Announcements & News</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
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
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group cursor-pointer"
                  onClick={() => markAnnouncementAsViewed(announcement.id)}
                >
                  <Card className={`${getAnnouncementColor(announcement.type)} border-2 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
                    <div className="absolute top-6 right-6">
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <CardHeader className="pb-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="secondary" className="capitalize font-semibold text-sm px-3 py-1">
                          {announcement.type}
                        </Badge>
                        <span className="text-sm text-gray-500 font-medium">{formatDate(announcement.createdAt)}</span>
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors leading-tight">
                        {announcement.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed text-lg">{announcement.content}</p>
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
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 text-base font-semibold border-0">
              <Building className="h-5 w-5 mr-2" />
              About Us
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-6">Why Choose Our Daycare?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We provide a safe, nurturing, and educational environment where children thrive. Our dedicated caregivers and comprehensive programs ensure every child receives exceptional care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-10 w-10 text-white" />,
                title: "Certified Safety",
                description: "Fully licensed and certified with state-of-the-art security systems and protocols.",
              },
              {
                icon: <Clock className="h-10 w-10 text-white" />,
                title: "Flexible Hours",
                description: "Extended hours to accommodate working parents with early drop-off and late pick-up options.",
              },
              {
                icon: <Award className="h-10 w-10 text-white" />,
                title: "Quality Programs",
                description: "Developmentally appropriate curriculum designed by early childhood education experts.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.05 }}
                className="group"
              >
                <Card className="text-center border-0 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-purple-700 text-white overflow-hidden">
                  <CardContent className="pt-12 pb-12 px-8">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-black mb-6 text-white group-hover:text-orange-300 transition-colors">{item.title}</h3>
                    <p className="text-blue-100 leading-relaxed text-lg">{item.description}</p>
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
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 text-base font-semibold border-0">
              <HeartHandshake className="h-5 w-5 mr-2" />
              Our Services
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-6">Comprehensive Childcare Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything your child needs for healthy development and happy learning
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Utensils className="h-8 w-8 text-orange-600" />,
                title: "Nutritious Meals",
                description: "Healthy, balanced meals and snacks prepared fresh daily.",
                items: ["Breakfast, lunch, and snacks", "Special dietary accommodations", "Fresh fruits and vegetables"],
              },
              {
                icon: <Gamepad2 className="h-8 w-8 text-blue-600" />,
                title: "Educational Games",
                description: "Age-appropriate games promoting learning and creativity.",
                items: ["Interactive learning games", "Creative arts and crafts", "Group activities and teamwork"],
              },
              {
                icon: <Bed className="h-8 w-8 text-yellow-600" />,
                title: "Comfortable Rest",
                description: "Safe and comfortable sleeping areas for rest and relaxation.",
                items: ["Individual sleeping spaces", "Clean, comfortable bedding", "Scheduled nap times"],
              },
              {
                icon: <GraduationCap className="h-8 w-8 text-blue-600" />,
                title: "Life Skills Training",
                description: "Developing independence, problem-solving, and social skills.",
                items: ["Self-care and hygiene", "Communication skills", "Problem-solving activities"],
              },
              {
                icon: <Stethoscope className="h-8 w-8 text-orange-600" />,
                title: "Health Monitoring",
                description: "Regular health checks and emergency care when needed.",
                items: ["Daily health assessments", "Medication management", "Emergency first aid"],
              },
              {
                icon: <HeartHandshake className="h-8 w-8 text-yellow-600" />,
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
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/80 overflow-hidden">
                  <CardHeader className="pb-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        {service.icon}
                      </div>
                      <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-blue-800 transition-colors leading-tight">
                        {service.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6 leading-relaxed text-lg">{service.description}</p>
                    <ul className="space-y-4">
                      {service.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-4 group/item">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover/item:scale-110 transition-transform">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium group-hover/item:text-gray-900 transition-colors text-lg">{item}</span>
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
          className="mb-20"
        >
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 text-base font-semibold border-0">
              <FileText className="h-5 w-5 mr-2" />
              Enrollment
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Enrollment Requirements
            </h2>
            <p className="text-xl text-gray-600 max-w-xl mx-auto">
              Key information for joining our daycare program
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Required Documents",
                icon: <FileText className="h-6 w-6 text-blue-600" />,
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
                icon: <Utensils className="h-6 w-6 text-orange-600" />,
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
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-4 text-gray-900 text-2xl font-black group-hover:text-blue-800 transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                        {req.icon}
                      </div>
                      {req.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {req.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50/70 transition-all duration-200 group/item"
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="text-lg font-medium text-gray-700 group-hover/item:text-gray-900 transition-colors">
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
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Card className="border-0 rounded-3xl shadow-2xl bg-gradient-to-r from-blue-600 to-purple-700 text-white overflow-hidden">
            <CardContent className="py-16 px-8">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join our family today and give your child the best start in their educational journey.
              </p>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl font-bold shadow-lg">
                Enroll Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}