"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Baby, FileText, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type ChildEntry = { childName: string; childAge: number | "" };

type FormData = {
  parentName: string;
  email: string;
  phone: string;
  organization?: string;
  site?: string;
  notes?: string;
  parentGender?: string;
};

export default function RequestPage() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const [children, setChildren] = useState<ChildEntry[]>([
    { childName: "", childAge: "" },
  ]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [orgSelectValue, setOrgSelectValue] = useState<string>("ALL");
  const [siteSelectValue, setSiteSelectValue] = useState<string>("ALL");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me", {
          credentials: "include" as RequestCredentials,
        });
        if (!res.ok) return;
        const user = await res.json();
        if (user?.name) setValue("parentName", user.name);
        if (user?.email) setValue("email", user.email);
        if (user?.phoneNumber) setValue("phone", user.phoneNumber);
        if (user?.gender) setValue("parentGender", user.gender);
      } catch {}
    })();
    (async () => {
      try {
        const [orgRes, siteRes] = await Promise.all([
          fetch("/api/organization"),
          fetch("/api/sites"),
        ]);
        if (orgRes.ok) {
          const data = await orgRes.json();
          setOrganizations(Array.isArray(data) ? data : []);
        }
        if (siteRes.ok) {
          const data = await siteRes.json();
          setSites(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to load organizations/sites:", e);
      }
    })();
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    setMessage("");
    setIsLoading(true);

    try {
      // Validate children
      for (const [idx, c] of children.entries()) {
        if (!c.childName || c.childName.trim().length === 0) {
          setMessage(`Child #${idx + 1}: name is required`);
          setIsLoading(false);
          return;
        }
        if (c.childAge === "" || Number(c.childAge) <= 0) {
          setMessage(`Child #${idx + 1}: valid age is required`);
          setIsLoading(false);
          return;
        }
      }

      // Submit a single request aggregating children
      const childrenLines = children
        .map(
          (c, i) =>
            `- Child ${i + 1}: ${c.childName.trim()} (Age: ${Number(
              c.childAge
            )})`
        )
        .join("\n");

      const payload = {
        childName: children[0].childName.trim(), // primary child for title
        childAge: Number(children[0].childAge),
        parentName: (data.parentName || "").trim(),
        email: (data.email || "").trim().toLowerCase(),
        phone: (data.phone || "").trim(),
        notes: `${(data.notes || "").trim()}${
          data.notes ? "\n\n" : ""
        }Organization: ${data.organization || "N/A"}\nSite: ${
          data.site || "N/A"
        }\nParent Gender: ${
          data.parentGender || "N/A"
        }\n\nChildren:\n${childrenLines}`,
      } as any;

      const res = await fetch("/api/enrollment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(
          result?.message || result?.error || "Failed to submit application"
        );
      }

      setMessage(
        "Application(s) submitted successfully! We will review it and contact you soon."
      );
      setIsSubmitted(true);
      setTimeout(() => {
        router.push("/parent-dashboard");
      }, 2500);
    } catch (error) {
      console.error("Application error:", error);
      setMessage(
        "An error occurred while submitting your application. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Application Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Your daycare application has been submitted successfully. We will
              review it and contact you soon with further information.
            </p>
            <Button onClick={() => router.push("/parent-dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Daycare Application
        </h1>
        <p className="text-gray-600">
          Apply to enroll your child in our daycare system
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            New Child Enrollment Request
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Parent Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Parent Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent's Full Name *</Label>
                  <Input
                    id="parentName"
                    type="text"
                    placeholder="Enter parent's full name"
                    {...register("parentName", {
                      required: "Parent's name is required",
                    })}
                  />
                  {errors.parentName && (
                    <p className="text-sm text-red-600">
                      {errors.parentName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  {...register("phone", {
                    required: "Phone number is required",
                  })}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select
                    value={orgSelectValue}
                    onValueChange={(v) => {
                      setOrgSelectValue(v);
                      setValue("organization", v === "ALL" ? "" : v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"ALL"}>Select organization</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.name}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Select
                    value={siteSelectValue}
                    onValueChange={(v) => {
                      setSiteSelectValue(v);
                      setValue("site", v === "ALL" ? "" : v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"ALL"}>Select site</SelectItem>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentGender">Parent Gender</Label>
                  <select
                    id="parentGender"
                    className="w-full rounded-md border px-3 py-2"
                    {...register("parentGender")}
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Children Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Baby className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Children Information
                </h3>
              </div>
              {children.map((c, idx) => (
                <div key={idx} className="rounded-md border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">
                      Child #{idx + 1}
                    </h4>
                    {children.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setChildren((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Child's Full Name *</Label>
                      <Input
                        value={c.childName}
                        onChange={(e) =>
                          setChildren((prev) =>
                            prev.map((it, i) =>
                              i === idx
                                ? { ...it, childName: e.target.value }
                                : it
                            )
                          )
                        }
                        placeholder="Enter child's full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Child's Age *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={c.childAge}
                        onChange={(e) =>
                          setChildren((prev) =>
                            prev.map((it, i) =>
                              i === idx
                                ? {
                                    ...it,
                                    childAge:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  }
                                : it
                            )
                          )
                        }
                        placeholder="Enter age"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setChildren((prev) => [
                      ...prev,
                      { childName: "", childAge: "" },
                    ])
                  }
                >
                  + Add another child
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Description
                </h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Description</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information that can help us"
                  rows={4}
                  {...register("notes")}
                />
              </div>
            </div>

            {message && (
              <Alert
                className={
                  message.includes("successfully")
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }
              >
                <AlertDescription
                  className={
                    message.includes("successfully")
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/parent-dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
