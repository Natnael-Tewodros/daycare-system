"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Bell, FileText, Calendar, Building, Shield, Clock, Award,
  Utensils, Gamepad2, Bed, GraduationCap, Stethoscope, HeartHandshake,
  CheckCircle, ArrowRight
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const parentInfo = localStorage.getItem('parentInfo');
      const userId = localStorage.getItem('userId');
      let userEmail = parentInfo ? JSON.parse(parentInfo).email : null;

      if (!userId && !userEmail) {
        let sessionId = localStorage.getItem('sessionId') || 's_' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem('sessionId', sessionId);
        userEmail = sessionId + '@anon.local';
      }

      const params = new URLSearchParams();
      userId && params.append('userId', userId);
      userEmail && params.append('userEmail', userEmail);

      const res = await fetch(`/api/announcements/with-status?${params}`);
      if (res.ok) setAnnouncements((await res.json()).filter((a: Announcement) => !a.isRead));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsViewed = async (id: number) => {
    try {
      const parentInfo = localStorage.getItem('parentInfo');
      const userId = localStorage.getItem('userId');
      const userEmail = parentInfo ? JSON.parse(parentInfo).email : localStorage.getItem('sessionId') + '@anon.local';

      await fetch(`/api/announcements/${id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || null, userEmail })
      });

      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getIcon = (type: string) => {
    const map: Record<string, JSX.Element> = {
      important: <Bell className="h-4 w-4 text-red-600" />,
      general: <FileText className="h-4 w-4 text-blue-600" />,
      event: <Calendar className="h-4 w-4 text-green-600" />
    };
    return map[type.toLowerCase()] || <Bell className="h-4 w-4 text-gray-600" />;
  };

  const getBg = (type: string) => {
    const map: Record<string, string> = {
      important: "bg-red-50 border-red-200",
      general: "bg-blue-50 border-blue-200",
      event: "bg-green-50 border-green-200"
    };
    return map[type.toLowerCase()] || "bg-gray-50 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero – Image More Visible */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <Image
          src="/caregiver.jpg"
          alt="Caregivers with children"
          fill
          className="object-cover brightness-[0.85] saturate-[1.1]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end pb-16">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl text-white"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight">
                Where Little
                <span className="block bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  Dreams Grow
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-100 mb-6">
                Nurturing young minds with love, learning, and laughter in a safe environment designed for growth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-20 space-y-20">

        {/* Announcements */}
        {announcements.length > 0 && (
          <section>
            <div className="text-center mb-10">
              <Badge className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 mb-3">
                <Bell className="h-3.5 w-3.5 mr-1.5" /> Latest Updates
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Announcements & News</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {announcements.slice(0, 3).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => markAsViewed(a.id)}
                  className="cursor-pointer group"
                >
                  <Card className={`${getBg(a.type)} border rounded-xl p-5 hover:shadow-md transition-shadow`}>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-xs capitalize">{a.type}</Badge>
                      <span className="text-xs text-gray-500">{formatDate(a.createdAt)}</span>
                    </div>
                    <div className="flex gap-3">
                      {getIcon(a.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {a.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.content}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Why Choose Us */}
        <section id="about">
          <div className="text-center mb-10">
            <Badge className="bg-orange-600 text-white text-xs font-medium px-4 py-1.5 mb-3">
              <Building className="h-3.5 w-3.5 mr-1.5" /> About Us
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why Choose Our Daycare?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: Shield, title: "Certified Safety", desc: "Fully licensed with advanced security systems." },
              { Icon: Clock, title: "Flexible Hours", desc: "Early drop-off & late pick-up for busy parents." },
              { Icon: Award, title: "Quality Programs", desc: "Expert-designed early childhood curriculum." }
            ].map(({ Icon, title, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="p-6 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{title}</h3>
                  <p className="text-blue-100 text-sm">{desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services">
          <div className="text-center mb-10">
            <Badge className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 mb-3">
              <HeartHandshake className="h-3.5 w-3.5 mr-1.5" /> Our Services
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Comprehensive Childcare</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { Icon: Utensils, color: "text-orange-600", title: "Nutritious Meals", items: ["Daily fresh meals", "Dietary options", "Fresh produce"] },
              { Icon: Gamepad2, color: "text-blue-600", title: "Educational Games", items: ["Interactive play", "Arts & crafts", "Teamwork"] },
              { Icon: Bed, color: "text-amber-600", title: "Comfortable Rest", items: ["Personal nap areas", "Clean bedding", "Quiet time"] },
              { Icon: GraduationCap, color: "text-indigo-600", title: "Life Skills", items: ["Self-care", "Communication", "Problem-solving"] },
              { Icon: Stethoscope, color: "text-red-600", title: "Health Monitoring", items: ["Daily checks", "Medication", "First aid"] },
              { Icon: HeartHandshake, color: "text-pink-600", title: "Emotional Support", items: ["1-on-1 care", "Positive guidance", "Confidence building"] }
            ].map(({ Icon, color, title, items }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
              >
                <Card className="p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg flex items-center justify-center">
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    {items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Enrollment Requirements */}
        <section id="requirements">
          <div className="text-center mb-10">
            <Badge className="bg-green-600 text-white text-xs font-medium px-4 py-1.5 mb-3">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Enrollment
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Enrollment Requirements</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Required Documents", Icon: FileText, color: "text-blue-600", items: ["Medical Report", "Birth Certificate", "Vaccination Records", "Parent/Guardian ID", "Emergency Contacts", "2 Passport Photos"] },
              { title: "Personal Items", Icon: Utensils, color: "text-orange-600", items: ["Extra Clothes", "Blanket", "Diapers/Wipes", "Water Bottle", "Comfort Item", "Outerwear"] }
            ].map(({ title, Icon, color, items }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3 }}
              >
                <Card className="p-6 rounded-xl bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm text-gray-700 p-1.5 rounded hover:bg-blue-50/70 transition-colors">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}