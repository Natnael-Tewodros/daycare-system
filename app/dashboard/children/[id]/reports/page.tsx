"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Loader2, 
  Download, 
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle
} from "lucide-react";
// Markdown rendering helper
function renderMarkdown(content: string) {
  // Split content into sections
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let elementKey = 0;
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  // Helper to render text with bold formatting
  const renderTextWithBold = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={key++} className="font-semibold text-gray-900">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : [text];
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        elements.push(
          <p key={`para-${elementKey++}`} className="text-gray-700 mb-3 leading-relaxed">
            {renderTextWithBold(text)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elementKey++}`} className="list-disc list-inside mb-3 space-y-1 text-gray-700 ml-4">
          {listItems.map((item, idx) => {
            const itemText = item.replace(/^[-*]\s*/, '');
            return (
              <li key={idx} className="text-gray-700">
                {renderTextWithBold(itemText)}
              </li>
            );
          })}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith('# ')) {
      flushList();
      flushParagraph();
      elements.push(<h1 key={`h1-${elementKey++}`} className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0">{trimmed.substring(2)}</h1>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      flushParagraph();
      elements.push(<h2 key={`h2-${elementKey++}`} className="text-xl font-bold text-gray-800 mb-3 mt-5">{trimmed.substring(3)}</h2>);
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      flushParagraph();
      elements.push(<h3 key={`h3-${elementKey++}`} className="text-lg font-semibold text-gray-700 mb-2 mt-4">{trimmed.substring(4)}</h3>);
      return;
    }
    
    // Horizontal rule
    if (trimmed === '---') {
      flushList();
      flushParagraph();
      elements.push(<hr key={`hr-${elementKey++}`} className="my-4 border-gray-300" />);
      return;
    }
    
    // List items
    if (trimmed.match(/^[-*]\s/)) {
      if (!inList) {
        flushParagraph();
      }
      inList = true;
      listItems.push(trimmed);
      return;
    }
    
    // End of list
    if (inList && trimmed === '') {
      flushList();
      return;
    }
    
    // Regular paragraph
    if (trimmed) {
      if (inList) {
        flushList();
      }
      currentParagraph.push(trimmed);
    } else {
      flushList();
      flushParagraph();
    }
  });
  
  flushList();
  flushParagraph();
  
  return <div>{elements}</div>;
}

interface Report {
  id: number;
  title: string;
  content: string;
  reportType: string;
  weekStart: string | null;
  weekEnd: string | null;
  createdAt: string;
  child: {
    id: number;
    fullName: string;
  };
}

interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string;
}

export default function ChildReportsPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params?.id as string;
  
  const [child, setChild] = useState<Child | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // Date range for new report
  const [weekStart, setWeekStart] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date.toISOString().split('T')[0];
  });
  const [weekEnd, setWeekEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    if (childId) {
      fetchChild();
      fetchReports();
    }
  }, [childId]);

  const fetchChild = async () => {
    try {
      const res = await fetch(`/api/children/${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child");
      const data = await res.json();
      setChild(data);
    } catch (err: any) {
      setError(err.message || "Failed to load child");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!childId) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      const res = await fetch("/api/ai-reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: Number(childId),
          weekStart: weekStart ? new Date(weekStart).toISOString() : undefined,
          weekEnd: weekEnd ? new Date(weekEnd).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate report");
      }

      const newReport = await res.json();
      setReports(prev => [newReport, ...prev]);
      setSelectedReport(newReport);
      
      // Show success message
      alert("Report generated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
      alert(`Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const markdownToPlainText = (markdown: string) => {
    return markdown
      .replace(/^#\s+/gm, "")
      .replace(/^##\s+/gm, "")
      .replace(/^###\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/[-*]\s+/g, "• ")
      .replace(/\r?\n\s*\r?\n/g, "\n\n")
      .replace(/\r?\n/g, "\n");
  };

  const downloadReport = async (report: Report) => {
    try {
      setDownloadingId(report.id);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let cursorY = margin;

      const title = report.title;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(title, margin, cursorY);
      cursorY += 24;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const textContent = markdownToPlainText(report.content);
      const lines = doc.splitTextToSize(textContent, doc.internal.pageSize.getWidth() - margin * 2);

      lines.forEach((line: string) => {
        if (cursorY > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += 18;
      });

      doc.save(`${report.title.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && !child) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !child) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Children
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Analysis Reports
              </h1>
              <p className="text-gray-600 mt-1">
                {child?.fullName ? `Weekly reports for ${child.fullName}` : "Generate and view weekly analysis reports"}
              </p>
            </div>
          </div>
        </div>

        {/* Generate New Report Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Generate New Weekly Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week Start Date
                </label>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week End Date
                </label>
                <Input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={generateReport}
                  disabled={generating || !weekStart || !weekEnd}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              The AI will analyze attendance, activities, behavior, health, meals, and sleep patterns for the selected week.
            </p>
          </CardContent>
        </Card>

        {/* Reports List and Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Reports ({reports.length})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchReports}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No reports yet</p>
                    <p className="text-sm mt-1">Generate your first report above</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedReport?.id === report.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                              {report.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {report.weekStart && report.weekEnd && (
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Report Viewer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Report Viewer
                  </span>
                  {selectedReport && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={downloadingId === selectedReport.id}
                      onClick={() => downloadReport(selectedReport)}
                    >
                      {downloadingId === selectedReport.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download PDF
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedReport ? (
                  <div className="prose max-w-none">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 max-h-[600px] overflow-y-auto">
                      {renderMarkdown(selectedReport.content)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a report from the list to view</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

