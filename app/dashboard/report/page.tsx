"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertCircle,
  UserCheck,
  ClipboardList,
  MapPin,
  User,
  FileText,
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
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

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

interface OverviewStats {
  totalChildren: number;
  totalCaregivers: number;
  totalOrganizations: number;
  todaysAttendance: number;
  pendingEnrollmentRequests: number;
}

interface ParentReportData {
  type: string;
  count: number;
}

// Keeping the old interfaces in case they're used elsewhere
interface ParentReport {
  id: number;
  title: string;
  content: string;
  reportType: string;
  childId: number;
  childName: string;
  parentType: "MOTHER" | "FATHER";
  createdAt: string;
}

interface ChildWithReports {
  id: number;
  fullName: string;
  parentName: string;
  parentType: "MOTHER" | "FATHER";
  reports: ParentReport[];
}

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report data
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([]);
  const [childrenByGender, setChildrenByGender] = useState<ChildrenByGender[]>(
    []
  );
  const [eventData, setEventData] = useState<any[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  // Stats
  const [stats, setStats] = useState<any | null>(null);
  const [statsYear, setStatsYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [viewTermOpen, setViewTermOpen] = useState(false);
  const [viewTerm, setViewTerm] = useState<{
    reason: string;
    notes: string;
    fullName: string;
  } | null>(null);
  const TERMINATION_REASONS = [
    { value: "ALL", label: "All" },
    { value: "GRADUATED", label: "Graduate" },
    { value: "PARENT_LEFT_COMPANY", label: "Parent left the company" },
    { value: "TRANSFERRED", label: "Transferred" },
    { value: "DECEASED", label: "Death" },
    { value: "OTHER", label: "Other" },
  ];

  const getReasonLabel = (v: string) =>
    TERMINATION_REASONS.find((r) => r.value === v)?.label ?? v;

  const [terminatedReasonFilter, setTerminatedReasonFilter] =
    useState<string>("ALL");
  const normalizeReason = (v: any) => {
    if (!v && v !== "") return "";
    try {
      return String(v).trim().toUpperCase().replace(/\s+/g, "_");
    } catch {
      return String(v);
    }
  };
  const [parentReports, setParentReports] = useState<ParentReportData[]>([]);
  const [activeParentTab, setActiveParentTab] = useState<"MOTHER" | "FATHER">(
    "MOTHER"
  );

  const orgChartData = stats
    ? {
        labels: (stats.byOrganization || []).map((o: any) => o.organization),
        datasets: [
          {
            label: "Children",
            data: (stats.byOrganization || []).map((o: any) => o.count),
            backgroundColor: "#3B82F6",
          },
        ],
      }
    : { labels: [], datasets: [] };

  const siteChartData = stats
    ? {
        labels: (stats.bySite || []).map((s: any) => s.site),
        datasets: [
          {
            label: "Children",
            data: (stats.bySite || []).map((s: any) => s.count),
            backgroundColor: "#10B981",
          },
        ],
      }
    : { labels: [], datasets: [] };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      x: { ticks: { color: "#374151" } },
      y: { beginAtZero: true, ticks: { color: "#374151" } },
    },
  };

  const exportStatsPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Children Report - ${statsYear}`, margin, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      if (stats) {
        doc.text(`Current Children: ${stats.currentCount}`, margin, y);
        y += 16;
        doc.text(`Left Last Year: ${stats.leftLastYear}`, margin, y);
        y += 16;
        doc.text(`Joined This Year: ${stats.joinedThisYear}`, margin, y);
        y += 24;
        doc.text("Children by Organization:", margin, y);
        y += 16;
        (stats.byOrganization || []).forEach((o: any) => {
          doc.text(`- ${o.organization}: ${o.count}`, margin + 14, y);
          y += 14;
        });
        y += 8;
        doc.text("Children by Site:", margin, y);
        y += 16;
        (stats.bySite || []).forEach((s: any) => {
          doc.text(`- ${s.site}: ${s.count}`, margin + 14, y);
          y += 14;
        });
        y += 16;
        doc.text("Terminated Children:", margin, y);
        y += 16;
        (stats.terminatedInYear || []).forEach((c: any) => {
          const row = `${new Date(c.updatedAt).toLocaleDateString()} - ${
            c.fullName
          } | Reason: ${c.reason}${c.notes ? ` | Notes: ${c.notes}` : ""}`;
          const lines = doc.splitTextToSize(row, 515);
          lines.forEach((line: string) => {
            if (y > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin + 14, y);
            y += 14;
          });
        });
      }
      doc.save(`children_report_${statsYear}.pdf`);
    } catch (e) {
      alert("Failed to export PDF");
    }
  };

  // Filters
  const [attendancePeriod, setAttendancePeriod] = useState("daily");
  const [attendanceView, setAttendanceView] = useState<"date" | "child">(
    "date"
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );

  useEffect(() => {
    fetchAllReports();
    fetchParentReports();
  }, [
    attendancePeriod,
    attendanceView,
    selectedDate,
    selectedYear,
    selectedMonth,
  ]);

  const fetchParentReports = async () => {
    try {
      setLoading(true);
      console.log("Fetching children count by relationship type");

      const response = await fetch("/api/children/reports", {
        headers: { "Content-Type": "application/json" },
      });

      // Try to parse JSON, but capture raw text for debugging if parsing fails
      let data: any = null;
      let rawText: string | null = null;
      try {
        data = await response.json();
      } catch (e) {
        try {
          rawText = await response.text();
        } catch (_) {
          rawText = null;
        }
        data = { error: "Invalid JSON response from server", raw: rawText };
      }

      if (!response.ok) {
        const errorMessage =
          data?.error ||
          `Failed to fetch children count by relationship (status ${response.status})`;
        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          raw: data?.raw ?? null,
        });
        throw new Error(errorMessage);
      }

      if (!Array.isArray(data)) {
        console.error("Unexpected response format:", data);
        throw new Error("Invalid data format received from server");
      }

      console.log("Successfully fetched children count by relationship:", data);
      setParentReports(data);
      setError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Error in fetchParentReports:", { error: errorMessage });
      setError(
        `Failed to load children count by relationship: ${errorMessage}`
      );
      setParentReports([]);
    } finally {
      setLoading(false);
    }
  };

  const parentChartData = {
    labels: parentReports.map((item) => item.type),
    datasets: [
      {
        data: parentReports.map((item) => item.count),
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  const parentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/reports/children-stats?year=${encodeURIComponent(statsYear)}`
        );
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (e: any) {
        setError(e.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [statsYear]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all reports in parallel
      const [eventRes, attendanceRes, genderRes, overviewRes] =
        await Promise.all([
          fetch("/api/reports/events"),
          fetch(
            `/api/reports/attendance?period=${attendancePeriod}&date=${selectedDate}&year=${selectedYear}&month=${selectedMonth}&groupBy=${attendanceView}`
          ),
          fetch("/api/reports/children-by-gender"),
          fetch("/api/dashboard/overview"),
        ]);

      // Process the responses
      const attendanceReport = await attendanceRes.json();
      const genderData = await genderRes.json();
      const overviewData = overviewRes.ok ? await overviewRes.json() : null;

      // Handle event response with better error handling
      let events = [];
      if (!eventRes.ok) {
        // capture body for debugging
        let eventText = "";
        try {
          eventText = await eventRes.text();
        } catch (e) {
          eventText = String(e);
        }
        console.error("Event API error:", {
          status: eventRes.status,
          statusText: eventRes.statusText,
          body: eventText,
        });
      } else {
        try {
          const eventResponse = await eventRes.json();
          events = Array.isArray(eventResponse) ? eventResponse : [];
          if (!Array.isArray(eventResponse)) {
            console.warn("Event response is not an array:", eventResponse);
          }
        } catch (e) {
          console.error("Error parsing event data:", e);
          events = [];
        }
      }

      // Transform event data for the report
      let processedEvents: any[] = [];
      if (Array.isArray(events)) {
        if (events.length > 0) {
          processedEvents = events.map((event) => {
            const participations = event.participations || [];
            const totalRegistered =
              event.totalRegistered !== undefined
                ? event.totalRegistered
                : participations.length;
            const totalAttended =
              event.totalAttended !== undefined
                ? event.totalAttended
                : participations.filter((p: any) => p.status === "ATTENDED")
                    .length;
            const attendanceRate =
              event.attendanceRate !== undefined
                ? event.attendanceRate
                : totalRegistered > 0
                ? Math.round((totalAttended / totalRegistered) * 100)
                : 0;

            return {
              eventId: event.eventId || event.id,
              eventTitle: event.eventTitle || event.title || "Unknown Event",
              eventDate: event.eventDate || event.date,
              totalRegistered: totalRegistered,
              totalAttended: totalAttended,
              attendanceRate: attendanceRate,
              participations: participations,
            };
          });
        } else {
          console.log("No events found in response");
        }
      } else {
        console.warn("Unexpected event data format:", events);
      }

      setAttendanceData(
        Array.isArray(attendanceReport) ? attendanceReport : []
      );
      setChildrenByGender(Array.isArray(genderData) ? genderData : []);
      setEventData(processedEvents);
      if (overviewData && !overviewData.error) {
        setOverview({
          totalChildren: overviewData.totalChildren ?? 0,
          totalCaregivers:
            overviewData.totalCaregivers ?? overviewData.totalServants ?? 0,
          totalOrganizations: overviewData.totalOrganizations ?? 0,
          todaysAttendance: overviewData.todaysAttendance ?? 0,
          pendingEnrollmentRequests:
            overviewData.pendingEnrollmentRequests ?? 0,
        });
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceChartData = () => {
    // If attendanceData is grouped by child, items will have childId and fullName
    const isChildView =
      attendanceView === "child" ||
      (attendanceData[0] &&
        (attendanceData[0].childId !== undefined ||
          attendanceData[0].fullName));

    if (isChildView) {
      const labels = attendanceData.map(
        (item: any) => item.fullName || `Child ${item.childId}`
      );
      return {
        labels,
        datasets: [
          {
            label: "Present",
            data: attendanceData.map((item: any) => item.present || 0),
            backgroundColor: "#10B981",
            borderColor: "#059669",
            borderWidth: 1,
          },
          {
            label: "Absent",
            data: attendanceData.map((item: any) => item.absent || 0),
            backgroundColor: "#EF4444",
            borderColor: "#DC2626",
            borderWidth: 1,
          },
          {
            label: "Late",
            data: attendanceData.map((item: any) => item.late || 0),
            backgroundColor: "#F59E0B",
            borderColor: "#D97706",
            borderWidth: 1,
          },
        ],
      };
    }

    const labels = attendanceData.map((item) => {
      const date = new Date(item.date);
      if (attendancePeriod === "daily") {
        return date.toLocaleDateString();
      } else if (attendancePeriod === "weekly") {
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      } else if (attendancePeriod === "monthly") {
        return date.toLocaleDateString("en-US", { month: "short" });
      } else {
        return date.getFullYear().toString();
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Present",
          data: attendanceData.map((item) => item.present),
          backgroundColor: "#10B981",
          borderColor: "#059669",
          borderWidth: 1,
        },
        {
          label: "Absent",
          data: attendanceData.map((item) => item.absent),
          backgroundColor: "#EF4444",
          borderColor: "#DC2626",
          borderWidth: 1,
        },
        {
          label: "Late",
          data: attendanceData.map((item) => item.late),
          backgroundColor: "#F59E0B",
          borderColor: "#D97706",
          borderWidth: 1,
        },
      ],
    };
  };

  const getGenderChartData = () => {
    return {
      labels: childrenByGender.map((item) => item.gender),
      datasets: [
        {
          label: "Children by Gender",
          data: childrenByGender.map((item) => item.count),
          backgroundColor: ["#3B82F6", "#EC4899", "#10B981"],
          borderColor: ["#2563EB", "#DB2777", "#059669"],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage =
              total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "#e5e7eb",
          drawBorder: false,
        },
        ticks: {
          color: "#6b7280",
        },
      },
      y: {
        grid: {
          color: "#e5e7eb",
          drawBorder: false,
        },
        beginAtZero: true,
        ticks: {
          color: "#6b7280",
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage =
              total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  const exportReport = () => {
    // Export attendance data to CSV using current filters
    try {
      let headers: string[] = [];
      let rows: any[] = [];
      if (attendanceView === "child") {
        headers = ["ChildId", "FullName", "Present", "Absent", "Late", "Total"];
        rows = attendanceData.map((item: any) => [
          String(item.childId ?? ""),
          String(item.fullName ?? ""),
          String(item.present ?? 0),
          String(item.absent ?? 0),
          String(item.late ?? 0),
          String(item.total ?? item.present + item.absent + item.late ?? 0),
        ]);
      } else {
        headers = ["Date", "Present", "Absent", "Late", "Total", "Period"];
        rows = attendanceData.map((item: any) => [
          item.date,
          String(item.present ?? 0),
          String(item.absent ?? 0),
          String(item.late ?? 0),
          String(item.total ?? item.present + item.absent + item.late),
          attendancePeriod,
        ]);
      }
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const namePart =
        attendanceView === "child"
          ? `by_child_${selectedDate}`
          : attendancePeriod === "daily"
          ? selectedDate
          : attendancePeriod === "weekly"
          ? `week_of_${selectedDate}`
          : attendancePeriod === "monthly"
          ? `${selectedYear}-${selectedMonth.padStart(2, "0")}`
          : selectedYear;
      a.href = url;
      a.download = `attendance_report_${
        attendanceView === "child" ? "by_child" : attendancePeriod
      }_${namePart}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export CSV.");
    }
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Reports
        </h3>
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
                Reports
              </h1>
              <p className="text-lg text-muted-foreground">
                Generate and manage reports
              </p>
            </div>
            <div>
              <Button onClick={exportStatsPdf}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Children Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Children Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">Year</label>
                <Select value={statsYear} onValueChange={setStatsYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const y = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {stats && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Current Children
                    </label>
                    <div className="text-2xl font-bold">
                      {stats.currentCount}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Left Last Year
                    </label>
                    <div className="text-2xl font-bold">
                      {stats.leftLastYear}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Joined This Year
                    </label>
                    <div className="text-2xl font-bold">
                      {stats.joinedThisYear}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts at top */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Children by Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={orgChartData} options={barOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Children by Site
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={siteChartData} options={barOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">
                      Total Children (This Year)
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.totalThisYear}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-gray-700" />
                  <div>
                    <div className="text-sm text-gray-600">
                      Total Children (Last Year)
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.totalLastYear}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Current Year</div>
                    <div className="text-2xl font-bold">{stats.year}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Terminated Children (Year {stats.year})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Reason filter for terminated children */}
              <div className="mb-4 flex items-center gap-4">
                <label className="text-sm font-medium">Filter by reason</label>
                <div className="w-56">
                  <Select
                    value={terminatedReasonFilter}
                    onValueChange={setTerminatedReasonFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMINATION_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-gray-600">
                  Showing:{" "}
                  <span className="font-medium">
                    {getReasonLabel(terminatedReasonFilter)}
                  </span>
                </div>
              </div>

              {(stats.terminatedInYear || []).filter((c: any) =>
                terminatedReasonFilter === "ALL"
                  ? true
                  : normalizeReason(c.reason) ===
                    normalizeReason(terminatedReasonFilter)
              ).length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Child
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Site
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(stats.terminatedInYear || [])
                        .filter((c: any) =>
                          terminatedReasonFilter === "ALL"
                            ? true
                            : normalizeReason(c.reason) ===
                              normalizeReason(terminatedReasonFilter)
                        )
                        .map((c: any) => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {c.fullName}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {getReasonLabel(normalizeReason(c.reason))}
                            </td>
                            <td
                              className="px-4 py-2 text-sm text-gray-600 max-w-[280px] truncate"
                              title={c.notes}
                            >
                              {c.notes || "—"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {c.organization}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {c.site}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(c.updatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {c.notes && (
                                <button
                                  className="text-blue-600 hover:underline"
                                  onClick={() => {
                                    setViewTerm({
                                      reason: c.reason,
                                      notes: c.notes,
                                      fullName: c.fullName,
                                    });
                                    setViewTermOpen(true);
                                  }}
                                >
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No terminated children recorded for this year.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Child AI Reports removed from Report page */}

        {/* Children by Gender and Parent Reports Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Children by Gender */}
          <Card className="w-full">
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
                      <p className="text-muted-foreground">
                        No gender data available
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Children by Parent Relationship */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Children by Parent Relationship
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>{error}</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={fetchParentReports}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="h-64">
                  <Pie data={parentChartData} options={parentChartOptions} />
                </div>
              )}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>
                  Total Children:{" "}
                  {parentReports.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Attendance Period
                </label>
                <Select
                  value={attendancePeriod}
                  onValueChange={setAttendancePeriod}
                >
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
              <div>
                <label className="text-sm font-medium mb-2 block">
                  View By
                </label>
                <Select
                  value={attendanceView}
                  onValueChange={(v) =>
                    setAttendanceView(v as "date" | "child")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">By Date</SelectItem>
                    <SelectItem value="child">By Child</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(attendancePeriod === "daily" ||
                attendancePeriod === "weekly") && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {attendancePeriod === "daily"
                      ? "Date"
                      : "Start Date (Week)"}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {attendancePeriod === "monthly" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Month
                  </label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleString("default", {
                            month: "long",
                          })}
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
              <div className="md:justify-self-end">
                <Button onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Attendance Report (
              {attendanceView === "child"
                ? "By Child"
                : attendancePeriod.charAt(0).toUpperCase() +
                  attendancePeriod.slice(1)}
              )
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
                    <p className="text-muted-foreground">
                      No attendance data available for the selected period
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* If viewing by child, show a table of per-child attendance counts */}
            {attendanceView === "child" && attendanceData.length > 0 && (
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Child
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Present
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Absent
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Late
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((c: any) => (
                      <tr key={c.childId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {c.fullName || `Child ${c.childId}`}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {c.present ?? 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {c.absent ?? 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {c.late ?? 0}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {c.total ??
                            (c.present ?? 0) + (c.absent ?? 0) + (c.late ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Participation moved below Attendance */}
        <Card className="col-span-2 mb-10">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attended
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventData.map((event, index) => {
                      const attendanceRate =
                        event.attendanceRate !== undefined
                          ? event.attendanceRate
                          : 0;
                      let eventDate = "N/A";
                      try {
                        if (event.eventDate) {
                          const dateObj = new Date(event.eventDate);
                          if (!isNaN(dateObj.getTime())) {
                            eventDate = dateObj.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            });
                          }
                        }
                      } catch (e) {
                        console.error("Error parsing event date:", e);
                      }
                      return (
                        <tr
                          key={event.eventId || `event-${index}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {event.eventTitle || "Untitled Event"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {eventDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.totalRegistered || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                attendanceRate > 70
                                  ? "bg-green-100 text-green-800"
                                  : attendanceRate > 40
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {event.totalAttended || 0} ({attendanceRate}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${
                                  attendanceRate > 70
                                    ? "bg-green-500"
                                    : attendanceRate > 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, attendanceRate)
                                  )}%`,
                                }}
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

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Children
                  </p>
                  <p className="text-2xl font-bold">
                    {overview?.totalChildren ??
                      childrenByGender.reduce(
                        (sum, item) => sum + item.count,
                        0
                      )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Caregivers
                  </p>
                  <p className="text-2xl font-bold">
                    {overview?.totalCaregivers ?? 0}
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Organizations
                  </p>
                  <p className="text-2xl font-bold">
                    {overview?.totalOrganizations ??
                      stats?.byOrganization?.length ??
                      0}
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Attendance
                  </p>
                  <p className="text-2xl font-bold">
                    {attendanceData.length > 0
                      ? Math.round(
                          attendanceData.reduce(
                            (sum, item) =>
                              sum + (item.present / item.total) * 100,
                            0
                          ) / attendanceData.length
                        )
                      : 0}
                    %
                  </p>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Events
                  </p>
                  <p className="text-2xl font-bold">{eventData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Enrollments
                  </p>
                  <p className="text-2xl font-bold">
                    {overview?.pendingEnrollmentRequests ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Today's attendance: {overview?.todaysAttendance ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View terminated details */}
      {viewTerm && (
        <div className={`${viewTermOpen ? "" : "hidden"}`}>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setViewTermOpen(false)}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="text-lg font-semibold mb-3">
                Termination Details
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-gray-700">Child</div>
                  <div className="text-gray-900">{viewTerm.fullName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Reason
                  </div>
                  <div className="text-gray-900">{viewTerm.reason}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Notes</div>
                  <div className="text-gray-800 whitespace-pre-wrap break-words">
                    {viewTerm.notes || "—"}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewTermOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
