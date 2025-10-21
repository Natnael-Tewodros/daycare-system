"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface ChildForm {
  fullName: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  site: string;
  organization: string;
  profilePic: File | null;
  childInfoFile: File | null;
  otherFile: File | null;
}

interface ParentInfo {
  name: string;
  email: string;
  password: string;
}

export default function AdminPage() {
  const [parentInfo, setParentInfo] = useState<ParentInfo>({
    name: "",
    email: "",
    password: ""
  });
  const [childrenForms, setChildrenForms] = useState<ChildForm[]>([]);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Added for loading state

  const fetchChildren = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/children");
      const data = await res.json();
      setChildrenList(data);
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const addChildForm = () => {
    if (!parentInfo.name || !parentInfo.email || !parentInfo.password) {
      return alert("Please fill in all parent information (name, email, password) first!");
    }
    setChildrenForms([
      ...childrenForms,
      emptyChildForm()
    ]);
  };

  const handleChildChange = (
    index: number,
    field: keyof ChildForm,
    value: any
  ) => {
    const newForms = [...childrenForms];
    newForms[index][field] = value;
    setChildrenForms(newForms);
  };

  const handleSubmitChild = async (child: ChildForm, index: number) => {
    setIsLoading(true);
    try {
      // Basic required validation
      if (!child.fullName || !child.relationship || !child.gender || !child.dateOfBirth || !child.site || !child.organization) {
        alert("Please fill all required fields (name, relationship, gender, DOB, site, organization)");
        return;
      }
      const formData = new FormData();
      formData.append("parentName", parentInfo.name);
      formData.append("parentEmail", parentInfo.email);
      formData.append("parentPassword", parentInfo.password);
      formData.append("fullName", child.fullName);
      formData.append("relationship", child.relationship);
      formData.append("gender", child.gender);
      formData.append("dateOfBirth", child.dateOfBirth);
      formData.append("site", child.site);
      formData.append("organization", child.organization);
      if (child.profilePic) formData.append("profilePic", child.profilePic);
      if (child.childInfoFile) formData.append("childInfoFile", child.childInfoFile);
      if (child.relationship === "OTHER" && child.otherFile) formData.append("otherFile", child.otherFile);

      const res = await fetch("/api/children", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        alert(`✅ Child ${child.fullName} registered successfully!`);
        fetchChildren();
        // Clear this specific form by index
        setChildrenForms((prev) => prev.map((f, i) => i === index ? emptyChildForm() : f));
        // If all forms are empty after clearing this one, clear parent info
        setChildrenForms((prev) => {
          const allEmpty = prev.every(f => !f.fullName && !f.relationship && !f.gender && !f.dateOfBirth && !f.site && !f.organization && !f.profilePic && !f.childInfoFile && !f.otherFile);
          if (allEmpty) {
            setParentInfo({ name: "", email: "", password: "" });
          }
          return prev;
        });
      } else {
        alert("❌ Failed to register child");
      }
    } catch (error) {
      alert("❌ Error registering child");
      console.error("Error submitting child:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const emptyChildForm = (): ChildForm => ({
    fullName: "",
    relationship: "",
    gender: "",
    dateOfBirth: "",
    site: "",
    organization: "",
    profilePic: null,
    childInfoFile: null,
    otherFile: null,
  });

  // Removed reference-based index finder; using index passed from render

  const handleRegisterAll = async () => {
    if (!parentInfo.name || !parentInfo.email || !parentInfo.password) {
      return alert("Please fill in all parent information (name, email, password) first!");
    }
    if (childrenForms.length === 0) return alert("Add at least one child form.");
    setIsLoading(true);
    try {
      for (const child of childrenForms) {
        if (!child.fullName || !child.relationship || !child.gender || !child.dateOfBirth || !child.site || !child.organization) {
          alert("Please fill all required fields in every child form.");
          setIsLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("parentName", parentInfo.name);
        formData.append("parentEmail", parentInfo.email);
        formData.append("parentPassword", parentInfo.password);
        formData.append("fullName", child.fullName);
        formData.append("relationship", child.relationship);
        formData.append("gender", child.gender);
        formData.append("dateOfBirth", child.dateOfBirth);
        formData.append("site", child.site);
        formData.append("organization", child.organization);
        if (child.profilePic) formData.append("profilePic", child.profilePic);
        if (child.childInfoFile) formData.append("childInfoFile", child.childInfoFile);
        if (child.relationship === "OTHER" && child.otherFile) formData.append("otherFile", child.otherFile);

        const res = await fetch("/api/children", { method: "POST", body: formData });
        const result = await res.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to register a child");
        }
      }
      alert("✅ All children registered successfully!");
      setChildrenForms([]);
      setParentInfo({ name: "", email: "", password: "" });
      fetchChildren();
    } catch (err) {
      console.error("Bulk register error:", err);
      alert("❌ Failed to register all children. Some may not be saved.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeChildForm = (index: number) => {
    setChildrenForms(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllForms = () => {
    setParentInfo({ name: "", email: "", password: "" });
    setChildrenForms([]);
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Parent Name + Add Child Button */}
      <Card className="shadow-lg border border-slate-200 rounded-xl transition-all hover:shadow-xl">
        <CardHeader className="bg-slate-50 rounded-t-xl">
          <CardTitle className="text-2xl font-semibold text-slate-800">
            Parent Information
          </CardTitle>
          <CardDescription className="text-slate-600">
            Enter the parent's name and add children details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Parent Name *</Label>
              <Input
                value={parentInfo.name}
                onChange={(e) => setParentInfo(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter parent's full name"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Parent Email *</Label>
              <Input
                type="email"
                value={parentInfo.email}
                onChange={(e) => setParentInfo(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter parent's email"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Parent Password *</Label>
              <Input
                type="password"
                value={parentInfo.password}
                onChange={(e) => setParentInfo(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter parent's password"
                required
              />
            </div>
          </div>
          <div className="flex gap-4 items-end">
            <Button
              onClick={addChildForm}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              disabled={isLoading}
            >
              ➕ Add Child
            </Button>
            {childrenForms.length > 1 && (
              <Button
                onClick={handleRegisterAll}
                className="bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                disabled={isLoading}
              >
                🚀 Register All
              </Button>
            )}
            {(parentInfo.name || parentInfo.email || parentInfo.password || childrenForms.length > 0) && (
              <Button
                onClick={clearAllForms}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 font-medium transition-colors"
                disabled={isLoading}
              >
                🗑️ Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Child Forms */}
      {childrenForms.map((child, index) => (
        <Card
          key={index}
          className="shadow-lg border border-slate-200 rounded-xl transition-all hover:shadow-xl"
        >
          <CardHeader className="bg-slate-50 rounded-t-xl flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-800">
              Child Information {childrenForms.length > 1 ? `#${index + 1}` : ""}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeChildForm(index)}
              className="text-slate-500 hover:text-red-600"
              aria-label="Remove child form"
            >
              ✖
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div>
              <Label className="text-sm font-medium text-slate-700">Full Name</Label>
              <Input
                value={child.fullName}
                onChange={(e) =>
                  handleChildChange(index, "fullName", e.target.value)
                }
                className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter child's full name"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Relationship</Label>
              <Select
                value={child.relationship}
                onValueChange={(v) =>
                  handleChildChange(index, "relationship", v)
                }
              >
                <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FATHER">Father</SelectItem>
                  <SelectItem value="MOTHER">Mother</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {child.relationship === "OTHER" && (
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  Upload Document for Other
                </Label>
                <Input
                  type="file"
                  onChange={(e) =>
                    handleChildChange(index, "otherFile", e.target.files?.[0] || null)
                  }
                  className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-slate-700">Gender</Label>
              <Select
                value={child.gender}
                onValueChange={(v) => handleChildChange(index, "gender", v)}
              >
                <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
              <Input
                type="date"
                value={child.dateOfBirth}
                onChange={(e) =>
                  handleChildChange(index, "dateOfBirth", e.target.value)
                }
                className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Site</Label>
              <Select
                value={child.site}
                onValueChange={(v) => handleChildChange(index, "site", v)}
              >
                <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSA">INSA</SelectItem>
                  <SelectItem value="OPERATION">Operation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Organization</Label>
              <Select
                value={child.organization}
                onValueChange={(v) => handleChildChange(index, "organization", v)}
              >
                <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSA">INSA</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                  <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Profile Picture</Label>
              <Input
                type="file"
                onChange={(e) =>
                  handleChildChange(index, "profilePic", e.target.files?.[0] || null)
                }
                className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700">Child Info File</Label>
              <Input
                type="file"
                onChange={(e) =>
                  handleChildChange(index, "childInfoFile", e.target.files?.[0] || null)
                }
                className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 rounded-b-xl">
            <Button
              onClick={() => handleSubmitChild(child, index)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "✅ Register This Child"}
            </Button>
          </CardFooter>
        </Card>
      ))}

      <Separator className="my-8" />

      {/* Registered Children Table */}
      <Card className="shadow-lg border border-slate-200 rounded-xl transition-all hover:shadow-xl">
        <CardHeader className="bg-slate-50 rounded-t-xl">
          <CardTitle className="text-2xl font-semibold text-slate-800">
            📋 Registered Children
          </CardTitle>
          <CardDescription className="text-slate-600">
            View all registered children below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-slate-600 animate-pulse">Loading children...</p>
          ) : childrenList.length === 0 ? (
            <p className="text-slate-500">No children registered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead className="font-semibold text-slate-800">ID</TableHead>
                  <TableHead className="font-semibold text-slate-800">Full Name</TableHead>
                  <TableHead className="font-semibold text-slate-800">Parent</TableHead>
                  <TableHead className="font-semibold text-slate-800">Gender</TableHead>
                  <TableHead className="font-semibold text-slate-800">Relationship</TableHead>
                  <TableHead className="font-semibold text-slate-800">Site</TableHead>
                  <TableHead className="font-semibold text-slate-800">Organization</TableHead>
                  <TableHead className="font-semibold text-slate-800">DOB</TableHead>
                  <TableHead className="font-semibold text-slate-800">Twin</TableHead>
                  <TableHead className="font-semibold text-slate-800">Document</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {childrenList.map((child, idx) => (
                  <TableRow
                    key={child.id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <TableCell className="text-slate-700">{child.id}</TableCell>
                    <TableCell className="text-slate-700">
                      <Link className="text-blue-600 hover:underline" href={`/dashboard/children/${child.id}`}>
                        {child.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-700">{child.parentName}</TableCell>
                    <TableCell className="text-slate-700">{child.gender}</TableCell>
                    <TableCell className="text-slate-700">{child.relationship}</TableCell>
                    <TableCell className="text-slate-700">{child.site}</TableCell>
                    <TableCell className="text-slate-700">{child.organization}</TableCell>
                    <TableCell className="text-slate-700">
                      {new Date(child.dateOfBirth).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {childrenList.filter((c: any) => c.parentName === child.parentName).length > 1 ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {child.childInfoFile ? (
                        <a
                          className="text-blue-600 hover:underline"
                          href={`/uploads/${child.childInfoFile}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-slate-400">No file</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}