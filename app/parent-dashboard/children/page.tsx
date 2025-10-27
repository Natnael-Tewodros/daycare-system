"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { 
  Baby, 
  Calendar, 
  Building, 
  User, 
  HeartHandshake,
  FileText,
  MapPin,
  Users,
  Phone,
  Mail
} from "lucide-react";
import Link from "next/link";

interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  parentName: string;
  site: string;
  organization: {
    name: string;
    type: string;
  };
  servant?: {
    fullName: string;
    email?: string;
    phone?: string;
  };
  room?: {
    name: string;
    ageRange: string;
  };
  reports: Report[];
  createdAt: string;
  updatedAt: string;
}

interface Report {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentInfo, setParentInfo] = useState<any>(null);

  useEffect(() => {
    // Get parent info from localStorage (set during login)
    const storedParentInfo = localStorage.getItem('parentInfo');
    if (storedParentInfo) {
      const parent = JSON.parse(storedParentInfo);
      setParentInfo(parent);
      setChildren(parent.children || []);
      setLoading(false);
    } else {
      // Redirect to login if no parent info
      window.location.href = '/login';
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading children information...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
        <p className="text-gray-600 mb-6">
          You don't have any children registered in the daycare system yet.
        </p>
        <Link href="/parent-dashboard/request">
          <Button>Apply for Daycare</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
          <p className="text-gray-600 mt-1">Detailed information about your children</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <Card key={child.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm">
                  {child.profilePic && isValidUrl(child.profilePic) ? (
                    <Image
                      src={child.profilePic}
                      alt={`${child.fullName} profile`}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <Baby className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{child.fullName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-white">
                      {child.organization.name}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      {calculateAge(child.dateOfBirth)} years old
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Full Name:</span>
                      <p className="font-medium">{child.fullName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date of Birth:</span>
                      <p className="font-medium">{formatDate(child.dateOfBirth)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <p className="font-medium capitalize">{child.gender.toLowerCase()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <p className="font-medium">{calculateAge(child.dateOfBirth)} years</p>
                    </div>
                  </div>
                </div>

                {/* Daycare Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Daycare Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Site:</span>
                      <p className="font-medium">{child.site}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Organization:</span>
                      <p className="font-medium">{child.organization.name}</p>
                    </div>
                    {child.room && (
                      <>
                        <div>
                          <span className="text-gray-600">Room:</span>
                          <p className="font-medium">{child.room.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Age Range:</span>
                          <p className="font-medium">{child.room.ageRange}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Caregiver Information */}
                {child.servant && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4" />
                      Caregiver Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <HeartHandshake className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{child.servant.fullName}</p>
                          <p className="text-sm text-gray-600">Primary Caregiver</p>
                        </div>
                      </div>
                      {child.servant.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{child.servant.email}</span>
                        </div>
                      )}
                      {child.servant.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{child.servant.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Reports */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Recent Reports
                  </h4>
                  {(child.reports || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No reports available</p>
                  ) : (
                    <div className="space-y-2">
                      {(child.reports || []).slice(0, 2).map((report) => (
                        <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium text-sm">{report.title}</h5>
                            <span className="text-xs text-gray-500">
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{report.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Link href={`/parent-dashboard/reports?child=${child.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

