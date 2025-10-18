"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Clock,
  Bell
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.filter((ann: Announcement) => ann.isActive));
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'important':
        return <Bell className="h-5 w-5 text-red-600" />;
      case 'general':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'important':
        return 'bg-red-50 border-red-200';
      case 'general':
        return 'bg-blue-50 border-blue-200';
      case 'event':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <HeartHandshake className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to Our Daycare
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Nurturing, Caring, and Growing Together
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Login to Portal
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Latest Announcements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.slice(0, 3).map((announcement) => (
                <Card key={announcement.id} className={`${getAnnouncementColor(announcement.type)} border-2`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {getAnnouncementIcon(announcement.type)}
                      <Badge variant="outline" className="capitalize">
                        {announcement.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {formatDate(announcement.createdAt)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-3">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Our Daycare</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We are committed to providing a safe, nurturing, and educational environment where children can grow, learn, and thrive. Our experienced caregivers and comprehensive programs ensure every child receives the best care possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Experienced Staff</h3>
                <p className="text-gray-600">Our team of qualified caregivers and educators are dedicated to your child's well-being and development.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Safe Environment</h3>
                <p className="text-gray-600">State-of-the-art facilities with security measures and child-friendly spaces designed for learning and play.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Care</h3>
                <p className="text-gray-600">Comprehensive programs that focus on physical, emotional, and intellectual development of each child.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Utensils className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Nutritious Meals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Healthy, balanced meals and snacks prepared fresh daily to support your child's growth and development.</p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li>• Breakfast, lunch, and snacks</li>
                  <li>• Special dietary accommodations</li>
                  <li>• Fresh fruits and vegetables</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Educational Games</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Age-appropriate games and activities that promote learning, creativity, and social skills.</p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li>• Interactive learning games</li>
                  <li>• Creative arts and crafts</li>
                  <li>• Group activities and teamwork</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Bed className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Comfortable Rest</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Safe and comfortable sleeping areas with proper bedding and quiet time for rest and relaxation.</p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li>• Individual sleeping spaces</li>
                  <li>• Clean, comfortable bedding</li>
                  <li>• Scheduled nap times</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Life Skills Training</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Essential life skills development including independence, problem-solving, and social interaction.</p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li>• Self-care and hygiene</li>
                  <li>• Communication skills</li>
                  <li>• Problem-solving activities</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Health Monitoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Regular health checks, medication administration, and emergency care when needed.</p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li>• Daily health assessments</li>
                  <li>• Medication management</li>
                  <li>• Emergency first aid</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <HeartHandshake className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">Emotional Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Caring emotional support and guidance to help children develop confidence and emotional intelligence.</p>
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  <li>• Individual attention</li>
                  <li>• Emotional guidance</li>
                  <li>• Positive reinforcement</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Requirements Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Enrollment Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Medical Report (from licensed physician)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Birth Certificate (original and copy)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Vaccination Records (up-to-date)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Parent/Guardian ID (copy)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Emergency Contact Information</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Recent Passport Photos (2 copies)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-600" />
                  Personal Items to Bring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Extra set of clothes (labeled)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Comfortable blanket for nap time</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Diapers and wipes (if applicable)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Water bottle (labeled)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Comfort item (stuffed animal, etc.)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Weather-appropriate outerwear</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join our daycare family and give your child the best start in life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Enroll Your Child
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Parent Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}