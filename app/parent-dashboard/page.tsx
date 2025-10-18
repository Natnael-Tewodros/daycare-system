"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { 
  Users, 
  Calendar, 
  FileText, 
  Clock, 
  User, 
  Baby,
  Building,
  HeartHandshake,
  TrendingUp,
  Activity
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  };
  room?: {
    name: string;
    ageRange: string;
  };
  attendances: Attendance[];
  reports: Report[];
}

interface Attendance {
  id: number;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  broughtBy?: string;
  takenBy?: string;
  createdAt: string;
}

interface Report {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    if (!userId || userRole !== 'PARENT') {
      router.push('/login');
      return;
    }

    fetchUserData(userId);
    fetchChildrenData(userId);
  }, [router]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'x-user-id': userId
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchChildrenData = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent/children?parentId=${userId}`);
      if (response.ok) {
        const childrenData = await response.json();
        setChildren(childrenData);
      }
    } catch (error) {
      console.error('Error fetching children data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {children.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
              <p className="text-gray-600 mb-4">
                You don't have any children registered in the daycare system yet.
              </p>
              <Button onClick={() => router.push('/parent-application')}>
                Apply for Daycare
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="application">Apply</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                  <Card key={child.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {child.profilePic ? (
                            <Image
                              src={child.profilePic}
                              alt={`${child.fullName} profile`}
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          ) : (
                            <Baby className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{child.fullName}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {child.organization.name}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Born {formatDate(child.dateOfBirth)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span>{child.site} Site</span>
                        </div>
                        {child.room && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Room: {child.room.name}</span>
                          </div>
                        )}
                        {child.servant && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <HeartHandshake className="h-4 w-4" />
                            <span>Caregiver: {child.servant.fullName}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6">
              {children.map((child) => (
                <Card key={child.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {child.fullName} - Attendance Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {child.attendances.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No attendance records found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {child.attendances.slice(0, 10).map((attendance) => (
                          <div key={attendance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(attendance.status)}>
                                {attendance.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(attendance.createdAt)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {attendance.checkInTime && (
                                <span>In: {formatTime(attendance.checkInTime)}</span>
                              )}
                              {attendance.checkOutTime && (
                                <span className="ml-2">Out: {formatTime(attendance.checkOutTime)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {children.map((child) => (
                <Card key={child.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {child.fullName} - Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {child.reports.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No reports available
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {child.reports.map((report) => (
                          <div key={report.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{report.title}</h4>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(report.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{report.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="application" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Apply for Additional Child</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Apply to enroll another child in the daycare system.
                  </p>
                  <Button onClick={() => router.push('/parent-application')}>
                    Start New Application
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
    </div>
  );
}
