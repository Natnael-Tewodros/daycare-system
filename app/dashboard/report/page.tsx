"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Image from "next/image";

interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  profileImage?: string;
  parentName?: string;
  relationship?: string;
}

interface Report {
  id: number;
  childId: number;
  title: string;
  content: string;
  createdAt: string;
  child: Child;
}

// Age calc with current date: October 13, 2025
const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date('2025-10-13');
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export default function ReportPage({ employeeId }: { employeeId?: string }) {
  const [childId, setChildId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const fetchReports = async () => {
    try {
      const url = `/api/reports`;
      console.log("Fetching reports from:", url); // Debug
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      console.log("Reports fetched:", data); // Debug
      setReports(data);
      setError(null);
    } catch (err) {
      console.error("Fetch reports error:", err);
      setError("Failed to load reports");
    }
  };

  const fetchChildren = async () => {
    try {
      const url = employeeId ? `/api/children?employeeId=${employeeId}&includeFull=false` : `/api/children?includeFull=false`;
      console.log("Fetching children from:", url); // Debug
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      console.log("Children fetched:", data); // Debug
      setChildren(data);
      setError(null);
    } catch (err) {
      console.error("Fetch children error:", err);
      setError("Failed to load children");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchReports(), fetchChildren()]);
      setLoading(false);
    };
    loadData();
  }, [employeeId]);

  useEffect(() => {
    if (childId && children.length > 0) {
      const child = children.find(c => c.id === childId);
      setSelectedChild(child || null);
    } else {
      setSelectedChild(null);
    }
  }, [childId, children]);

  const handleSubmit = async () => {
    if (!childId || !title || !content) {
      alert("Please fill all fields");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, title, content }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit");
      }

      alert("Report submitted!");
      setTitle("");
      setContent("");
      setChildId(null);
      await fetchReports();
    } catch (err) {
      console.error("Submit error:", err);
      setError(`Error: ${err.message}`);
      alert(`Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error} (Check console)</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Daycare Reports</h1>
      {employeeId && <p className="text-sm text-muted-foreground mb-4">For Employee: {employeeId}</p>}

      {/* Form */}
      <div className="bg-muted p-4 rounded-md mb-6">
        <Select onValueChange={(val) => setChildId(Number(val))} value={childId?.toString() || ""}>
          <SelectTrigger>
            <SelectValue placeholder={children.length ? "Select Child" : "No children available"} />
          </SelectTrigger>
          <SelectContent>
            {children.length === 0 ? (
              <SelectItem value="" disabled>No children to select</SelectItem>
            ) : (
              children.map((child) => (
                <SelectItem key={child.id} value={child.id.toString()}>
                  {child.fullName} ({calculateAge(child.dateOfBirth)}y, {child.gender})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedChild && (
          <div className="mt-3 p-2 bg-card border rounded-md">
            <h4 className="font-semibold">Selected: {selectedChild.fullName}</h4>
            {selectedChild.profileImage && <Image src={selectedChild.profileImage} alt="Profile" width={50} height={50} className="rounded-full mr-2" />}
            <p>Age: {calculateAge(selectedChild.dateOfBirth)} | Gender: {selectedChild.gender}</p>
            {selectedChild.parentName && <p>Parent: {selectedChild.parentName} ({selectedChild.relationship})</p>}
          </div>
        )}

        <Input placeholder="Title (e.g., Daily Summary)" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-3" />
        <Textarea placeholder="Content (meals, activities, notes)" value={content} onChange={(e) => setContent(e.target.value)} className="mt-3" rows={4} />

        <Button onClick={handleSubmit} disabled={submitting || !childId} className="mt-3">
          {submitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>

      {/* List */}
      <h2 className="text-xl font-semibold mb-2">Reports ({reports.length})</h2>
      {reports.length === 0 ? (
        <p>No reports yet. Create one above!</p>
      ) : (
        reports.map((r) => {
          const age = calculateAge(r.child.dateOfBirth);
          return (
            <div key={r.id} className="border p-3 rounded-md mb-2">
              <div className="flex items-center mb-2">
                {r.child.profileImage && <Image src={r.child.profileImage} alt="Profile" width={40} height={40} className="rounded-full mr-2" />}
                <div>
                  <p className="font-semibold">Child: {r.child.fullName} ({age}y, {r.child.gender})</p>
                  {r.child.parentName && <p className="text-sm text-muted-foreground">Parent: {r.child.parentName}</p>}
                </div>
              </div>
              <p className="font-semibold">Title: {r.title}</p>
              <p className="text-sm">{r.content}</p>
              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
            </div>
          );
        })
      )}
    </div>
  );
}