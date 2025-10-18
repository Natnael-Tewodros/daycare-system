"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { 
  FileText, 
  Calendar, 
  User, 
  MessageSquare,
  Download,
  Eye
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
      return { type: 'Medical', color: 'bg-red-100 text-red-800' };
    } else if (titleLower.includes('behavior') || titleLower.includes('social')) {
      return { type: 'Behavioral', color: 'bg-blue-100 text-blue-800' };
    } else if (titleLower.includes('academic') || titleLower.includes('learning')) {
      return { type: 'Academic', color: 'bg-green-100 text-green-800' };
    } else if (titleLower.includes('incident') || titleLower.includes('accident')) {
      return { type: 'Incident', color: 'bg-orange-100 text-orange-800' };
    } else {
      return { type: 'General', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const exportReport = (report: Report) => {
    const content = `
Daycare Report
==============

Child: ${children.find(c => c.id === selectedChild)?.fullName}
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
    child.reports.map(report => ({ ...report, childName: child.fullName, childId: child.id }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Child Reports</h1>
          <p className="text-gray-600 mt-1">View reports and updates about your children</p>
        </div>
      </div>

      {/* Child Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Child:</label>
            <Select value={selectedChild?.toString() || ""} onValueChange={(value) => setSelectedChild(parseInt(value))}>
              <SelectTrigger className="w-64">
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      {child.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectTrigger>
            </Select>
          </div>
        </CardContent>
      </Card>

      {currentChild && (
        <>
          {/* Report Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-bold text-gray-900">{currentChild.reports.length}</p>
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
                    <p className="text-2xl font-bold text-green-600">
                      {currentChild.reports.filter(r => {
                        const reportDate = new Date(r.createdAt);
                        const now = new Date();
                        return reportDate.getMonth() === now.getMonth() && 
                               reportDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-600" />
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
                      {currentChild.reports.length > 0 
                        ? formatDate(currentChild.reports[0].createdAt)
                        : 'No reports'
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports - {currentChild.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentChild.reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reports available for this child</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentChild.reports.map((report) => {
                    const reportType = getReportType(report.title);
                    return (
                      <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{report.title}</h4>
                              <Badge className={reportType.color}>
                                {reportType.type}
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
                              onClick={() => exportReport(report)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

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

