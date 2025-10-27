"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
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
  X
} from "lucide-react";
import { useSearchParams } from "next/navigation";

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
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchChildrenData(userId);
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

  const handleSaveEdit = async () => {
    if (!editingReport) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/reports/${editingReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        // Update the report in the children data
        setChildren(prevChildren => 
          prevChildren.map(child => ({
            ...child,
            reports: child.reports.map(report => 
              report.id === editingReport.id 
                ? { ...report, title: editForm.title, content: editForm.content }
                : report
            )
          }))
        );
        setEditingReport(null);
        setEditForm({ title: '', content: '' });
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
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the report from the children data
        setChildren(prevChildren => 
          prevChildren.map(child => ({
            ...child,
            reports: child.reports.filter(report => report.id !== reportId)
          }))
        );
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

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
        <p className="text-gray-600 mb-6">
          You don't have any children registered in the daycare system yet.
        </p>
      </div>
    );
  }

  const currentChild = children.find(child => child.id === selectedChild);
  const allReports = children.flatMap(child => 
    (child.reports || []).map(report => ({ ...report, childName: child.fullName, childId: child.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
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

      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{allReports.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {allReports.filter(r => {
                    const reportDate = new Date(r.createdAt);
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() && 
                           reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Children</p>
                <p className="text-2xl font-bold text-blue-600">{children.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Latest Report</p>
                <p className="text-sm font-bold text-gray-900">
                  {allReports.length > 0 
                    ? formatDate(allReports[0].createdAt)
                    : 'No reports'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Children Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports available for any of your children</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allReports.map((report) => {
                const reportType = getReportType(report.title);
                const isEditing = editingReport?.id === report.id;
                
                return (
                  <div key={`${report.childId}-${report.id}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    {isEditing ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={reportType.color}>
                            {reportType.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {report.childName}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                              id="edit-title"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              placeholder="Enter report title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-content">Content</Label>
                            <Textarea
                              id="edit-content"
                              value={editForm.content}
                              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                              placeholder="Enter report content"
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
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{report.title}</h4>
                            <Badge className={reportType.color}>
                              {reportType.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {report.childName}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {formatDate(report.createdAt)} at {formatTime(report.createdAt)}
                          </p>
                          <p className="text-gray-700 line-clamp-3">{report.content}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
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
                            onClick={() => exportReport(report)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedReport.title}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Child: {selectedReport.childName || 'Unknown Child'}</p>
                  <p>Date: {formatDate(selectedReport.createdAt)}</p>
                  <p>Time: {formatTime(selectedReport.createdAt)}</p>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedReport.content}</p>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => exportReport(selectedReport)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

