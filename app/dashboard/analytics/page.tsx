"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, Users, Clock, Building } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AttendanceChart from "@/components/charts/AttendanceChart";
import GenderChart from "@/components/charts/GenderChart";
import AgeGroupChart from "@/components/charts/AgeGroupChart";
import OrganizationChart from "@/components/charts/OrganizationChart";
import ExportButton from "@/components/analytics/ExportButton";

// Types
interface AttendanceReport {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  attendanceRate: number;
  dailyData: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

interface ChildrenReport {
  totalChildren: number;
  byGender: {
    male: number;
    female: number;
    other: number;
  };
  byOrganization: Array<{
    organizationName: string;
    count: number;
    percentage: number;
  }>;
  byAgeGroup: Array<{
    ageGroup: string;
    count: number;
  }>;
}

interface EventReport {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventTypes: Array<{
    type: string;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [childrenData, setChildrenData] = useState<ChildrenReport | null>(null);
  const [eventData, setEventData] = useState<EventReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    to: new Date()
  });
  
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.from) params.append('start', dateRange.from.toISOString());
      if (dateRange.to) params.append('end', dateRange.to.toISOString());
      params.append('type', reportType);

      const response = await fetch(`/api/analytics/attendance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch attendance data');
      const data = await response.json();
      setAttendanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildrenData = async () => {
    try {
      const response = await fetch('/api/analytics/children');
      if (!response.ok) throw new Error('Failed to fetch children data');
      const data = await response.json();
      setChildrenData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchEventData = async () => {
    try {
      const response = await fetch('/api/analytics/events');
      if (!response.ok) throw new Error('Failed to fetch event data');
      const data = await response.json();
      setEventData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    fetchChildrenData();
    fetchEventData();
  }, [dateRange, reportType, fetchAttendanceData]);

  // Removed unused handleExport function

  if (loading && !attendanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive insights into daycare operations</p>
        </div>
        <div className="flex gap-2">
          <ExportButton 
            data={attendanceData} 
            type="attendance" 
            dateRange={dateRange} 
            reportType={reportType} 
          />
          <ExportButton 
            data={childrenData} 
            type="children" 
          />
          <ExportButton 
            data={childrenData} 
            type="organizations" 
          />
          <ExportButton 
            data={eventData} 
            type="events" 
          />
        </div>
      </div>

      {/* Date Range and Report Type Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date Range:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range: any) => setDateRange({
                      from: range?.from,
                      to: range?.to
                    })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Report Type:</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger className="w-[150px]">
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
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Attendance Reports */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Attendance Reports</h2>
            <ExportButton 
              data={attendanceData} 
              type="attendance" 
              dateRange={dateRange} 
              reportType={reportType} 
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Present</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceData?.totalPresent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {attendanceData?.attendanceRate.toFixed(1) || 0}% attendance rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Absent</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{attendanceData?.totalAbsent || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{attendanceData?.totalLate || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceData?.attendanceRate.toFixed(1) || 0}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Daily attendance over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceData?.dailyData && attendanceData.dailyData.length > 0 ? (
                <AttendanceChart data={attendanceData.dailyData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-muted-foreground">No attendance data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Children Reports */}
        <TabsContent value="children" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Children Reports</h2>
            <ExportButton 
              data={childrenData} 
              type="children" 
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Children</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{childrenData?.totalChildren || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Male</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{childrenData?.byGender.male || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Female</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-600">{childrenData?.byGender.female || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Other</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{childrenData?.byGender.other || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gender Distribution Chart */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Children by gender</CardDescription>
              </CardHeader>
              <CardContent>
                {childrenData?.byGender ? (
                  <GenderChart data={childrenData.byGender} />
                ) : (
                  <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <p className="text-muted-foreground">No gender data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Age Groups</CardTitle>
                <CardDescription>Children by age range</CardDescription>
              </CardHeader>
              <CardContent>
                {childrenData?.byAgeGroup && childrenData.byAgeGroup.length > 0 ? (
                  <AgeGroupChart data={childrenData.byAgeGroup} />
                ) : (
                  <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <p className="text-muted-foreground">No age group data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organization Reports */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Organization Reports</h2>
            <ExportButton 
              data={childrenData} 
              type="organizations" 
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Children by Organization</CardTitle>
              <CardDescription>Distribution of children across different organizations</CardDescription>
            </CardHeader>
            <CardContent>
              {childrenData?.byOrganization && childrenData.byOrganization.length > 0 ? (
                <OrganizationChart data={childrenData.byOrganization} />
              ) : (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-muted-foreground">No organization data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Breakdown</CardTitle>
              <CardDescription>Detailed view of children per organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {childrenData?.byOrganization.map((org, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{org.organizationName}</p>
                        <p className="text-sm text-muted-foreground">{org.count} children</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{org.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Reports */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Event Reports</h2>
            <ExportButton 
              data={eventData} 
              type="events" 
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{eventData?.totalEvents || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{eventData?.upcomingEvents || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Past Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{eventData?.pastEvents || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>Distribution of events by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-muted-foreground">Event chart will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
