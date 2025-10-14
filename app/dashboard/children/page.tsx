"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Child {
  id: number;
  idOneToMoney: string;
  fullName: string;
  parentName: string;
  option: string;
  relationship: string;
  officialDocument?: string | null;
  dateOfBirth: string;
  gender: string;
  profilePic?: string | null;
  childInformationDoc?: string | null;
  createdAt: string;
}

export default function ChildrenPage({ employeeId }: { employeeId?: string }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [showForm, setShowForm] = useState(false);
  // idOneToMoney is now auto-set based on the logged-in employee (passed as prop or from session/context)
  // For demo, you can hardcode it or fetch from auth; here assuming prop
  const [idOneToMoney] = useState(employeeId || "EMP-12345"); // Replace with actual employee ID logic
  const [fullName, setFullName] = useState("");
  const [parentName, setParentName] = useState("");
  const [option, setOption] = useState("");
  const [relationship, setRelationship] = useState("father");
  const [showOfficialDoc, setShowOfficialDoc] = useState(false);
  const [officialDocument, setOfficialDocument] = useState<File | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [childInformationDoc, setChildInformationDoc] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchChildren = async () => {
    const res = await fetch(`/api/children?employeeId=${idOneToMoney}`);
    if (res.ok) {
      const data = await res.json();
      setChildren(data);
    } else {
      console.error("Failed to fetch children:", res.status);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [idOneToMoney]);

  // Process data for charts
  const genderData = children.reduce((acc, child) => {
    acc[child.gender] = (acc[child.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const relationshipData = children.reduce((acc, child) => {
    acc[child.relationship] = (acc[child.relationship] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const optionData = children.reduce((acc, child) => {
    acc[child.option] = (acc[child.option] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Children Overview',
      },
    },
  };

  const genderChartData = {
    labels: Object.keys(genderData),
    datasets: [
      {
        label: 'Gender Distribution',
        data: Object.values(genderData),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const relationshipChartData = {
    labels: Object.keys(relationshipData),
    datasets: [
      {
        label: 'Relationship Distribution',
        data: Object.values(relationshipData),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const optionChartData = {
    labels: Object.keys(optionData),
    datasets: [
      {
        label: 'Children per Option',
        data: Object.values(optionData),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const handleRelationshipChange = (value: string) => {
    setRelationship(value);
    setShowOfficialDoc(value === "other");
    if (value !== "other") {
      setOfficialDocument(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !parentName || !option || !relationship || !dateOfBirth || !gender) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("idOneToMoney", idOneToMoney); // Auto-appended from employee ID
    formData.append("fullName", fullName);
    formData.append("parentName", parentName);
    formData.append("option", option);
    formData.append("relationship", relationship);
    formData.append("dateOfBirth", dateOfBirth);
    formData.append("gender", gender);
    if (officialDocument) formData.append("officialDocument", officialDocument);
    if (profilePic) formData.append("profilePic", profilePic);
    if (childInformationDoc) formData.append("childInformationDoc", childInformationDoc);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Child added successfully!");
        setFullName("");
        setParentName("");
        setOption("");
        setRelationship("father");
        setShowOfficialDoc(false);
        setOfficialDocument(null);
        setDateOfBirth("");
        setGender("male");
        setProfilePic(null);
        setChildInformationDoc(null);
        setShowForm(false); // Hide form after successful submission
        fetchChildren();
      } else {
        const errorData = await res.json();
        alert(`Failed to add child: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to add child due to network error");
    }
    setIsSubmitting(false);
  };

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>, file: File | null) => {
    setter(file);
  };

  const getFileDisplay = (filePath?: string | null) => {
    if (!filePath) return "-";
    return filePath.length > 20 ? `${filePath.substring(0, 20)}...` : filePath;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Child Registration</h1>
      {/* Optional: Show the employee ID for reference */}
      <p className="text-sm text-muted-foreground mb-4">Registering children for Employee ID: {idOneToMoney}</p>

      {/* Toggle Button for Form */}
      <Button onClick={() => setShowForm(!showForm)} className="mb-6">
        {showForm ? "Cancel" : "Add New Child"}
      </Button>

      {/* Add Child Form - Conditionally Rendered (no idOneToMoney input) */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent Name</Label>
                  <Input
                    id="parentName"
                    placeholder="Enter parent name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="option">Child Option</Label>
                  <Select value={option} onValueChange={setOption} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select child option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Child 1</SelectItem>
                      <SelectItem value="2">Child 2</SelectItem>
                      <SelectItem value="3">Child 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Relationship</Label>
                  <RadioGroup value={relationship} onValueChange={handleRelationshipChange} className="flex flex-col space-y-2" required>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="father" id="father" />
                      <Label htmlFor="father">Father</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mother" id="mother" />
                      <Label htmlFor="mother">Mother</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                  {showOfficialDoc && (
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="officialDocument">Upload Official Document for Identification</Label>
                      <Input
                        id="officialDocument"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(setOfficialDocument, e.target.files?.[0] || null)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="flex flex-col space-y-2" required>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="otherGender" />
                      <Label htmlFor="otherGender">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePic">Profile Picture</Label>
                  <Input
                    id="profilePic"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(setProfilePic, e.target.files?.[0] || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childInformationDoc">Child Information Document</Label>
                  <Input
                    id="childInformationDoc"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(setChildInformationDoc, e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Register Child"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Charts Section - Only show if there are children */}
      {children.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <Pie data={genderChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Gender Distribution' } } }} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Bar data={relationshipChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Relationship Distribution' } } }} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Bar data={optionChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: true, text: 'Children per Option' } } }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Children Table */}
      <Card>
        <CardContent className="pt-6">
          {children.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No children registered yet for this employee. Add one using the button above!</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[120px]">Employee ID</TableHead>
                    <TableHead className="w-[150px]">Full Name</TableHead>
                    <TableHead className="w-[150px]">Parent Name</TableHead>
                    <TableHead className="w-[100px]">Option</TableHead>
                    <TableHead className="w-[120px]">Relationship</TableHead>
                    <TableHead className="w-[120px]">Official Doc</TableHead>
                    <TableHead className="w-[100px]">DOB</TableHead>
                    <TableHead className="w-[80px]">Gender</TableHead>
                    <TableHead className="w-[120px]">Profile Pic</TableHead>
                    <TableHead className="w-[120px]">Info Doc</TableHead>
                    <TableHead className="w-[140px]">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {children.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell className="truncate" title={c.idOneToMoney}>{c.idOneToMoney}</TableCell>
                      <TableCell className="truncate" title={c.fullName}>{c.fullName}</TableCell>
                      <TableCell className="truncate" title={c.parentName}>{c.parentName}</TableCell>
                      <TableCell>{c.option}</TableCell>
                      <TableCell className="capitalize">{c.relationship}</TableCell>
                      <TableCell className="truncate" title={c.officialDocument || ""}>
                        {c.officialDocument ? getFileDisplay(c.officialDocument) : "-"}
                      </TableCell>
                      <TableCell>{new Date(c.dateOfBirth).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{c.gender}</TableCell>
                      <TableCell className="truncate" title={c.profilePic || ""}>
                        {c.profilePic ? getFileDisplay(c.profilePic) : "-"}
                      </TableCell>
                      <TableCell className="truncate" title={c.childInformationDoc || ""}>
                        {c.childInformationDoc ? getFileDisplay(c.childInformationDoc) : "-"}
                      </TableCell>
                      <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}