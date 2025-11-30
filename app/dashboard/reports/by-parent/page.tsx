'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  User, 
  Users, 
  Download, 
  ArrowLeft,
  FileDown,
  FileSpreadsheet
} from "lucide-react";
import { format } from 'date-fns';

type Report = {
  id: number;
  title: string;
  content: string;
  reportType: string;
  childId: number;
  childName: string;
  parentType: 'MOTHER' | 'FATHER';
  createdAt: string;
};

type ChildWithReports = {
  id: number;
  fullName: string;
  parentName: string;
  parentType: 'MOTHER' | 'FATHER';
  reports: Report[];
};

export default function ParentReportsPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildWithReports[]>([]);
  const [activeTab, setActiveTab] = useState<'MOTHER' | 'FATHER'>('MOTHER');
  const router = useRouter();

  useEffect(() => {
    const fetchChildrenAndReports = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/children?includeReports=true');
        if (!response.ok) throw new Error('Failed to fetch children data');
        
        const data = await response.json();
        setChildren(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildrenAndReports();
  }, []);

  const filteredChildren = children.filter(child => child.parentType === activeTab);
  
  const exportToCSV = () => {
    const headers = ['Child Name', 'Report Title', 'Report Type', 'Date', 'Content'];
    const csvContent = [
      headers.join(','),
      ...filteredChildren.flatMap(child => 
        child.reports.map(report => (
          [
            `"${child.fullName}"`,
            `"${report.title}"`,
            `"${report.reportType}"`,
            `"${format(new Date(report.createdAt), 'PPpp')}"`,
            `"${report.content.replace(/"/g, '""')}"`
          ].join(',')
        ))
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab.toLowerCase()}-reports-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parent Reports</h1>
          <p className="text-muted-foreground">View reports filtered by parent type</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={exportToCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'MOTHER' | 'FATHER')}>
        <TabsList>
          <TabsTrigger value="MOTHER">
            <User className="h-4 w-4 mr-2" />
            Mother's Reports
          </TabsTrigger>
          <TabsTrigger value="FATHER">
            <Users className="h-4 w-4 mr-2" />
            Father's Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {filteredChildren.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">No {activeTab.toLowerCase()} reports found</h3>
                <p className="mt-1 text-sm">There are no reports available for {activeTab.toLowerCase()}s at this time.</p>
              </CardContent>
            </Card>
          ) : (
            filteredChildren.map((child) => (
              <Card key={child.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{child.fullName}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {child.reports.length} report{child.reports.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {child.reports.length > 0 ? (
                    <div className="space-y-4">
                      {child.reports.map((report) => (
                        <div key={report.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{report.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(report.createdAt), 'PPPp')}
                              </p>
                              <p className="mt-2 text-sm">
                                {report.content.length > 200 
                                  ? `${report.content.substring(0, 200)}...` 
                                  : report.content}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // Navigate to the report detail page or show a modal
                                router.push(`/dashboard/children/${child.id}/reports/${report.id}`);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Full
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No reports available for {child.fullName}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
