"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Search,
  Bell,
  Trash2,
  Plus,
  Send,
  AlertTriangle
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


interface Notification {
  id: number;
  activityId: number;
  parentEmail: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  activity: {
    id: number;
    subject: string;
    description?: string;
    attachments: string[];
    createdAt: string;
  };
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [showSickReportDialog, setShowSickReportDialog] = useState(false);
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [composeData, setComposeData] = useState({ subject: '', description: '', attachments: [] as File[] });
  const [sickReportData, setSickReportData] = useState({ childId: '', symptoms: '', notes: '', attachments: [] as File[] });
  const [absenceData, setAbsenceData] = useState({ childId: '', reason: 'sick', expectedReturn: '', notes: '' });
  const router = useRouter();

  useEffect(() => {
    // Get parent info from localStorage (set during login) or URL params
    const storedParentInfo = localStorage.getItem('parentInfo');
    const storedUserId = localStorage.getItem('userId');
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    
    if (storedParentInfo) {
      const parent = JSON.parse(storedParentInfo);
      setUser(parent);
      
      // Check if children are already in localStorage (from login)
      if (parent.children && parent.children.length > 0) {
        setChildren(parent.children);
        // Still fetch notifications even if children are cached
        fetchNotifications(parent.email);
        setLoading(false);
        return;
      }
      
      // Fetch children data from API
      fetchChildren(parent.email);
      // Fetch notifications for this parent
      fetchNotifications(parent.email);
      // Fetch submitted reports
      fetchSubmittedReports();
    } else if (emailParam) {
      // If coming from signup, create a basic user object
      const basicUser = { email: emailParam, name: 'New User' };
      setUser(basicUser);
      
      // Fetch children data from API
      fetchChildren(emailParam);
      // Fetch notifications for this parent
      fetchNotifications(emailParam);
      // Fetch submitted reports
      fetchSubmittedReports();
    } else {
      // Redirect to login if no parent info
      router.push('/login');
    }
  }, [router]);

  const fetchChildren = async (parentEmail: string) => {
    try {
      console.log('Fetching children for parent email:', parentEmail);
      
      // Get the userId from localStorage (set during login)
      const userId = localStorage.getItem('userId');
      console.log('User ID from localStorage:', userId);
      
      if (!userId) {
        console.error('No userId found in localStorage');
        setLoading(false);
        return;
      }
      
      // Fetch children by parentId (userId)
      const response = await fetch(`/api/children?parentId=${userId}`);
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const childrenData = await response.json();
        console.log('Children data received by parentId:', childrenData);
        
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

  const fetchNotifications = async (parentEmail: string) => {
    try {
      const response = await fetch(`/api/notifications?parentEmail=${encodeURIComponent(parentEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchSubmittedReports = async () => {
    try {
      const response = await fetch('/api/activities');
      if (response.ok) {
        const activities = await response.json();
        // Filter activities that look like they were sent by parents (absence notices, sick reports, etc.)
        const submitted = activities.filter((activity: any) => {
          const subject = activity.subject?.toLowerCase() || '';
          const description = activity.description?.toLowerCase() || '';
          
          // Check if it's an activity sent TO admin (indicating it came from a parent)
          const sentToAdmin = activity.recipients?.some((recipient: string) => 
            recipient.toLowerCase().includes('admin') || 
            recipient === 'admin@daycare.com'
          );
          
          // Check if it contains parent submission keywords
          const isParentSubmission = subject.includes('absence notice') || 
                                      subject.includes('sick report') ||
                                      description.includes('⛔ absent') ||
                                      description.includes('child:');
          
          return sentToAdmin && isParentSubmission;
        });
        setSubmittedReports(submitted);
      }
    } catch (error) {
      console.error('Error fetching submitted reports:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleComposeSubmit = async () => {
    if (!composeData.subject) {
      alert("Please enter a subject");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("subject", composeData.subject);
      formData.append("description", composeData.description);
      formData.append("recipients", JSON.stringify(['admin@daycare.com'])); // Send to admin

      composeData.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("/api/activities", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        alert("Message sent to admin successfully!");
        setShowComposeDialog(false);
        setComposeData({ subject: '', description: '', attachments: [] });
        fetchSubmittedReports(); // Refresh submitted reports
      } else {
        alert(`Error: ${responseData.error || "Failed to send message"}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message to admin");
    }
  };

  const handleSickReportSubmit = async () => {
    if (!sickReportData.childId) {
      alert("Please select a child");
      return;
    }

    try {
      const selectedChild = children.find(c => c.id === parseInt(sickReportData.childId));
      if (!selectedChild) {
        alert("Child not found");
        return;
      }

      const formData = new FormData();
      formData.append("subject", `Sick Report: ${selectedChild.fullName}`);
      formData.append("description", `Child: ${selectedChild.fullName}\nSymptoms: ${sickReportData.symptoms || 'Not specified'}\nNotes: ${sickReportData.notes || 'None'}`);
      formData.append("recipients", JSON.stringify(['admin@daycare.com']));

      sickReportData.attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch("/api/activities", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Sick report sent to admin successfully!");
        setShowSickReportDialog(false);
        setSickReportData({ childId: '', symptoms: '', notes: '', attachments: [] });
        fetchSubmittedReports(); // Refresh submitted reports
      } else {
        alert("Failed to send sick report");
      }
    } catch (error) {
      console.error("Error sending sick report:", error);
      alert("Error sending sick report to admin");
    }
  };

  const handleAbsenceSubmit = async () => {
    if (!absenceData.childId) {
      alert("Please select a child");
      return;
    }

    try {
      const selectedChild = children.find(c => c.id === parseInt(absenceData.childId));
      if (!selectedChild) {
        alert("Child not found");
        return;
      }

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const formData = new FormData();
      formData.append("subject", `🚨 Absence Notice: ${selectedChild.fullName} - ${today}`);
      formData.append("description", `⛔ ABSENT TODAY\n\nChild: ${selectedChild.fullName}\nReason: ${absenceData.reason}\nExpected Return: ${absenceData.expectedReturn || 'Not specified'}\nNotes: ${absenceData.notes || 'None'}`);
      formData.append("recipients", JSON.stringify(['admin@daycare.com']));

      const response = await fetch("/api/activities", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Absence notice sent to daycare successfully!");
        setShowAbsenceDialog(false);
        setAbsenceData({ childId: '', reason: 'sick', expectedReturn: '', notes: '' });
        fetchSubmittedReports(); // Refresh submitted reports
      } else {
        alert("Failed to send absence notice");
      }
    } catch (error) {
      console.error("Error sending absence notice:", error);
      alert("Error sending absence notice");
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

              {/* My Submitted Reports Section in Overview */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Submitted Reports</h3>
                  <Button onClick={() => setShowAbsenceDialog(true)} variant="destructive" className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Report Absence
                  </Button>
                </div>
                {submittedReports.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No submitted reports yet</p>
                      <p className="text-sm text-gray-500 mt-2">When you submit absence reports or messages to admin, they will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {submittedReports.map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {report.subject}
                                </h3>
                                {(report.subject?.toLowerCase().includes('absence notice') || 
                                  report.subject?.toLowerCase().includes('sick report')) && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    URGENT
                                  </Badge>
                                )}
                              </div>
                              {report.description && (
                                <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">
                                  {report.description}
                                </p>
                              )}
                              {report.attachments && report.attachments.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {report.attachments.map((attachment: string, idx: number) => (
                                      <a
                                        key={idx}
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                                      >
                                        📎 {attachment.split('/').pop()}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Sent to: {report.recipients?.join(', ') || 'admin@daycare.com'}</span>
                                <span>•</span>
                                <span>{new Date(report.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Activities & Messages</h2>
                  <p className="text-sm text-gray-600">View activities from daycare</p>
                </div>
              </div>

              {/* Activities/Messages from Admin */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities from Daycare</h3>
                {notifications.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No activities from daycare yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <Card key={notification.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {notification.activity.subject}
                                </h3>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
                                )}
                              </div>
                              {notification.activity.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.activity.description}
                                </p>
                              )}
                              {notification.activity.attachments && notification.activity.attachments.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {notification.activity.attachments.map((attachment, idx) => (
                                      <a
                                        key={idx}
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                                      >
                                        📎 {attachment.split('/').pop()}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <p className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {!notification.isRead && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark as Read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* My Submissions Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Submitted Reports</h3>
                {submittedReports.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No submitted reports yet</p>
                      <p className="text-sm text-gray-500 mt-2">When you submit absence reports or messages to admin, they will appear here</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {submittedReports.map((report) => (
                      <Card key={report.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {report.subject}
                                </h3>
                                {(report.subject?.toLowerCase().includes('absence notice') || 
                                  report.subject?.toLowerCase().includes('sick report')) && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    URGENT
                                  </Badge>
                                )}
                              </div>
                              {report.description && (
                                <p className="text-sm text-gray-600 mb-2 whitespace-pre-line">
                                  {report.description}
                                </p>
                              )}
                              {report.attachments && report.attachments.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {report.attachments.map((attachment: string, idx: number) => (
                                      <a
                                        key={idx}
                                        href={attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                                      >
                                        📎 {attachment.split('/').pop()}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>Sent to: {report.recipients?.join(', ') || 'admin@daycare.com'}</span>
                                <span>•</span>
                                <span>{new Date(report.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
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

        {/* Compose Dialog */}
        <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Message to Admin
              </DialogTitle>
              <DialogDescription>
                Send a message or question to the daycare admin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Question about payment"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Message</Label>
                <Textarea
                  id="description"
                  placeholder="Type your message here..."
                  rows={6}
                  value={composeData.description}
                  onChange={(e) => setComposeData({ ...composeData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => setComposeData({ ...composeData, attachments: Array.from(e.target.files || []) })}
                />
                <p className="text-xs text-gray-500">You can upload images or PDFs</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleComposeSubmit} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sick Report Dialog */}
        <Dialog open={showSickReportDialog} onOpenChange={setShowSickReportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-red-600" />
                Report Sick Child
              </DialogTitle>
              <DialogDescription>
                Report when your child is sick so the daycare can take appropriate action
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="child">Select Child *</Label>
                <select
                  id="child"
                  className="w-full px-3 py-2 border rounded-md"
                  value={sickReportData.childId}
                  onChange={(e) => setSickReportData({ ...sickReportData, childId: e.target.value })}
                >
                  <option value="">Select a child</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="e.g., Fever, cough, headache..."
                  rows={3}
                  value={sickReportData.symptoms}
                  onChange={(e) => setSickReportData({ ...sickReportData, symptoms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  rows={4}
                  value={sickReportData.notes}
                  onChange={(e) => setSickReportData({ ...sickReportData, notes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => setSickReportData({ ...sickReportData, attachments: Array.from(e.target.files || []) })}
                />
                <p className="text-xs text-gray-500">You can upload images or medical documents</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSickReportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSickReportSubmit} className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                <Send className="h-4 w-4" />
                Report Sickness
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Absence Report Dialog */}
        <Dialog open={showAbsenceDialog} onOpenChange={setShowAbsenceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Report Child Absence
              </DialogTitle>
              <DialogDescription>
                Inform the daycare that your child will not be attending today
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="absentChild">Select Child *</Label>
                <select
                  id="absentChild"
                  className="w-full px-3 py-2 border rounded-md"
                  value={absenceData.childId}
                  onChange={(e) => setAbsenceData({ ...absenceData, childId: e.target.value })}
                >
                  <option value="">Select a child</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.fullName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Absence *</Label>
                <select
                  id="reason"
                  className="w-full px-3 py-2 border rounded-md"
                  value={absenceData.reason}
                  onChange={(e) => setAbsenceData({ ...absenceData, reason: e.target.value })}
                >
                  <option value="sick">Sick</option>
                  <option value="family emergency">Family Emergency</option>
                  <option value="appointment">Medical/Dental Appointment</option>
                  <option value="vacation">Vacation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expectedReturn">Expected Return Date</Label>
                <Input
                  id="expectedReturn"
                  type="text"
                  placeholder="e.g., Tomorrow, Next Monday, etc."
                  value={absenceData.expectedReturn}
                  onChange={(e) => setAbsenceData({ ...absenceData, expectedReturn: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="absenceNotes">Additional Notes</Label>
                <Textarea
                  id="absenceNotes"
                  placeholder="Any additional information..."
                  rows={4}
                  value={absenceData.notes}
                  onChange={(e) => setAbsenceData({ ...absenceData, notes: e.target.value })}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ This will notify the daycare admin that your child will not be attending today.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAbsenceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAbsenceSubmit} className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                <Send className="h-4 w-4" />
                Report Absence
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
