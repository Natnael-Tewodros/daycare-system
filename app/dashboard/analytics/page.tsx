"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const [childrenList, setChildrenList] = useState<{ id: number; fullName: string }[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childSearch, setChildSearch] = useState<string>("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setChildrenLoading(true);
        const res = await fetch('/api/children');
        if (!res.ok) return;
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data.map((c: any) => ({ id: c.id, fullName: c.fullName }))
          : [];
        setChildrenList(mapped);
      } catch {
        // ignore
      } finally {
        setChildrenLoading(false);
      }
    };
    loadChildren();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-lg text-muted-foreground">Child AI report tools</p>
        </div>

        {/* Child AI Reports Launcher */}
        <Card className="mb-8 border-blue-100 bg-white shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Filter className="h-5 w-5" />
                Child AI Reports
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a child to record daily observations or open the weekly AI summary report.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              <div className="flex-1 max-w-sm">
                <label className="text-xs font-medium mb-1.5 block text-gray-700">Search Child</label>
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
                  </svg>
                  <input
                    type="text"
                    className="w-full h-9 pl-8 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    placeholder={childrenLoading ? "Loading children..." : "Search by name"}
                    value={childSearch}
                    onChange={(e) => setChildSearch(e.target.value)}
                  />
                </div>
                <div className="mt-1.5 max-h-40 overflow-auto border border-gray-200 rounded-md bg-white divide-y">
                  {childrenList
                    .filter((c) => c.fullName.toLowerCase().includes(childSearch.trim().toLowerCase()))
                    .slice(0, 10)
                    .map((c) => {
                      const isSelected = String(c.id) === selectedChildId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedChildId(String(c.id))}
                          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors ${
                            isSelected ? "bg-blue-50 text-blue-700" : "text-gray-800"
                          }`}
                        >
                          {c.fullName}
                        </button>
                      );
                    })}
                  {!childrenLoading && childrenList.filter((c) => c.fullName.toLowerCase().includes(childSearch.trim().toLowerCase())).length === 0 && (
                    <div className="px-3 py-1.5 text-xs text-gray-500">No matches</div>
                  )}
                </div>
                {selectedChildId && (
                  <p className="mt-1.5 text-xs text-gray-500">Selected child ID: {selectedChildId}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button
                  className="sm:flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedChildId}
                  onClick={() => selectedChildId && router.push(`/dashboard/children/${selectedChildId}/observations`)}
                >
                  Record Daily Observation
                </Button>
                <Button
                  variant="outline"
                  className="sm:flex-1"
                  disabled={!selectedChildId}
                  onClick={() => selectedChildId && router.push(`/dashboard/children/${selectedChildId}/reports`)}
                >
                  View Weekly AI Report
                </Button>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Tip: Log observations each day first, then open the weekly AI report to generate the family-friendly summary.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


