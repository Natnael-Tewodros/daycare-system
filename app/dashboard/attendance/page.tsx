"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Format a Date to 'yyyy-MM-ddTHH:mm' in LOCAL time for <input type="datetime-local">
function formatLocalDateTimeInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

// Format a Date to 'yyyy-MM-dd' in LOCAL time
function formatLocalDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

type Attendance = {
  id: number;
  childId: number;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  broughtBy: string | null;
  takenBy: string | null;
  createdAt: string;
  child: { id: number; fullName: string };
};

type Child = { id: number; fullName: string; parentName?: string; relationship?: string };

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'today' | 'yesterday' | 'date' | 'week' | 'month' | 'year'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<'daily' | 'yesterday' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  const [checkOutData, setCheckOutData] = useState({
    takenBy: "",
    checkOutTime: formatLocalDateTimeInput(new Date()),
  });
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [checkInData, setCheckInData] = useState({
    broughtBy: "",
    checkInTime: formatLocalDateTimeInput(new Date()),
  });

  const downloadCsv = (rows: Attendance[]) => {
    // Helper to build a period-aware CSV that matches what's on screen
    const sanitize = (s: string | null | undefined) => String(s ?? '').replace(/,/g, ' ');
    const formatMDY = (d: Date) => d.toLocaleDateString('en-US'); // e.g., 1/2/2025
    const rangeStart = dateRange.length ? dateRange[0] : null;
    const rangeEnd = dateRange.length ? dateRange[dateRange.length - 1] : null;
    const periodLabel = period;
    const namePart =
      rangeStart && rangeEnd
        ? `${rangeStart.toISOString().slice(0,10)}_to_${rangeEnd.toISOString().slice(0,10)}`
        : currentFilter === 'today'
        ? formatLocalDate(new Date())
        : currentFilter === 'yesterday'
        ? (() => { const y = new Date(); y.setDate(y.getDate() - 1); return formatLocalDate(y) })()
        : customDate || formatLocalDate(new Date());

    // Build headers depending on whether we have a multi-day dateRange
    let headers: string[] = [];
    let csvRows: string[] = [];

    if (dateRange.length > 0) {
      // One row per child per date, including who brought/took the child
      headers = ['Date','Child','Status','Check-In','Check-Out','Brought By','Taken By','Parent','Relationship','Period'];
      csvRows.push(headers.join(','));

      const childrenSorted = [...allChildren].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      for (const child of childrenSorted) {
        const childRecords = rows.filter(r => r.childId === child.id);
        for (const dt of dateRange) {
          const y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
          const rec = childRecords.find(r => {
            const t = new Date(r.createdAt);
            return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
          });
          const status = rec ? rec.status : '1'; // '1' to mark absent
          const cols = [
            formatMDY(dt),
            sanitize(child.fullName),
            status,
            rec?.checkInTime ? new Date(rec.checkInTime).toLocaleString('en-US') : '-',
            rec?.checkOutTime ? new Date(rec.checkOutTime).toLocaleString('en-US') : '-',
            sanitize(rec?.broughtBy),
            sanitize(rec?.takenBy),
            sanitize(child.parentName),
            sanitize(child.relationship),
            periodLabel,
          ];
          csvRows.push(cols.join(','));
        }
      }
    } else {
      // Single-day export (daily/yesterday/custom date)
      headers = ['Date','Child','Status','Check-In','Check-Out','Brought By','Taken By','Parent','Relationship','Period'];
      csvRows.push(headers.join(','));

      // Map children for single day
      let selectedDayDate = new Date();
      if (currentFilter === 'yesterday') {
        selectedDayDate = new Date();
        selectedDayDate.setDate(selectedDayDate.getDate() - 1);
      } else if (currentFilter === 'date' && customDate) {
        selectedDayDate = new Date(customDate);
      }
      const selectedDay = formatMDY(selectedDayDate);
      const childrenSorted = [...allChildren].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      for (const child of childrenSorted) {
        const r = rows.find(row => row.childId === child.id);
        const cols = [
          selectedDay,
          sanitize(child.fullName),
          r ? r.status : '1', // mark absent as '1' for single day
          r?.checkInTime ? new Date(r.checkInTime).toLocaleString('en-US') : '-',
          r?.checkOutTime ? new Date(r.checkOutTime).toLocaleString('en-US') : '-',
          sanitize(r?.broughtBy),
          sanitize(r?.takenBy),
          sanitize(child.parentName),
          sanitize(child.relationship),
          periodLabel,
        ];
        csvRows.push(cols.join(','));
      }
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${periodLabel}_${namePart}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Per-child report removed from this page; reports should be handled in the report page

  const fetchChildren = async () => {
    try {
      const res = await fetch("/api/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      const data = await res.json();
      setAllChildren(data);
      setFilteredChildren(data);
    } catch (err) {
      setError("Failed to load children");
      console.error(err);
    }
  };

  const fetchAttendance = async (filter: 'today' | 'yesterday' | 'date' | 'week' | 'month' | 'year', customDateValue?: string) => {
    try {
      setLoading(true);
      let url = "/api/attendance";
      let rangeStart: Date | null = null;
      let rangeEnd: Date | null = null;
      
      if (filter === 'today') {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
        rangeStart = start; rangeEnd = end;
        url += `?start=${start.toISOString()}&end=${end.toISOString()}`;
      } else if (filter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0,0,0,0);
        const endYesterday = new Date(yesterday);
        endYesterday.setHours(23,59,59,999);
        rangeStart = yesterday; rangeEnd = endYesterday;
        url += `?start=${yesterday.toISOString()}&end=${endYesterday.toISOString()}`;
      } else if (filter === 'date' && customDateValue) {
        const customStart = new Date(customDateValue);
        customStart.setHours(0,0,0,0);
        const customEnd = new Date(customDateValue);
        customEnd.setHours(23,59,59,999);
        rangeStart = customStart; rangeEnd = customEnd;
        url += `?start=${customStart.toISOString()}&end=${customEnd.toISOString()}`;
      } else if (filter === 'week') {
        const base = selectedDate ? new Date(selectedDate) : new Date();
        const start = new Date(base); start.setHours(0,0,0,0);
        const end = new Date(base); end.setDate(end.getDate() + 6); end.setHours(23,59,59,999);
        rangeStart = start; rangeEnd = end;
        url += `?start=${start.toISOString()}&end=${end.toISOString()}`;
      } else if (filter === 'month') {
        // Use selectedMonth and selectedYear
        const monthIndex = Math.max(1, Math.min(12, parseInt(selectedMonth, 10) || (new Date().getMonth() + 1))) - 1;
        const yearNum = parseInt(selectedYear, 10) || new Date().getFullYear();
        const start = new Date(yearNum, monthIndex, 1);
        start.setHours(0,0,0,0);
        const end = new Date(yearNum, monthIndex + 1, 0);
        end.setHours(23,59,59,999);
        rangeStart = start; rangeEnd = end;
        url += `?start=${start.toISOString()}&end=${end.toISOString()}`;
      } else if (filter === 'year') {
        const yearNum = parseInt(selectedYear, 10) || new Date().getFullYear();
        const start = new Date(yearNum, 0, 1);
        start.setHours(0,0,0,0);
        const end = new Date(yearNum, 11, 31);
        end.setHours(23,59,59,999);
        rangeStart = start; rangeEnd = end;
        url += `?start=${start.toISOString()}&end=${end.toISOString()}`;
      }
      // No 'all' or 'week' view anymore
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      let rows: Attendance[] = data;
      // Only synthesize 'absent' for:
      // - yesterday: always
      // - date: if selected date is not today; if it is today, only after 5:30 PM
      // - today: only after 5:30 PM
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(17, 30, 0, 0); // 5:30 PM local time
      const isSameCalendarDay = (a: Date, b: Date) => {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
      };
      let shouldSynthesizeAbsents = false;
      if (filter === 'yesterday') {
        shouldSynthesizeAbsents = true;
      } else if (filter === 'today') {
        shouldSynthesizeAbsents = now >= cutoff;
      } else if (filter === 'date' && customDateValue) {
        const selected = new Date(customDateValue);
        if (isSameCalendarDay(selected, now)) {
          shouldSynthesizeAbsents = now >= cutoff;
        } else {
          shouldSynthesizeAbsents = true;
        }
      }
      if (shouldSynthesizeAbsents && allChildren.length > 0) {
        const presentIds = new Set(rows.map((r: Attendance) => r.child?.id ?? r.childId));
        const syntheticAbsents: Attendance[] = allChildren
          .filter((c) => !presentIds.has(c.id))
          .map((c) => ({
            id: -Math.abs(typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10) || 0),
            childId: c.id as number,
            status: 'absent',
            checkInTime: null,
            checkOutTime: null,
            broughtBy: null,
            takenBy: null,
            createdAt: new Date().toISOString(),
            child: { id: c.id as number, fullName: c.fullName }
          }));
        rows = [...rows, ...syntheticAbsents];
      }
      setAttendance(rows);
      // Build and store dateRange for UI based on computed rangeStart/rangeEnd
      if (rangeStart && rangeEnd) {
        const dates: Date[] = [];
        const d = new Date(rangeStart);
        while (d <= rangeEnd) {
          dates.push(new Date(d));
          d.setDate(d.getDate() + 1);
        }
        setDateRange(dates);
      } else {
        setDateRange([]);
      }
    } catch (err) {
      setError("Failed to load attendance");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality (by child/parent name, or by status keywords: present, late, absent)
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term === "") {
      setFilteredChildren(allChildren);
      return;
    }
    const wantsPresent = /\bpresent\b/.test(term);
    const wantsLate = /\blate\b/.test(term);
    const wantsAbsent = /\babsent\b/.test(term);
    const hasStatusFilter = wantsPresent || wantsLate || wantsAbsent;
    const inRange = (createdAt: string) => {
      if (dateRange.length === 0) return true; // if no range, accept any
      const t = new Date(createdAt);
      const start = dateRange[0];
      const end = dateRange[dateRange.length - 1];
      return t >= new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0)
        && t <= new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    };
    const filtered = allChildren.filter(child => {
      const nameMatch =
        child.fullName.toLowerCase().includes(term) ||
        (child.parentName && child.parentName.toLowerCase().includes(term));
      // If there's a status filter, check attendance records for this child in the current range
      if (hasStatusFilter) {
        const records = attendance.filter(a => a.childId === child.id && inRange(a.createdAt));
        const hasPresent = records.some(r => r.status === 'present');
        const hasLate = records.some(r => r.status === 'late');
        const hasAbsent = records.length === 0 || records.some(r => r.status === 'absent');
        const statusMatch =
          (wantsPresent ? hasPresent : true) &&
          (wantsLate ? hasLate : true) &&
          (wantsAbsent ? hasAbsent : true);
        return statusMatch || nameMatch;
      }
      return nameMatch;
    });
    setFilteredChildren(filtered);
  }, [searchTerm, allChildren, attendance, dateRange]);

  useEffect(() => {
    fetchChildren();
    fetchAttendance('today');
  }, []);

  useEffect(() => {
    if (period === 'daily') {
      setCurrentFilter('date');
      fetchAttendance('date', selectedDate);
    } else if (period === 'yesterday') {
      setCurrentFilter('yesterday');
      fetchAttendance('yesterday');
    } else if (period === 'weekly') {
      setCurrentFilter('week');
      fetchAttendance('week');
    } else if (period === 'monthly') {
      setCurrentFilter('month');
      fetchAttendance('month');
    } else if (period === 'yearly') {
      setCurrentFilter('year');
      fetchAttendance('year');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedDate, selectedMonth, selectedYear]);

  const handleAttendanceAction = async (childId: number, status: 'present' | 'absent' | 'late', broughtBy?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: childId,
          status: status,
          broughtBy: broughtBy || null,
          checkInTime: status === 'present' || status === 'late' ? new Date().toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error(`Failed to mark as ${status}`);
      fetchAttendance(currentFilter, currentFilter === 'date' ? customDate : undefined);
    } catch (err) {
      setError(`Failed to mark child as ${status}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChild.id,
          status: 'present',
          broughtBy: checkInData.broughtBy || null,
          checkInTime: checkInData.checkInTime,
        }),
      });
      if (!res.ok) throw new Error("Failed to check in");
      setCheckInOpen(false);
      setSelectedChild(null);
      setCheckInData({ broughtBy: "", checkInTime: formatLocalDateTimeInput(new Date()) });
      fetchAttendance(currentFilter, currentFilter === 'date' ? customDate : undefined);
    } catch (err) {
      setError("Failed to check in child");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendance) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedAttendance.id, 
          takenBy: checkOutData.takenBy,
          checkOutTime: checkOutData.checkOutTime,
        }),
      });
      if (!res.ok) throw new Error("Failed to check out");
      setCheckOutOpen(false);
      setSelectedAttendance(null);
      setCheckOutData({
        takenBy: "",
        checkOutTime: formatLocalDateTimeInput(new Date()),
      });
      fetchAttendance(currentFilter, currentFilter === 'date' ? customDate : undefined);
    } catch (err) {
      setError("Failed to check out child");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">Attendance Period</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(period === 'daily' || period === 'weekly') && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {period === 'daily' ? 'Date' : 'Start Date (Week)'}
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            {period === 'monthly' && (
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
            <div className="md:justify-self-end">
              <Button variant="outline" onClick={() => downloadCsv(attendance)}>Download CSV</Button>
            </div>
          </div>
        </div>

        <div className="mb-6 max-w-md">
          <Input
            placeholder="Search children by name or parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        

        <Dialog open={checkOutOpen} onOpenChange={setCheckOutOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Child Check-Out</DialogTitle>
              {selectedAttendance && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Child:</strong> {selectedAttendance.child.fullName}
                  </p>
                  {selectedAttendance.checkInTime && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Checked In:</strong> {new Date(selectedAttendance.checkInTime).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </DialogHeader>
            <form onSubmit={handleCheckOut} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="takenBy" className="text-sm font-semibold">Who is picking up the child? *</Label>
                <Input
                  id="takenBy"
                  value={checkOutData.takenBy || ""}
                  onChange={(e) => setCheckOutData({ ...checkOutData, takenBy: e.target.value || "" })}
                  placeholder="Enter name"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutTime" className="text-sm font-semibold">Check-Out Time *</Label>
                <Input
                  id="checkOutTime"
                  type="datetime-local"
                  value={checkOutData.checkOutTime}
                  onChange={(e) => setCheckOutData({ ...checkOutData, checkOutTime: e.target.value })}
                  required
                  className="h-11"
                />
              </div>


              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCheckOutOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Check-Out"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Check-In Modal */}
        <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Child Check-In</DialogTitle>
            </DialogHeader>
            {selectedChild && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Child:</strong> {selectedChild.fullName}
                </p>
              </div>
            )}
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="broughtBy" className="text-sm font-semibold">Brought By *</Label>
                <Input
                  id="broughtBy"
                  value={checkInData.broughtBy}
                  onChange={(e) => setCheckInData({ ...checkInData, broughtBy: e.target.value })}
                  placeholder="Enter name"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkInTime" className="text-sm font-semibold">Check-In Time *</Label>
                <Input
                  id="checkInTime"
                  type="datetime-local"
                  value={checkInData.checkInTime}
                  onChange={(e) => setCheckInData({ ...checkInData, checkInTime: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCheckInOpen(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Check-In"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        

        {/* Children List with Attendance Actions */}
        {loading ? (
          <p>Loading children...</p>
        ) : (
          <div className="space-y-4">
            {filteredChildren.map((child) => {
              const childRecords = attendance.filter(att => att.childId === child.id);
              const getStatusForDate = (dt: Date) => {
                const y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
                const rec = childRecords.find(r => {
                  const t = new Date(r.createdAt);
                  return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
                });
                return rec?.status ?? 'absent';
              };
              const getCountsForRange = () => {
                if (dateRange.length === 0) {
                  // Fallback to records-only counts (same-day)
                  const present = childRecords.filter(r => r.status === 'present').length;
                  const late = childRecords.filter(r => r.status === 'late').length;
                  const absent = present + late === 0 ? 1 : 0;
                  return { present, late, absent, totalDays: Math.max(1, present + late + absent) };
                }
                let present = 0, late = 0, absent = 0;
                for (const dt of dateRange) {
                  const st = getStatusForDate(dt);
                  if (st === 'present') present++;
                  else if (st === 'late') late++;
                  else absent++;
                }
                return { present, late, absent, totalDays: dateRange.length };
              };
              const counts = getCountsForRange();
              const childAttendance = childRecords[0];
              const isPresent = !!childRecords.find(r => r.status === 'present' || r.status === 'late');
              const isAbsent = childRecords.length === 0 || childRecords.every(r => r.status === 'absent');
              const isLate = !!childRecords.find(r => r.status === 'late');
              
              return (
                <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {child.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{child.fullName}</h3>
                        <p className="text-sm text-gray-600">
                          {child.parentName} • {child.relationship}
                        </p>
                        <div className="flex flex-col gap-1 mt-1">
                          {/* Current day badge (only if not fully absent) */}
                          {!isAbsent && childAttendance && (
                            <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${
                              isPresent ? 'bg-green-100 text-green-800' :
                              isLate ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {childAttendance.status.charAt(0).toUpperCase() + childAttendance.status.slice(1)}
                            </span>
                          )}
                          {/* Summary counts for selected period (always visible when period selected) */}
                          {dateRange.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">
                                Present: {counts.present}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                                Late: {counts.late}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">
                                Absent: {counts.absent}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                Total days: {counts.totalDays}
                              </span>
                              {counts.absent === counts.totalDays && (
                                <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                  Absent all days
                                </span>
                              )}
                            </div>
                          )}
                          {currentFilter === 'week' && dateRange.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {dateRange.map((dt, idx) => {
                                const st = getStatusForDate(dt);
                                const label = dt.toLocaleDateString(undefined, { weekday: 'short' });
                                const dateNum = dt.getDate();
                                const badgeClass = st === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : st === 'late'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-700';
                                return (
                                  <span key={idx} className={`text-[10px] px-2 py-1 rounded ${badgeClass}`} title={dt.toLocaleDateString()}>
                                    {label} {dateNum}: {st}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {childAttendance && childAttendance.checkInTime && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-700">Checked in:</span>
                                <span className="text-gray-600">
                                  {new Date(childAttendance.checkInTime).toLocaleString()}
                                </span>
                              </div>
                            )}
                          {childAttendance && childAttendance.checkOutTime && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-700">Checked out:</span>
                                <span className="text-gray-600">
                                  {new Date(childAttendance.checkOutTime).toLocaleString()}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!childAttendance ? (
                      // No attendance record - show all options
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedChild(child);
                            setCheckInData({ broughtBy: "", checkInTime: formatLocalDateTimeInput(new Date()) });
                            setCheckInOpen(true);
                          }}
                          disabled={loading}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                          onClick={() => handleAttendanceAction(child.id, 'late')}
                          disabled={loading}
                        >
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleAttendanceAction(child.id, 'absent')}
                          disabled={loading}
                        >
                          Absent
                        </Button>
                      </>
                    ) : (
                      // Has attendance record - show status-specific actions
                      <>
                        {isAbsent ? (
                          <span className="text-sm font-medium text-red-600">Absent</span>
                        ) : (
                          <>
                            {!childAttendance.checkOutTime && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAttendance(childAttendance);
                                  setCheckOutOpen(true);
                              setCheckOutData({
                                takenBy: "",
                                checkOutTime: formatLocalDateTimeInput(new Date()),
                              });
                                }}
                                disabled={loading}
                              >
                                Check Out
                              </Button>
                            )}
                            {childAttendance.checkOutTime && (
                              <span className="text-sm text-gray-500 font-medium">✓ Checked Out</span>
                            )}
                          </>
                        )}
                        
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredChildren.length === 0 && (
              <div className="text-center py-8 text-gray-500">No results.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}