"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

export default function AdminPage() {
  const [parentName, setParentName] = useState("");
  const [childrenForms, setChildrenForms] = useState<ChildForm[]>([]);
  const [childrenList, setChildrenList] = useState<any[]>([]);

  const fetchChildren = async () => {
    const res = await fetch("/api/children");
    const data = await res.json();
    setChildrenList(data);
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const addChildForm = () => {
    if (!parentName) return alert("Enter parent name first!");
    setChildrenForms([
      ...childrenForms,
      {
        fullName: "",
        relationship: "FATHER",
        gender: "MALE",
        dateOfBirth: "",
        site: "INSA",
        organization: "INSA",
        profilePic: null,
        childInfoFile: null,
        otherFile: null,
      },
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

  const handleSubmitChild = async (child: ChildForm) => {
    const formData = new FormData();
    formData.append("parentName", parentName);
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
      setChildrenForms((prev) =>
        prev.filter((_, i) => prev.indexOf(_) !== childrenForms.indexOf(child))
      );
    } else {
      alert("❌ Failed to register child");
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-10">
      {/* Parent Name + Add Child Button */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>Parent Info</CardTitle>
          <CardDescription>Enter parent name and add children</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 items-end">
          <div className="flex-1">
            <Label>Parent Name</Label>
            <Input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
            />
          </div>
          <Button onClick={addChildForm}>➕ Add Child</Button>
        </CardContent>
      </Card>

      {/* Dynamic Child Forms */}
      {childrenForms.map((child, index) => (
        <Card key={index} className="shadow-md border">
          <CardHeader>
            <CardTitle>Child Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>Full Name</Label>
              <Input
                value={child.fullName}
                onChange={(e) =>
                  handleChildChange(index, "fullName", e.target.value)
                }
              />
            </div>

            <div>
              <Label>Relationship</Label>
              <Select
                value={child.relationship}
                onValueChange={(v) =>
                  handleChildChange(index, "relationship", v)
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FATHER">Father</SelectItem>
                  <SelectItem value="MOTHER">Mother</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {child.relationship === "OTHER" && (
              <div>
                <Label>Upload Document for Other</Label>
                <Input
                  type="file"
                  onChange={(e) =>
                    handleChildChange(index, "otherFile", e.target.files?.[0] || null)
                  }
                />
              </div>
            )}

            <div>
              <Label>Gender</Label>
              <Select
                value={child.gender}
                onValueChange={(v) => handleChildChange(index, "gender", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={child.dateOfBirth}
                onChange={(e) =>
                  handleChildChange(index, "dateOfBirth", e.target.value)
                }
              />
            </div>

            <div>
              <Label>Site</Label>
              <Select
                value={child.site}
                onValueChange={(v) => handleChildChange(index, "site", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSA">INSA</SelectItem>
                  <SelectItem value="OPERATION">Operation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Organization</Label>
              <Select
                value={child.organization}
                onValueChange={(v) => handleChildChange(index, "organization", v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSA">INSA</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                  <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Profile Picture Upload</Label>
              <Input
                type="file"
                onChange={(e) =>
                  handleChildChange(index, "profilePic", e.target.files?.[0] || null)
                }
              />
            </div>

            <div>
              <Label>Child Info File Upload</Label>
              <Input
                type="file"
                onChange={(e) =>
                  handleChildChange(index, "childInfoFile", e.target.files?.[0] || null)
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubmitChild(child)}
              className="w-full md:w-auto"
            >
              ✅ Register This Child
            </Button>
          </CardFooter>
        </Card>
      ))}

      <Separator />

      {/* Registered Children Table */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>📋 Registered Children</CardTitle>
          <CardDescription>All registered children appear below.</CardDescription>
        </CardHeader>
        <CardContent>
          {childrenList.length === 0 ? (
            <p className="text-muted-foreground">No children registered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>DOB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {childrenList.map((child) => (
                  <TableRow key={child.id}>
                    <TableCell>{child.id}</TableCell>
                    <TableCell>{child.fullName}</TableCell>
                    <TableCell>{child.parentName}</TableCell>
                    <TableCell>{child.gender}</TableCell>
                    <TableCell>{child.relationship}</TableCell>
                    <TableCell>{child.site}</TableCell>
                    <TableCell>{child.organization}</TableCell>
                    <TableCell>{new Date(child.dateOfBirth).toLocaleDateString()}</TableCell>
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
