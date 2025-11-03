"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bell, Send, AlertTriangle, FileText, Edit, Trash2, Save, X, MessageSquare } from "lucide-react";

interface Notification {
  id: string;
  isNotification: boolean;
  subject: string;
  description?: string;
  attachments: string[];
  createdAt: string;
  isRead: boolean;
  parentEmail?: string;
  activityId?: number;
  updatedAt?: string;
}

export default function MessagesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [absenceData, setAbsenceData] = useState({ childId: '', subject: '', description: '', reason: 'sick', expectedReturn: '', notes: '' });
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

  // Track deleted message IDs to prevent them from reappearing
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(new Set());

  const markNotificationsAsRead = async (messageIds: string[]): Promise<boolean> => {
    if (!messageIds?.length) {
      console.log('No message IDs provided to mark as read');
      return true;
    }

    try {
      // Separate notification IDs (starting with 'notif_') from activity IDs
      const { notificationIds, activityIds } = messageIds.reduce((acc, id) => {
        if (id?.startsWith('notif_')) {
          acc.notificationIds.push(id.replace('notif_', ''));
        } else if (id?.startsWith('activity_')) {
          acc.activityIds.push(id.replace('activity_', ''));
        }
        return acc;
      }, { notificationIds: [], activityIds: [] } as { notificationIds: string[], activityIds: string[] });

      // Mark notifications as read if there are any
      if (notificationIds.length > 0) {
        console.log('Marking notifications as read:', notificationIds);
        
        // Mark each notification as read individually since the API only supports one at a time
        const results = await Promise.allSettled(
          notificationIds.map(async id => {
            try {
              const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                  `Failed to mark notification ${id} as read: ` +
                  `${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
                );
              }
              return await response.json();
            } catch (error) {
              console.error(`Error marking notification ${id} as read:`, error);
              throw error; // Re-throw to be caught by Promise.allSettled
            }
          })
        );

        // Check for any failures
        const failed = results.filter(
          (result): result is PromiseRejectedResult => result.status === 'rejected'
        );

        if (failed.length > 0) {
          console.error(`Failed to mark ${failed.length} notifications as read`);
          failed.forEach((error, index) => {
            console.error(`Error ${index + 1}:`, error.reason);
          });
          return false;
        }
        
        console.log('Successfully marked all notifications as read');
        return true;
      }

      // Mark activities as read if there are any
      if (activityIds.length > 0) {
        console.log('Marking activities as read:', activityIds);
        // Activities are already marked as read when fetched, so we just update the UI
        // No need to make an API call for activities
      }

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false; // Don't throw, just return false to indicate partial failure
    }
  };

  const fetchNotifications = async (parentEmail: string) => {
    try {
      // First, get all notifications
      const [notificationsRes, activitiesRes] = await Promise.all([
        fetch(`/api/notifications?parentEmail=${encodeURIComponent(parentEmail)}`),
        fetch(`/api/activities?parentEmail=${encodeURIComponent(parentEmail)}`)
      ]);
      
      if (!notificationsRes.ok) throw new Error('Failed to fetch notifications');
      if (!activitiesRes.ok) throw new Error('Failed to fetch activities');
      
      const { notifications } = await notificationsRes.json();
      const activities = await activitiesRes.json();
      
      // Process notifications
      const notificationMessages = notifications
        .filter((n: any) => n.activity) // Only include notifications with activities
        .map((notification: any) => ({
          id: `notif_${notification.id}`,
          isNotification: true,
          subject: notification.activity.subject || 'No subject',
          description: notification.activity.description,
          attachments: notification.activity.attachments || [],
          createdAt: notification.activity.createdAt || new Date().toISOString(),
          isRead: notification.isRead,
          parentEmail: notification.parentEmail,
          activityId: notification.activityId,
          senderType: 'admin' // All notifications are from admin
        }));
      
      // Process activities (only admin messages, not reports)
      const activityMessages = activities
        .filter((activity: any) => 
          activity.recipients.includes(parentEmail.toLowerCase()) && 
          activity.senderType === 'admin' &&
          !activity.isReport
        )
        .map((activity: any) => ({
          id: `activity_${activity.id}`,
          isNotification: false,
          subject: activity.subject || 'No subject',
          description: activity.description,
          attachments: activity.attachments || [],
          createdAt: activity.createdAt || new Date().toISOString(),
          isRead: true, // Activities from admin are always considered read
          parentEmail: activity.parentEmail,
          activityId: activity.id,
          senderType: 'admin'
        }));
      
      // Combine and deduplicate by activityId or id
      const allMessages = [...notificationMessages, ...activityMessages];
      const uniqueMessages = Array.from(
        new Map(allMessages.map(m => [m.activityId || m.id, m])).values()
      );
      
      // Filter out deleted messages and only show admin messages
      const filteredMessages = uniqueMessages.filter((message: any) => 
        !deletedMessageIds.has(message.id) && message.senderType === 'admin'
      );
      
      // Sort by creation date, newest first
      const sortedMessages = [...filteredMessages].sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Compute unread before mutating state so Unread tab is meaningful
      const unreadMessages = sortedMessages.filter((m: any) => !m.isRead);

      // Update state without auto-marking as read; allow explicit actions to mark
      setNotifications(sortedMessages);
      setUnreadCount(unreadMessages.length);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
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
      const parentInfo = JSON.parse(localStorage.getItem('parentInfo') || '{}');
      const parentEmail = parentInfo.email || parentInfo.parentEmail;
      const userId = localStorage.getItem('userId');
      
      console.log('Fetching reports for:', { parentEmail, userId });
      
      if (!parentEmail && !userId) {
        console.error('No parent email or user ID found');
        return;
      }

      // Build the query string with parentId as the primary filter
      const params = new URLSearchParams();
      if (userId) {
        params.append('parentId', userId);
      } else if (parentEmail) {
        params.append('parentEmail', parentEmail);
      }
      // Ensure we only get parent-submitted reports
      params.append('senderType', 'parent');

      const apiUrl = `/api/activities?${params.toString()}`;
      console.log('API URL:', apiUrl);
      
      try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          setSubmittedReports([]); // Clear any existing reports on error
          return;
        }
        
        const responseData = await response.json();
        
        // Handle case where the response is an error object
        if (responseData.error) {
          console.error('API returned error:', responseData.error);
          setSubmittedReports([]);
          return;
        }
        
        // Handle case where activities is an array in a nested property
        let activities = Array.isArray(responseData) ? responseData : 
                        Array.isArray(responseData.activities) ? responseData.activities : [];
                        
        console.log('Raw activities from API:', activities);
        
        // Additional client-side filtering as a safeguard
        activities = activities.filter((activity: any) => {
          if (!activity) return false;
          
          // Check if the activity belongs to the current parent
          const isCurrentParentActivity = 
            (userId && activity.parentId?.toString() === userId) || 
            (parentEmail && activity.parentEmail?.toLowerCase() === parentEmail.toLowerCase());
          
          // Check if it's a report type
          const subject = String(activity.subject || '').toLowerCase();
          const description = String(activity.description || '').toLowerCase();
          const isReport = (
            subject.includes('absence notice') ||
            subject.includes('sick report') ||
            description.includes('⛔ absent') ||
            description.includes('child:')
          );
          
          return isReport && isCurrentParentActivity;
        });
        
        console.log('Filtered reports for current parent:', activities);
        setSubmittedReports(activities);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setSubmittedReports([]); // Clear on error
      }
    } catch (error) {
      console.error('Error fetching submitted reports:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Extract the numeric ID if it's in 'notif_123' format
      const id = notificationId.startsWith('notif_') 
        ? notificationId.replace('notif_', '') 
        : notificationId;
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Failed to mark notification as read:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        return false;
      }

      // Update the local state to mark the notification as read
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      // Decrement unread count if the notification was unread
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) return;
      
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notificationIds: unreadNotifications.map(n => 
            n.id.startsWith('notif_') ? n.id.replace('notif_', '') : n.id
          )
        }),
      });

      if (response.ok) {
        // Update all notifications to read
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        // Show success feedback
        toast.success('All messages marked as read');
      } else {
        throw new Error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Add to deleted set first to prevent flicker
      setDeletedMessageIds(prev => new Set(prev).add(notificationId));
      
      // Update local state immediately for better UX
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Only call delete API for actual notifications (not activities)
      if (notificationId.startsWith('notif_')) {
        const id = notificationId.replace('notif_', '');
        const response = await fetch(`/api/notifications?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      // If there's an error, remove from deleted set and reload the message
      setDeletedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      
      // Reload messages to restore the deleted one
      const parentInfo = JSON.parse(localStorage.getItem('parentInfo') || '{}');
      const parentEmail = parentInfo.email || parentInfo.parentEmail;
      if (parentEmail) {
        fetchNotifications(parentEmail);
      }
      
      alert('Failed to delete message. Please try again.');
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAbsenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    
    if (isSubmitting) return; // Prevent multiple submissions
    
    if (!absenceData.childId) {
      alert("Please select a child");
      return;
    }
    if (!absenceData.subject || !absenceData.description) {
      alert("Please enter subject and description");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedChild = children.find(c => c.id === parseInt(absenceData.childId));
      if (!selectedChild) {
        alert("Child not found");
        setIsSubmitting(false);
        return;
      }
      
      const parentInfo = JSON.parse(localStorage.getItem('parentInfo') || '{}');
      const parentEmail = parentInfo.email || parentInfo.parentEmail;
      const userId = localStorage.getItem('userId');
      
      if (!parentEmail) {
        alert("Parent email not found. Please log in again.");
        setIsSubmitting(false);
        return;
      }
      
      const formData = new FormData();
      // Format the subject to be recognized as a report
      const reportSubject = `⛔ Absence - ${selectedChild.name} - ${absenceData.reason}`;
      // Format the description with clear markers for the reports page
      const reportDescription = `⛔ ABSENT NOTIFICATION

Child: ${selectedChild.name}
Reason: ${absenceData.reason}

Details:
${absenceData.description || 'No additional details provided.'}

Submitted at: ${new Date().toLocaleString()}`;
      
      formData.append("subject", reportSubject);
      formData.append("description", reportDescription);
      formData.append("recipients", JSON.stringify(['admin@daycare.com']));
      formData.append("senderType", "parent");
      formData.append("isReport", "true");
      formData.append("parentId", localStorage.getItem('userId') || '');
      formData.append("parentEmail", parentEmail);
      
      const headers: HeadersInit = {};
      if (parentEmail) headers['x-parent-email'] = parentEmail;
      if (userId) headers['x-parent-id'] = userId;
      
      const response = await fetch("/api/activities", {
        method: "POST",
        body: formData,
        headers,
      });
      
      if (response.ok) {
        alert("Message sent to admin successfully!");
        setShowAbsenceDialog(false);
        setAbsenceData({ childId: '', subject: '', description: '', reason: 'sick', expectedReturn: '', notes: '' });
        
        // Refresh the reports and navigate to reports page
        await fetchSubmittedReports();
        // Navigate to reports page after a short delay
        setTimeout(() => {
          window.location.href = '/parent-dashboard/reports';
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error sending absence notice:", error);
      alert("An error occurred while sending the absence notice. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        fetchSubmittedReports(); // Refresh to show latest edit immediately
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
        fetchSubmittedReports(); // Refresh to show immediate deletion
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
      <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Notifications from Daycare</h1>
        <p className="text-gray-600 mt-1">View communications from the daycare admin</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Notifications from Admin */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Notifications from Daycare
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  {unreadCount} {unreadCount === 1 ? 'Notification' : 'Notifications'}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-blue-200 overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </button>
                <button
                  className={`px-3 py-1 text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
              </div>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:bg-blue-50"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
              {(() => {
                const visible = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
                return visible.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{filter === 'unread' ? 'No unread notifications' : 'No notifications from daycare yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((notification) => (
                <Card key={notification.id} className={`hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-blue-300 bg-blue-50' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {notification.subject}
                          </h3>
                          {!notification.isRead && (
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
                            </div>
                          )}
                        </div>
                        {notification.description && (
                          <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                            {notification.description}
                          </p>
                        )}
                        {notification.attachments && notification.attachments.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {notification.attachments.map((attachment, idx) => (
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
          );
              })()}
        </CardContent>
      </Card>
    </div>
  );
}
