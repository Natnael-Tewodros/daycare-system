"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import {
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  UserPlus,
  Edit3,
  Calendar,
  MapPin,
  Building,
  UserCheck,
  Users,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ChildFormCard from "@/components/children/ChildFormCard";
import EditChildDialog from "@/components/children/EditChildDialog";
import type { ChildForm, ParentInfo, ChildRow } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const EMPTY_FORM: ChildForm = {
  fullName: "",
  relationship: "",
  gender: "",
  dateOfBirth: "",
  site: "",
  organization: "",
  profilePic: null,
  childInfoFile: null,
  otherFile: null,
};

export default function AdminPage() {
  const router = useRouter();
  const [parent, setParent] = useState<ParentInfo>({ username: "" });
  const [forms, setForms] = useState<ChildForm[]>([]);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ChildRow | null>(null);
  const [editData, setEditData] = useState<ChildForm>(EMPTY_FORM);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  useEffect(() => {
    if (successMessage) {
      setPopupVisible(true);
      const t = setTimeout(() => setPopupVisible(false), 3000);
      return () => clearTimeout(t);
    }
    return;
  }, [successMessage]);
  // Termination state
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminateChild, setTerminateChild] = useState<ChildRow | null>(null);
  const [terminateReason, setTerminateReason] = useState<string>("GRADUATED");
  const [terminateNotes, setTerminateNotes] = useState<string>("");
  // View termination details
  const [viewTerminateOpen, setViewTerminateOpen] = useState(false);
  const [viewReasonText, setViewReasonText] = useState<string>("");
  const [viewNotesText, setViewNotesText] = useState<string>("");
  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(children.length / PAGE_SIZE));
  const paginatedChildren = children.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/children");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: ChildRow[] = await res.json();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      );
      setChildren(sorted);
    } catch {
      alert("Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const validateParent = async (): Promise<boolean> => {
    const username = parent.username.trim();
    if (!username) return alert("Enter username"), false;

    try {
      const res = await fetch(
        `/api/users/check-username?username=${encodeURIComponent(username)}`
      );
      const { exists } = await res.json();
      if (!exists) return alert("Parent not found"), false;
      return true;
    } catch {
      return alert("Validation error"), false;
    }
  };

  const addForm = async () => {
    if (!(await validateParent())) return;
    const newIdx = forms.length;
    setForms((prev) => [...prev, { ...EMPTY_FORM }]);
    setOpenIdx(newIdx);
  };

  const removeForm = (index: number) => {
    setForms((prev) => prev.filter((_, i) => i !== index));
    if (openIdx === index) setOpenIdx(null);
    else if (openIdx !== null && openIdx > index) setOpenIdx(openIdx - 1);
  };

  const clearAll = () => {
    setForms([]);
    setOpenIdx(null);
    setParent({ username: "" });
  };

  const submitForm = async (child: ChildForm, index: number) => {
    if (!(await validateParent())) return;

    const username = parent.username.trim();
    const formData = new FormData();
    formData.append("parentUsername", username);

    Object.entries(child).forEach(([key, value]) => {
      if (value instanceof File && value.size) formData.append(key, value);
      else if (typeof value === "string" && value) formData.append(key, value);
    });

    setLoading(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        body: formData,
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          result.error || result.message || "Failed to create child"
        );
      }

      // Use server-provided message when available for consistency
      setSuccessMessage(result.message || "Child created successfully!");
      // Ensure the alert is visible to the user
      setTimeout(() => {
        if (alertRef.current) {
          try {
            alertRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          } catch {}
        } else {
          try {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } catch {}
        }
      }, 50);
      setTimeout(() => setSuccessMessage(null), 3000);
      setForms((prev) => prev.filter((_, i) => i !== index));
      if (openIdx === index) setOpenIdx(null);
      fetchChildren();
    } catch (error: any) {
      alert(error?.message || "Failed to create child");
    } finally {
      setLoading(false);
    }
  };

  const submitAll = async () => {
    if (!(await validateParent())) return;

    for (let i = 0; i < forms.length; i++) {
      await submitForm(forms[i], i);
    }
  };

  const openEdit = (child: ChildRow) => {
    setEditing(child);
    setEditData({
      ...EMPTY_FORM,
      fullName: child.fullName ?? "",
      relationship: child.relationship ?? "",
      gender: child.gender ?? "",
      dateOfBirth: child.dateOfBirth
        ? new Date(child.dateOfBirth).toISOString().split("T")[0]
        : "",
      site: child.site ?? "",
      organization: child.organization ?? "",
    });
    setEditOpen(true);
  };

  const editSubmit = async () => {
    if (!editing) return;

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(editData).forEach(([key, value]) => {
        if (value instanceof File && value.size) formData.append(key, value);
        else if (typeof value === "string") formData.append(key, value);
      });

      const res = await fetch(`/api/children/${editing.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update child");
      }

      setSuccessMessage("Child updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditOpen(false);
      setEditing(null);
      fetchChildren();
    } catch (error: any) {
      alert(error?.message || "Failed to update child");
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = (index: number) =>
    setOpenIdx((prev) => (prev === index ? null : index));

  const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
      {children}
    </th>
  );

  const TableCell = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <td className={`px-4 py-3 text-sm text-gray-600 ${className}`}>
      {children}
    </td>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Children Management
            </h1>
            <p className="text-gray-600 mt-1">
              Register and manage children information
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="px-6 py-4" ref={alertRef}>
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Floating toast popup */}
      {popupVisible && successMessage && (
        <div className="fixed top-6 right-6 z-50">
          <div className="min-w-[260px]">
            <Alert className="border-green-200 bg-green-50 shadow-lg">
              <div className="flex items-start justify-between">
                <AlertDescription className="pr-4">
                  {successMessage}
                </AlertDescription>
                <button
                  aria-label="Close notification"
                  onClick={() => setPopupVisible(false)}
                  className="text-gray-500 hover:text-gray-700 ml-2"
                >
                  ×
                </button>
              </div>
            </Alert>
          </div>
        </div>
      )}

      {/* Parent Input Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <Input
              value={parent.username}
              onChange={(e) => setParent({ username: e.target.value })}
              placeholder="Enter parent username *"
              className="max-w-xs"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={addForm}
              disabled={loading || !parent.username.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Child
            </Button>

            {forms.length > 1 && (
              <Button
                onClick={submitAll}
                disabled={loading}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Save className="w-4 h-4" />
                Save All
              </Button>
            )}

            {(parent.username || forms.length > 0) && (
              <Button
                onClick={clearAll}
                disabled={loading}
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Forms Section */}
      {forms.length > 0 && (
        <div className="px-6 py-4 space-y-3 bg-gray-50/50 border-b border-gray-200">
          {forms.map((form, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              <button
                onClick={() => toggleForm(index)}
                disabled={loading}
                className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  Child #{index + 1} - {form.fullName || "Unnamed"}
                </span>
                {openIdx === index ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {openIdx === index && (
                <div className="p-4 border-t border-gray-100">
                  <ChildFormCard
                    child={form}
                    index={index}
                    formCount={forms.length}
                    isLoading={loading}
                    onChildChange={(idx, field, value) =>
                      setForms((prev) =>
                        prev.map((f, i) =>
                          i === idx ? { ...f, [field]: value } : f
                        )
                      )
                    }
                    onSubmit={() => submitForm(form, index)}
                    onRemove={() => removeForm(index)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Children Table */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">
                {children.length} Registered{" "}
                {children.length === 1 ? "Child" : "Children"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchChildren}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader>Child</TableHeader>
                  <TableHeader>Relationship</TableHeader>
                  <TableHeader>Gender</TableHeader>
                  <TableHeader>Date of Birth</TableHeader>
                  <TableHeader>Site</TableHeader>
                  <TableHeader>Organization</TableHeader>
                  <TableHeader>Documents</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {children.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      No children registered yet
                    </td>
                  </tr>
                ) : (
                  paginatedChildren.map((child) => (
                    <tr
                      key={child.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => openEdit(child)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {child.profilePic ? (
                            <img
                              src={
                                child.profilePic.startsWith("http") ||
                                child.profilePic.startsWith("/")
                                  ? child.profilePic
                                  : `/uploads/${child.profilePic}`
                              }
                              alt={child.fullName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                              {child.fullName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {child.fullName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          {child.relationship || "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {child.gender || "—"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {child.dateOfBirth
                            ? new Date(child.dateOfBirth).toLocaleDateString()
                            : "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {child.site || "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          {child.organization?.name || "—"}
                        </div>
                      </TableCell>

                      <TableCell>
                        {child.childInfoFile ? (
                          <a
                            href={
                              child.childInfoFile.startsWith("http") ||
                              child.childInfoFile.startsWith("/")
                                ? child.childInfoFile
                                : `/uploads/${child.childInfoFile}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Document
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {(() => {
                          const status = (child as any).approvalStatus || "";
                          const lower = String(status).toLowerCase();
                          if (lower.startsWith("terminated")) {
                            // format: terminated:REASON[:notes]
                            const parts = String(status).split(":");
                            const rawReason = (
                              parts[1] || "UNKNOWN"
                            ).toUpperCase();
                            const reasonMap: Record<string, string> = {
                              GRADUATED: "Graduated",
                              PARENT_LEFT_COMPANY: "Parent left company",
                              TRANSFERRED: "Transferred",
                              DECEASED: "Death",
                              OTHER: "Other",
                              UNKNOWN: "Unknown",
                            };
                            const reasonText =
                              reasonMap[rawReason] || rawReason;
                            const notes =
                              parts.length > 2 ? parts.slice(2).join(":") : "";
                            return (
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-red-100 text-red-700 border-red-200 w-fit">
                                  Terminated
                                </Badge>
                                <span className="text-xs text-gray-700 font-medium">
                                  Reason:
                                </span>
                                <span className="text-xs text-gray-600">
                                  {reasonText}
                                </span>
                                {notes && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-700 font-medium">
                                      Notes:
                                    </span>
                                    <span
                                      className="text-xs text-gray-500 line-clamp-1"
                                      title={notes}
                                    >
                                      {notes}
                                    </span>
                                    <button
                                      className="text-xs text-blue-600 hover:underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewReasonText(reasonText);
                                        setViewNotesText(notes);
                                        setViewTerminateOpen(true);
                                      }}
                                    >
                                      View
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          // default non-terminated
                          return (
                            <span className="text-sm text-gray-500">
                              {status || "active"}
                            </span>
                          );
                        })()}
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(child);
                          }}
                          className="text-blue-600 hover:bg-blue-50"
                          title="Edit Child"
                        >
                          <Edit3 className="w-4 h-4 mr-1.5" />
                          <span className="hidden md:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTerminateChild(child);
                            setTerminateReason("GRADUATED");
                            setTerminateNotes("");
                            setTerminateOpen(true);
                          }}
                          className="ml-1 border-red-200 text-red-600 hover:bg-red-50 rounded-full px-3 py-1 transition-colors"
                          title="Terminate Child"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          <span className="hidden md:inline">Terminate</span>
                        </Button>
                      </TableCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          {children.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditChildDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        isLoading={loading}
        editFormData={editData}
        setEditFormData={setEditData}
        onSubmit={editSubmit}
      />

      {/* Terminate Dialog */}
      <Dialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Terminate Child</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Child</Label>
              <div className="mt-1 text-gray-900 font-medium">
                {terminateChild?.fullName}
              </div>
            </div>
            <div>
              <Label
                htmlFor="terminateReason"
                className="text-sm font-medium text-gray-700"
              >
                Reason
              </Label>
              <select
                id="terminateReason"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
              >
                <option value="GRADUATED">Graduate</option>
                <option value="PARENT_LEFT_COMPANY">
                  Parent left the company
                </option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="DECEASED">Death</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Label
                htmlFor="terminateNotes"
                className="text-sm font-medium text-gray-700"
              >
                Notes (optional)
              </Label>
              <textarea
                id="terminateNotes"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 min-h-[80px]"
                value={terminateNotes}
                onChange={(e) => setTerminateNotes(e.target.value)}
                placeholder="Add any additional details…"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTerminateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={loading || !terminateChild}
                onClick={async () => {
                  if (!terminateChild) return;
                  setLoading(true);
                  try {
                    const res = await fetch(
                      `/api/children/${terminateChild.id}/terminate`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          reason: terminateReason,
                          notes: terminateNotes,
                        }),
                      }
                    );
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || "Failed to terminate child");
                    }
                    alert("Child terminated successfully");
                    setTerminateOpen(false);
                    setTerminateChild(null);
                    fetchChildren();
                  } catch (e: any) {
                    alert(e?.message || "Failed to terminate child");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Confirm Termination
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Termination Details Dialog */}
      <Dialog open={viewTerminateOpen} onOpenChange={setViewTerminateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Termination Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Reason</span>
              <div className="mt-1 text-gray-900">{viewReasonText || "—"}</div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <div className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                {viewNotesText || "—"}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
