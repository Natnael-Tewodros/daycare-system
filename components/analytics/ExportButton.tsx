"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  data: Record<string, unknown>;
  type: 'attendance' | 'children' | 'organizations' | 'events';
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  reportType?: string;
}

export default function ExportButton({ data, type, reportType }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    if (!data) return;

    setIsExporting(true);
    
    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'attendance':
          csvContent = generateAttendanceCSV(data);
          filename = `attendance-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'children':
          csvContent = generateChildrenCSV(data);
          filename = `children-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'organizations':
          csvContent = generateOrganizationsCSV(data);
          filename = `organizations-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'events':
          csvContent = generateEventsCSV(data);
          filename = `events-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateAttendanceCSV = (data: Record<string, unknown>) => {
    let csv = 'Date,Present,Absent,Late,Attendance Rate\n';
    
    if (data.dailyData && Array.isArray(data.dailyData)) {
      (data.dailyData as Array<Record<string, unknown>>).forEach((day) => {
        csv += `${day.date},${day.present},${day.absent},${day.late},${data.attendanceRate.toFixed(2)}%\n`;
      });
    }
    
    csv += `\nSummary\n`;
    csv += `Total Present,${data.totalPresent || 0}\n`;
    csv += `Total Absent,${data.totalAbsent || 0}\n`;
    csv += `Total Late,${data.totalLate || 0}\n`;
    csv += `Overall Attendance Rate,${(data.attendanceRate as number || 0).toFixed(2)}%\n`;
    
    return csv;
  };

  const generateChildrenCSV = (data: Record<string, unknown>) => {
    let csv = 'Category,Count,Percentage\n';
    
    const totalChildren = data.totalChildren as number || 0;
    const byGender = data.byGender as Record<string, number> || { male: 0, female: 0, other: 0 };
    const byOrganization = data.byOrganization as Array<Record<string, unknown>> || [];
    const byAgeGroup = data.byAgeGroup as Array<Record<string, unknown>> || [];
    
    csv += `Total Children,${totalChildren},100%\n\n`;
    
    csv += 'Gender Distribution\n';
    csv += `Male,${byGender.male},${((byGender.male / totalChildren) * 100).toFixed(2)}%\n`;
    csv += `Female,${byGender.female},${((byGender.female / totalChildren) * 100).toFixed(2)}%\n`;
    csv += `Other,${byGender.other},${((byGender.other / totalChildren) * 100).toFixed(2)}%\n\n`;
    
    csv += 'Organization Distribution\n';
    byOrganization.forEach((org) => {
      csv += `${org.organizationName},${org.count},${(org.percentage as number || 0).toFixed(2)}%\n`;
    });
    
    csv += '\nAge Groups\n';
    byAgeGroup.forEach((age) => {
      csv += `${age.ageGroup},${age.count}\n`;
    });
    
    return csv;
  };

  const generateOrganizationsCSV = (data: Record<string, unknown>) => {
    let csv = 'Organization,Children Count,Percentage\n';
    
    const byOrganization = data.byOrganization as Array<Record<string, unknown>> || [];
    byOrganization.forEach((org) => {
      csv += `${org.organizationName},${org.count},${(org.percentage as number || 0).toFixed(2)}%\n`;
    });
    
    return csv;
  };

  const generateEventsCSV = (data: Record<string, unknown>) => {
    let csv = 'Event Type,Count\n';
    
    const eventTypes = data.eventTypes as Array<Record<string, unknown>> || [];
    eventTypes.forEach((event) => {
      csv += `${event.type},${event.count}\n`;
    });
    
    csv += `\nSummary\n`;
    csv += `Total Events,${data.totalEvents || 0}\n`;
    csv += `Upcoming Events,${data.upcomingEvents || 0}\n`;
    csv += `Past Events,${data.pastEvents || 0}\n`;
    
    return csv;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToCSV}
      disabled={isExporting || !data}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
