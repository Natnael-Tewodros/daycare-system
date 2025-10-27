"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Plus, AlertTriangle, Mail, FileText, Edit, Trash2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function MessagesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [absenceData, setAbsenceData] = useState({ childId: '', reason: 'sick', expectedReturn: '', notes: '' });
  const [children, setChildren] = useState<any[]>([]);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [editForm, setEditForm] = useState({ subject: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get parent email from localStorage
    const storedParentInfo = localStorage.getItem('parentInfo');
    if (storedParentInfo) {
      const parent = JSON.parse(storedParentInfo);
      fetchNotifications(parent.email || parent.parentEmail);
      fetchChildren();
      fetchSubmittedReports();
    }
  }, []);

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

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/children');
      if (response.ok) {
        const data = await response.json();
        const parentEmail = JSON.parse(localStorage.getItem('parentInfo') || '{}').email;
        const parentChildren = data.filter((child: any) => child.parentEmail === parentEmail);
        setChildren(parentChildren);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
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

  const handleEditReport = (report: any) => {
    setEditingReport(report);
    setEditForm({ subject: report.subject, description: report.description || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingReport) return;
    
    try {
      setError(null);
      const formData = new FormData();
      formData.append("subject", editForm.subject);
      formData.append("description", editForm.description);
      formData.append("recipients", JSON.stringify(editingReport.recipients || ['admin@daycare.com']));

      const response = await fetch(`/api/activities/${editingReport.id}`, {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        // Update the report in the submitted reports
        setSubmittedReports(prev => 
          prev.map(report => 
            report.id === editingReport.id 
              ? { ...report, subject: editForm.subject, description: editForm.description }
              : report
          )
        );
        setEditingReport(null);
        setEditForm({ subject: '', description: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update report');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/activities/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the report from the submitted reports
        setSubmittedReports(prev => prev.filter(report => report.id !== reportId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    }
  };

  const cancelEdit = () => {
    setEditingReport(null);
    setEditForm({ subject: '', description: '' });
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages & Activities</h1>
          <p className="text-gray-600 mt-1">View activities from daycare and report absences</p>
        </div>
        <Button onClick={() => setShowAbsenceDialog(true)} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white">
          <AlertTriangle className="h-4 w-4" />
          Report Absence
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Notifications from Admin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Activities from Daycare
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                {unreadCount} New
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No activities from daycare yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-blue-300 bg-blue-50' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {notification.activity.subject}
                          </h3>
                          {!notification.isRead && (
                            <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        {notification.activity.description && (
                          <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                            {notification.activity.description}
                          </p>
                        )}
                        {notification.activity.attachments && notification.activity.attachments.length > 0 && (
                          <div className="mb-3">
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
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Submitted Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            My Submitted Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submittedReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No submitted reports yet</p>
              <p className="text-sm text-gray-500 mt-2">When you submit absence reports or messages to admin, they will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedReports.map((report) => {
                const isEditing = editingReport?.id === report.id;
                
                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {isEditing ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="edit-subject">Subject</Label>
                              <Input
                                id="edit-subject"
                                value={editForm.subject}
                                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                placeholder="Enter report subject"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Enter report description"
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveEdit} size="sm">
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                              <Button onClick={cancelEdit} variant="outline" size="sm">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {report.subject}
                              </h3>
                            </div>
                            {report.description && (
                              <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                                {report.description}
                              </p>
                            )}
                            {report.attachments && report.attachments.length > 0 && (
                              <div className="mb-3">
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
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditReport(report)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
            <Button onClick={handleAbsenceSubmit} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white">
              <Send className="h-4 w-4" />
              Report Absence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

