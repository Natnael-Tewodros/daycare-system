"use client";

import { useState, useEffect } from "react";
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
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ChildFormCard from "@/components/children/ChildFormCard";
import EditChildDialog from "@/components/children/EditChildDialog";
import type { ChildForm, ParentInfo, ChildRow } from "./types";

const EMPTY: ChildForm = {
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
  const [parent, setParent] = useState<ParentInfo>({ username: "" });
  const [forms, setForms] = useState<ChildForm[]>([]);
  const [list, setList] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ChildRow | null>(null);
  const [editData, setEditData] = useState<ChildForm>(EMPTY);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/children");
      if (!r.ok) throw new Error("Failed");
      const data: ChildRow[] = await r.json();
      // Oldest first so newest appear at the bottom
      const sorted = [...data].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        if (aTime !== bTime) return aTime - bTime;
        const aId = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10) || 0;
        const bId = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10) || 0;
        return aId - bId;
      });
      setList(sorted);
    } catch (err) {
      alert("Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  // Validate parent
  const validateParent = async (): Promise<boolean> => {
    const u = parent.username.trim();
    if (!u) {
      alert("Enter username");
      return false;
    }
    try {
      const r = await fetch(`/api/users/check-username?username=${encodeURIComponent(u)}`);
      const { exists, user } = await r.json();
      if (!exists) {
        alert("Parent not found");
        return false;
      }

      const req = await fetch("/api/enrollment-requests");
      const { data = [] } = await req.json();
      const ok = data.some(
        (x: any) =>
          x.status === "approved" &&
          (x.email?.toLowerCase() === user?.email?.toLowerCase() ||
            x.parentName?.toLowerCase() === user?.name?.toLowerCase())
      );
      if (!ok) {
        alert("No approved request");
        return false;
      }
      return true;
    } catch {
      alert("Validation error");
      return false;
    }
  };

  // Actions
  const addForm = async () => {
    if (!(await validateParent())) return;
    const newIdx = forms.length;
    setForms((p) => [...p, { ...EMPTY }]);
    setOpenIdx(newIdx);
  };

  const removeForm = (i: number) => setForms((p) => p.filter((_, x) => x !== i));
  const clearAll = () => {
    setParent({ username: "" });
    setForms([]);
    setOpenIdx(null);
  };

  const submitOne = async (c: ChildForm, i: number) => {
    if (!valid(c)) return;
    setLoading(true);
    try {
      const fd = fdFrom(c, parent.username);
      const r = await fetch("/api/children", { method: "POST", body: fd });
      const j = await r.json();
      if (r.ok) {
        alert(`${c.fullName} saved`);
        setForms((p) => p.map((f, x) => (x === i ? { ...EMPTY } : f)));
        fetchChildren();
      } else alert(j.error ?? "Failed");
    } catch {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };

  const submitAll = async () => {
    if (!parent.username || !forms.length) return;
    if (forms.some((c) => !valid(c))) {
      alert("Fill required fields");
      return;
    }
    setLoading(true);
    try {
      for (const c of forms) {
        const fd = fdFrom(c, parent.username);
        const r = await fetch("/api/children", { method: "POST", body: fd });
        if (!r.ok) throw new Error((await r.json()).error);
      }
      alert("All saved");
      clearAll();
      fetchChildren();
    } catch (e: any) {
      alert(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (c: ChildRow) => {
    setEditing(c);
    setEditData({
      ...EMPTY,
      fullName: c.fullName ?? "",
      relationship: c.relationship ?? "",
      gender: c.gender ?? "",
      dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().split("T")[0] : "",
      site: c.site ?? "",
      organization: c.organization?.name ?? "",
    });
    setEditOpen(true);
  };

  const editSubmit = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(editData).forEach(([k, v]) => {
        if (v instanceof File && v.size) fd.append(k, v);
        else if (v) fd.append(k, v as string);
      });
      const r = await fetch(`/api/children/${editing.id}`, { method: "PUT", body: fd });
      if (r.ok) {
        alert("Updated");
        setEditOpen(false);
        fetchChildren();
      } else alert((await r.json()).error ?? "Failed");
    } catch {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };

  const valid = (c: ChildForm) =>
    ["fullName", "relationship", "gender", "dateOfBirth", "site", "organization"].every(
      (f) => !!c[f as keyof ChildForm]
    );

  const fdFrom = (c: ChildForm, u: string) => {
    const fd = new FormData();
    fd.append("parentUsername", u);
    (Object.keys(c) as (keyof ChildForm)[]).forEach((k) => {
      const v = c[k];
      if (v instanceof File && v.size) fd.append(k, v);
      else if (typeof v === "string" && v) fd.append(k, v);
    });
    return fd;
  };

  const toggle = (i: number) => setOpenIdx((p) => (p === i ? null : i));

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* COMPACT PARENT BAR WITH DESCRIPTION */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-5 py-3 flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <Input
              value={parent.username}
              onChange={(e) => setParent({ username: e.target.value })}
              placeholder="Parent username *"
              aria-required="true"
              className="w-48 h-8 text-sm border-slate-300 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-slate-500 pl-6 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Must be registered & approved parent
          </p>
        </div>

        <div className="flex gap-1.5">
          <Button
            size="sm"
            onClick={addForm}
            disabled={loading || !parent.username.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
          {forms.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={submitAll}
              disabled={loading}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Save className="w-4 h-4" />
            </Button>
          )}
          {(parent.username || forms.length) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAll}
              disabled={loading}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE FORMS */}
      {forms.length > 0 && (
        <div className="px-5 py-3 space-y-2 border-b border-slate-100 bg-white/50">
          {forms.map((c, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <button
                className="w-full px-4 py-2.5 flex justify-between items-center text-sm font-medium hover:bg-slate-50 transition"
                onClick={() => toggle(i)}
                disabled={loading}
              >
                <span>Child #{i + 1}</span>
                {openIdx === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openIdx === i && (
                <div className="p-4 border-t border-slate-100">
                  <ChildFormCard
                    child={c}
                    index={i}
                    formCount={forms.length}
                    isLoading={loading}
                    onChildChange={(idx, f, v) =>
                      setForms((p) => {
                        const a = [...p];
                        a[idx] = { ...a[idx], [f]: v };
                        return a;
                      })
                    }
                    onSubmit={() => submitOne(c, i)}
                    onRemove={() => removeForm(i)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODERN TABLE */}
      <div className="flex-1 p-5 overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {list.length} Registered {list.length === 1 ? "Child" : "Children"}
          </span>
          <Button size="sm" variant="ghost" onClick={fetchChildren} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="max-h-full overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Child
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Relationship
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    DOB
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Site
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Child Doc
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                      No children registered yet
                    </td>
                  </tr>
                ) : (
                  list.map((child, idx) => (
                    <tr
                      key={child.id}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                      onClick={() => openEdit(child)}
                    >
                      {/* NAME + AVATAR */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {child.profilePic ? (
                            <img
                              src={
                                child.profilePic.startsWith("http") || child.profilePic.startsWith("/")
                                  ? child.profilePic
                                  : `/uploads/${child.profilePic}`
                              }
                              alt={child.fullName}
                              className="w-9 h-9 rounded-full object-cover shadow-sm"
                            />
                          ) : (
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 blur-md opacity-70"></div>
                              <div className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm font-bold text-slate-700 shadow-inner">
                                {child.fullName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                          )}
                          <span className="font-medium text-slate-800">{child.fullName}</span>
                        </div>
                      </td>

                      {/* RELATIONSHIP */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          {child.relationship || "—"}
                        </div>
                      </td>

                      {/* GENDER */}
                      <td className="px-5 py-4 text-sm">
                        <Badge variant="secondary">{child.gender || "—"}</Badge>
                      </td>

                      {/* DOB */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {child.dateOfBirth
                            ? new Date(child.dateOfBirth).toLocaleDateString()
                            : "—"}
                        </div>
                      </td>

                      {/* SITE */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {child.site || "—"}
                        </div>
                      </td>

                      {/* ORGANIZATION */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {child.organization?.name || "—"}
                        </div>
                      </td>

                      {/* CHILD DOC */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {child.childInfoFile ? (
                          <a
                            href={child.childInfoFile.startsWith("http") || child.childInfoFile.startsWith("/")
                              ? child.childInfoFile
                              : `/uploads/${child.childInfoFile}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(child);
                          }}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT DIALOG */}
      <EditChildDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        isLoading={loading}
        editFormData={editData}
        setEditFormData={setEditData}
        onSubmit={editSubmit}
      />
    </div>
  );
}