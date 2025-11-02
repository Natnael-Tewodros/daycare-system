"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  PieChart, 
  Calendar,
  Users,
  Building2,
  Activity,
  Download,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceReport {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface ChildrenByGender {
  gender: string;
  count: number;
  percentage: number;
}

interface ChildrenByOrganization {
  organization: string;
  count: number;
  percentage: number;
}


export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Report data
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([]);
  const [childrenByGender, setChildrenByGender] = useState<ChildrenByGender[]>([]);
  const [childrenByOrganization, setChildrenByOrganization] = useState<ChildrenByOrganization[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);
  
  // Filters
  const [attendancePeriod, setAttendancePeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  useEffect(() => {
    fetchAllReports();
  }, [attendancePeriod, selectedDate, selectedYear, selectedMonth]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all reports in parallel
      const [eventRes, attendanceRes, genderRes, orgRes] = await Promise.all([
        fetch('/api/reports/events'),
        fetch(`/api/reports/attendance?period=${attendancePeriod}&date=${selectedDate}&year=${selectedYear}&month=${selectedMonth}`),
        fetch('/api/reports/children-by-gender'),
        fetch('/api/reports/children-by-organization'),
      ]);

      // Process the responses
      const attendanceReport = await attendanceRes.json();
      const genderData = await genderRes.json();
      const orgData = await orgRes.json();
      
      // Handle event response with better error handling
      let events = [];
      if (!eventRes.ok) {
        console.error('Event API error:', eventRes.status, eventRes.statusText);
      } else {
        try {
          const eventResponse = await eventRes.json();
          events = Array.isArray(eventResponse) ? eventResponse : [];
          if (!Array.isArray(eventResponse)) {
            console.warn('Event response is not an array:', eventResponse);
          }
        } catch (e) {
          console.error('Error parsing event data:', e);
          events = [];
        }
      }

      // Transform event data for the report
      let processedEvents = [];
      if (Array.isArray(events)) {
        if (events.length > 0) {
          processedEvents = events.map((event) => {
            const participations = event.participations || [];
            const totalRegistered = event.totalRegistered !== undefined 
              ? event.totalRegistered 
              : participations.length;
            const totalAttended = event.totalAttended !== undefined 
              ? event.totalAttended 
              : participations.filter((p: any) => p.status === 'ATTENDED').length;
            const attendanceRate = event.attendanceRate !== undefined 
              ? event.attendanceRate 
              : (totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0);
            
            return {
              eventId: event.eventId || event.id,
              eventTitle: event.eventTitle || event.title || 'Unknown Event',
              eventDate: event.eventDate || event.date,
              totalRegistered: totalRegistered,
              totalAttended: totalAttended,
              attendanceRate: attendanceRate,
              participations: participations
            };
          });
        } else {
          console.log('No events found in response');
        }
      } else {
        console.warn('Unexpected event data format:', events);
      }

      setAttendanceData(Array.isArray(attendanceReport) ? attendanceReport : []);
      setChildrenByGender(Array.isArray(genderData) ? genderData : []);
      setChildrenByOrganization(Array.isArray(orgData) ? orgData : []);
      setEventData(processedEvents);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceChartData = () => {
    const labels = attendanceData.map(item => {
      const date = new Date(item.date);
      if (attendancePeriod === 'daily') {
        return date.toLocaleDateString();
      } else if (attendancePeriod === 'weekly') {
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      } else if (attendancePeriod === 'monthly') {
        return date.toLocaleDateString('en-US', { month: 'short' });
      } else {
        return date.getFullYear().toString();
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Present',
          data: attendanceData.map(item => item.present),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1,
        },
        {
          label: 'Absent',
          data: attendanceData.map(item => item.absent),
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          borderWidth: 1,
        },
        {
          label: 'Late',
          data: attendanceData.map(item => item.late),
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          borderWidth: 1,
        },
      ],
    };
  };

  const getGenderChartData = () => {
    return {
      labels: childrenByGender.map(item => item.gender),
      datasets: [
        {
          label: 'Children by Gender',
          data: childrenByGender.map(item => item.count),
          backgroundColor: ['#3B82F6', '#EC4899', '#10B981'],
          borderColor: ['#2563EB', '#DB2777', '#059669'],
          borderWidth: 1,
        },
      ],
    };
  };

  const getOrganizationChartData = () => {
    return {
      labels: childrenByOrganization.map(item => item.organization),
      datasets: [
        {
          label: 'Children by Organization',
          data: childrenByOrganization.map(item => item.count),
          backgroundColor: [
            '#8B5CF6',
            '#06B6D4',
            '#F59E0B',
            '#EF4444',
            '#10B981',
            '#F97316'
          ],
          borderWidth: 1,
        },
      ],
    };
  };


  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: '#e5e7eb',
          drawBorder: false,
        },
        beginAtZero: true,
        ticks: {
          color: '#6b7280',
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  const exportReport = () => {
    // Export functionality not implemented; intentionally left blank to avoid noisy logs
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Reports</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAllReports}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Reports & Analytics
              </h1>
              <p className="text-lg text-muted-foreground">Comprehensive insights into your daycare operations</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchAllReports}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Attendance Period</label>
                <Select value={attendancePeriod} onValueChange={setAttendancePeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(attendancePeriod === 'daily' || attendancePeriod === 'weekly') && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {attendancePeriod === 'daily' ? 'Date' : 'Start Date (Week)'}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {attendancePeriod === 'monthly' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium mb-2 block">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Attendance Report ({attendancePeriod.charAt(0).toUpperCase() + attendancePeriod.slice(1)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {attendanceData.length > 0 ? (
                <Bar data={getAttendanceChartData()} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No attendance data available for the selected period</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events Report */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Event Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No event participation data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventData.map((event, index) => {
                      const attendanceRate = event.attendanceRate !== undefined ? event.attendanceRate : 0;
                      let eventDate = 'N/A';
                      try {
                        if (event.eventDate) {
                          const dateObj = new Date(event.eventDate);
                          if (!isNaN(dateObj.getTime())) {
                            eventDate = dateObj.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            });
                          }
                        }
                      } catch (e) {
                        console.error('Error parsing event date:', e);
                      }
                        
                      return (
                        <tr key={event.eventId || `event-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {event.eventTitle || 'Untitled Event'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {eventDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.totalRegistered || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attendanceRate > 70 ? 'bg-green-100 text-green-800' : 
                              attendanceRate > 40 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {event.totalAttended || 0} ({attendanceRate}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  attendanceRate > 70 ? 'bg-green-500' : 
                                  attendanceRate > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Children Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Children by Gender */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-pink-600" />
                Children by Gender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {childrenByGender.length > 0 ? (
                  <Pie data={getGenderChartData()} options={pieChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No gender data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Children by Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                Children by Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {childrenByOrganization.length > 0 ? (
                  <Pie data={getOrganizationChartData()} options={pieChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No organization data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Children</p>
                  <p className="text-2xl font-bold">
                    {childrenByGender.reduce((sum, item) => sum + item.count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg Attendance</p>
                  <p className="text-2xl font-bold">
                    {attendanceData.length > 0 
                      ? Math.round(attendanceData.reduce((sum, item) => sum + (item.present / item.total) * 100, 0) / attendanceData.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                  <p className="text-2xl font-bold">{childrenByOrganization.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold">{eventData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}