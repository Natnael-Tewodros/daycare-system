"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { 
  Baby, 
  Mail, 
  Calendar, 
  FileText, 
  Send, 
  AlertTriangle, 
  User,
  Building,
  Calendar as CalendarIcon,
  FileText as FileTextIcon,
  User as UserIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  parentName: string;
  site: string;
  profilePic?: string;
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
  const [activeTab, setActiveTab] = useState<string>('overview');
  const submissionsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  
  // Get current date for greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';
  
  // Stats for the dashboard
  const stats = [
    {
      title: 'Children Enrolled',
      value: children.length,
      icon: Baby,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Unread Messages',
      value: unreadCount,
      icon: Mail,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Upcoming Activities',
      value: children.reduce((acc, child) => acc + (child.childActivities?.length || 0), 0),
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Submitted Reports',
      value: submittedReports.length,
      icon: FileText,
      color: 'bg-amber-100 text-amber-600',
    },
  ];

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

      const formData = new FormData();
      // Subject contains only the child's name (no extra text)
      formData.append("subject", `${selectedChild.fullName}`);
      // Description includes only the fields the parent filled (with simple labels, no extra phrases/emojis)
      const lines: string[] = [];
      if (absenceData.reason) lines.push(`Reason: ${absenceData.reason}`);
      if (absenceData.expectedReturn) lines.push(`Expected Return: ${absenceData.expectedReturn}`);
      if (absenceData.notes) lines.push(`Notes: ${absenceData.notes}`);
      formData.append("description", lines.join("\n"));
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

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <div className="animate-pulse flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gray-200"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="children">My Children</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <Button onClick={() => setShowAbsenceDialog(true)} className="flex items-center gap-2 bg-black text-white hover:bg-black/90">
                    <AlertTriangle className="h-4 w-4" />
                    Report Absence
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/parent-dashboard/reports')} className="bg-black text-white hover:bg-black/90">
                    My Reports
                  </Button>
                  <Button onClick={() => router.push('/parent-dashboard/application-status')}>Application Status</Button>
                </div>
              </div>
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
              <Button onClick={handleAbsenceSubmit} className="flex items-center gap-2 bg-black text-white hover:bg-black/90">
                <Send className="h-4 w-4" />
                Report Absence
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
