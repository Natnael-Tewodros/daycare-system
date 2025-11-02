"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Calendar, 
  User, 
  MessageSquare,
  Download,
  Eye,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Child {
  id: number;
  fullName: string;
  reports: Report[];
}

interface Report {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchChildrenData(userId);
      fetchSubmittedReports();
    }
  }, []);

  useEffect(() => {
    const childParam = searchParams.get('child');
    if (childParam) {
      setSelectedChild(parseInt(childParam));
    }
  }, [searchParams]);

  const fetchChildrenData = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent/children?parentId=${userId}`);
      if (response.ok) {
        const childrenData = await response.json();
        setChildren(childrenData);
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching children data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedReports = async () => {
    try {
      // Get current parent info
      const parentInfo = JSON.parse(localStorage.getItem('parentInfo') || '{}');
      const parentEmail = (parentInfo.email || parentInfo.parentEmail)?.toLowerCase();
      const userId = localStorage.getItem('userId');
      
      if (!parentEmail && !userId) {
        console.error('No parent email or user ID found');
        return;
      }

      // Build the query string with parentId or parentEmail
      const params = new URLSearchParams();
      if (userId) params.append('parentId', userId);
      if (parentEmail) params.append('parentEmail', parentEmail);
      // Only parent-sent and sent to admin inbox
      params.append('senderType', 'parent');
      params.append('recipientEmail', 'admin@daycare.com');
      
      console.log('Fetching activities with params:', params.toString());
      
      // Get all activities for this parent that were sent to admin
      const response = await fetch(`/api/activities?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch activities:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error('Failed to fetch activities');
      }
      
      const activities = await response.json();
      console.log('Raw activities from API:', activities);
      
      // Filter for parent submissions
      const submitted = activities.filter((activity: any) => {
        if (!activity) return false;
        
        const subject = String(activity.subject || '').toLowerCase();
        const description = String(activity.description || '').toLowerCase();
        
        // Check if it's a report type or has report content
        const isReportType = 
          activity.isReport ||
          subject.includes('absence') ||
          subject.includes('sick') ||
          subject.includes('⛔') ||
          description.includes('child:') ||
          description.includes('reason:') ||
          description.includes('⛔ absent') ||
          description.includes('absent notification') ||
          description.includes('report');

        // Also treat any parent-sent message to admin as a report-like entry
        const isParentToAdmin = activity.senderType === 'parent' && Array.isArray(activity.recipients)
          ? activity.recipients.some((r: string) => String(r).toLowerCase().includes('admin'))
          : false;
        
        // Check if it belongs to the current parent
        const isCurrentParent = 
          (userId && activity.parentId?.toString() === userId) || 
          (parentEmail && activity.parentEmail?.toLowerCase() === parentEmail);
        
        // Check if it's a parent submission (or doesn't have senderType set)
        const isParentSubmission = !activity.senderType || activity.senderType === 'parent';
        
        // Make sure it's not a system-generated message
        const isNotSystemMessage = !subject.startsWith('system:') && 
                                 !description.includes('system-generated');
        
        return isParentSubmission && (isReportType || isParentToAdmin) && isCurrentParent && isNotSystemMessage;
      });
      
      // Sort by creation date, newest first
      const sortedReports = [...submitted].sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setSubmittedReports(sortedReports);
    } catch (error) {
      console.error('Error fetching submitted reports:', error);
      setError('Failed to load your submitted reports. Please try again later.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getReportType = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('medical') || titleLower.includes('health')) {
      return { type: 'Medical', color: 'bg-blue-100 text-blue-800' };
    } else if (titleLower.includes('behavior') || titleLower.includes('social')) {
      return { type: 'Behavioral', color: 'bg-blue-100 text-blue-800' };
    } else if (titleLower.includes('academic') || titleLower.includes('learning')) {
      return { type: 'Academic', color: 'bg-blue-100 text-blue-800' };
    } else if (titleLower.includes('incident') || titleLower.includes('accident')) {
      return { type: 'Incident', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { type: 'General', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const exportReport = (report: any) => {
    const childName = report.childName || children.find(c => c.id === selectedChild)?.fullName || 'Unknown Child';
    const content = `
Daycare Report
==============

Child: ${childName}
Date: ${formatDate(report.createdAt)}
Time: ${formatTime(report.createdAt)}

Title: ${report.title}

Content:
${report.content}

---
Generated from Parent Portal
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.id}-${formatDate(report.createdAt).replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setEditForm({ title: report.title, content: report.content });
  };


  const handleDeleteReport = async (activityId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/activities`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: activityId })
      });

      if (response.ok) {
        // Remove the report from the submitted reports
        setSubmittedReports(prev => 
          prev.filter(report => report.id !== activityId)
        );
        toast.success('Report deleted successfully');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to delete report';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete report';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleUpdateReport = async (activityId: number, updates: { subject?: string, description?: string }) => {
    try {
      setError(null);
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Update the report in the submitted reports
        setSubmittedReports(prev => 
          prev.map(report => 
            report.id === activityId 
              ? { ...report, ...updates } 
              : report
          )
        );
        setEditingReport(null);
        setEditForm({ title: '', content: '' });
        toast.success('Report updated successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update report');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to update report');
    }
  };

  const startEditing = (report: any) => {
    setEditingReport(report);
    setEditForm({
      title: report.subject,
      content: report.description || ''
    });
  };

  const cancelEditing = () => {
    setEditingReport(null);
    setEditForm({ title: '', content: '' });
    setError(null);
  };

  const saveChanges = () => {
    if (!editingReport) return;
    handleUpdateReport(editingReport.id, {
      subject: editForm.title,
      description: editForm.content
    });
  };

  const cancelEdit = () => {
    setEditingReport(null);
    setEditForm({ title: '', content: '' });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0 && submittedReports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
        <p className="text-gray-600 mb-6">
          You don't have any submitted or daycare-provided reports yet.
        </p>
      </div>
    );
  }

  const currentChild = children.find(child => child.id === selectedChild);
  const allReports = children.flatMap(child => 
    (child.reports || []).map(report => ({ ...report, childName: child.fullName, childId: child.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Add edit modal
  const EditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Edit Report</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Subject</Label>
            <Input
              id="edit-title"
              value={editForm.title}
              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-content">Message</Label>
            <Textarea
              id="edit-content"
              value={editForm.content}
              onChange={(e) => setEditForm({...editForm, content: e.target.value})}
              className="mt-1 min-h-[200px]"
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={cancelEditing}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveChanges}
              disabled={!editForm.title.trim() || !editForm.content.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {editingReport && <EditModal />}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Child Reports</h1>
          <p className="text-gray-600 mt-1">View reports and updates about your children</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* My Submitted Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Submitted Reports (Absences, Sick Notices)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submittedReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">You haven't submitted any reports yet</p>
              <p className="text-sm text-gray-400 mt-2">Your absence notices and sick reports will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submittedReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{report.subject}</h3>
                      <p className="text-sm text-gray-500">{formatDate(report.createdAt)}</p>
                      {report.description && (
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                          {report.description.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startEditing(report)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportReport(report)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
