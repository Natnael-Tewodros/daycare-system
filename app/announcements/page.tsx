"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Bell, 
  Calendar,
  FileText,
  AlertTriangle,
  Clock
} from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  isActive: boolean;
}

export default function AnnouncementsPage() {
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
        setAnnouncements(data);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'important':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
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

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'important':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'general':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'event':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-yellow-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200">
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Announcements</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest news, events, and important information from INSA Daycare
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* No Announcements */}
        {!loading && announcements.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Announcements</h3>
              <p className="text-gray-500">There are currently no announcements to display.</p>
            </CardContent>
          </Card>
        )}

        {/* Announcements List */}
        {!loading && announcements.length > 0 && (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <Card 
                key={announcement.id} 
                className={`${getAnnouncementColor(announcement.type)} border-2 hover:shadow-lg transition-shadow duration-200`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getAnnouncementIcon(announcement.type)}
                      <div>
                        <CardTitle className="text-xl text-gray-900 mb-2">
                          {announcement.title}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={getTypeBadgeColor(announcement.type)}
                          >
                            {announcement.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
