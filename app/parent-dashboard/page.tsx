"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Activity,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Search
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
  activities: Activity[];
  childActivities: ChildActivity[];
  reports: Report[];
}

interface Activity {
  id: number;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  broughtBy?: string;
  takenBy?: string;
  createdAt: string;
}

interface ChildActivity {
  id: number;
  title: string;
  description?: string;
  activityType: string;
  date: string;
  duration?: number;
  notes?: string;
  images: string[];
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
    // Get parent info from localStorage (set during login) or URL params
    const storedParentInfo = localStorage.getItem('parentInfo');
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (storedParentInfo) {
      const parent = JSON.parse(storedParentInfo);
      setUser(parent);
      
      // Fetch children data from API
      fetchChildren(parent.email);
    } else if (emailParam) {
      // If coming from signup, create a basic user object
      const basicUser = { email: emailParam, name: 'New User' };
      setUser(basicUser);
      
      // Fetch children data from API
      fetchChildren(emailParam);
    } else {
      // Redirect to login if no parent info
      router.push('/login');
    }
  }, [router]);

  const fetchChildren = async (parentEmail: string) => {
    try {
      console.log('Fetching children for parent email:', parentEmail);
      
      // First try to fetch by parentEmail
      let response = await fetch(`/api/children?parentEmail=${encodeURIComponent(parentEmail)}`);
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const childrenData = await response.json();
        console.log('Children data received by email:', childrenData);
        
        // If no children found by email, try to fetch all children and filter by parent name
        if (childrenData.length === 0) {
          console.log('No children found by email, trying to fetch all children...');
          response = await fetch('/api/children');
          if (response.ok) {
            const allChildren = await response.json();
            console.log('All children data:', allChildren);
            
            // Try to find children by parent name (extract name from email)
            const parentName = parentEmail.split('@')[0];
            const filteredChildren = allChildren.filter((child: any) => 
              child.parentName && child.parentName.toLowerCase().includes(parentName.toLowerCase())
            );
            console.log('Filtered children by name:', filteredChildren);
            
            // Fetch child activities for each filtered child
            const childrenWithActivities = await Promise.all(
              filteredChildren.map(async (child: any) => {
                try {
                  const activitiesResponse = await fetch(`/api/activities/child/${child.id}`);
                  if (activitiesResponse.ok) {
                    const activities = await activitiesResponse.json();
                    return { ...child, childActivities: activities };
                  }
                  return { ...child, childActivities: [] };
                } catch (error) {
                  console.error(`Error fetching activities for child ${child.id}:`, error);
                  return { ...child, childActivities: [] };
                }
              })
            );
            setChildren(childrenWithActivities);
          }
        } else {
          // Fetch child activities for each child
          const childrenWithActivities = await Promise.all(
            childrenData.map(async (child: any) => {
              try {
                const activitiesResponse = await fetch(`/api/activities/child/${child.id}`);
                if (activitiesResponse.ok) {
                  const activities = await activitiesResponse.json();
                  return { ...child, childActivities: activities };
                }
                return { ...child, childActivities: [] };
              } catch (error) {
                console.error(`Error fetching activities for child ${child.id}:`, error);
                return { ...child, childActivities: [] };
              }
            })
          );
          setChildren(childrenWithActivities);
        }
      } else {
        console.error('Failed to fetch children data, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
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

  const getActivityTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      LEARNING: "bg-blue-100 text-blue-800",
      PLAY: "bg-green-100 text-green-800",
      MEAL: "bg-orange-100 text-orange-800",
      NAP: "bg-purple-100 text-purple-800",
      OUTDOOR: "bg-yellow-100 text-yellow-800",
      ART: "bg-pink-100 text-pink-800",
      MUSIC: "bg-indigo-100 text-indigo-800",
      STORY: "bg-teal-100 text-teal-800",
      EXERCISE: "bg-red-100 text-red-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      LEARNING: "Learning",
      PLAY: "Play",
      MEAL: "Meal",
      NAP: "Nap",
      OUTDOOR: "Outdoor",
      ART: "Art",
      MUSIC: "Music",
      STORY: "Story",
      EXERCISE: "Exercise",
      OTHER: "Other",
    };
    return labels[type] || type;
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="request">Request</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                  <Card key={child.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {child.profilePic && isValidUrl(child.profilePic) ? (
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

            <TabsContent value="activity" className="space-y-6">
              {/* Children Activity */}
              {children.length > 0 ? (
                children.map((child) => (
                <Card key={child.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {child.fullName} - Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {child.activities.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No recent activity found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {child.activities.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(activity.status)}>
                                {activity.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(activity.createdAt)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {activity.checkInTime && (
                                <span>In: {formatTime(activity.checkInTime)}</span>
                              )}
                              {activity.checkOutTime && (
                                <span className="ml-2">Out: {formatTime(activity.checkOutTime)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Your children's activity will appear here once they are registered and attending.
                    </p>
                    <Button onClick={() => router.push('/parent-dashboard/application-status')}>
                      Check Application Status
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Child Activities Section */}
              {children.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">Daily Activities</h2>
                  {children.map((child) => (
                    <Card key={`activities-${child.id}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          {child.fullName} - Daily Activities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {child.childActivities && child.childActivities.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            No activities recorded yet
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {child.childActivities?.slice(0, 10).map((activity) => (
                              <div key={activity.id} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-slate-800">{activity.title}</h4>
                                    {activity.description && (
                                      <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                                    )}
                                  </div>
                                  <Badge className={getActivityTypeColor(activity.activityType)}>
                                    {getActivityTypeLabel(activity.activityType)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(activity.date)}
                                  </span>
                                  {activity.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {activity.duration} min
                                    </span>
                                  )}
                                </div>
                                {activity.notes && (
                                  <p className="text-sm text-slate-600 mt-2 italic">"{activity.notes}"</p>
                                )}
                                {activity.images && activity.images.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm text-slate-500 mb-2">Photos:</p>
                                    <div className="flex gap-2 flex-wrap">
                                      {activity.images.map((image, index) => (
                                        <div key={index} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                                          <Image
                                            src={`/uploads/${image}`}
                                            alt={`Activity photo ${index + 1}`}
                                            width={64}
                                            height={64}
                                            className="object-cover w-full h-full"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="request" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Apply for Daycare
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Submit an application to enroll your child in the daycare system.
                    </p>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Submit New Application</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Apply to enroll a new child in the daycare system. Once approved, the admin will handle the child registration for you.
                      </p>
                      <Button 
                        onClick={() => router.push('/parent-application')}
                        className="w-full"
                      >
                        Start New Application
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
    </div>
  );
}
