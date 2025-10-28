"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Baby, FileText, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type ChildEntry = { childName: string; childAge: number | "" };

type FormData = {
  parentFullName: string;
  email: string;
  phoneNumber: string;
  organization?: string;
  site?: string;
  description?: string;
};

export default function ParentApplicationPage() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();
  const [children, setChildren] = useState<ChildEntry[]>([{ childName: "", childAge: "" }]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' as RequestCredentials });
        if (!res.ok) return;
        const user = await res.json();
        if (user?.name) setValue('parentFullName', user.name);
        if (user?.email) setValue('email', user.email);
        if (user?.phoneNumber) setValue('phoneNumber', user.phoneNumber);
      } catch {}
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

      // Submit a single enrollment request aggregating children
      const childrenLines = children
        .map((c, i) => `- Child ${i + 1}: ${c.childName.trim()} (Age: ${Number(c.childAge)})`)
        .join('\n');

      const payload = {
        childName: children[0].childName.trim(),
        childAge: Number(children[0].childAge),
        parentName: (data.parentFullName || '').trim(),
        email: (data.email || '').trim().toLowerCase(),
        phone: (data.phoneNumber || '').trim(),
        notes: `${(data.description || '').trim()}${data.description ? '\n\n' : ''}Organization: ${data.organization || 'N/A'}\nSite: ${data.site || 'N/A'}\n\nChildren:\n${childrenLines}`,
      } as any;

      const res = await fetch("/api/enrollment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result?.message || result?.error || 'Failed to submit the application');
      }

      setMessage("Application submitted successfully! We will review and contact you soon.");
      setIsSubmitted(true);
      setTimeout(() => { router.push("/parent-dashboard"); }, 2500);
    } catch (error) {
      console.error('Application error:', error);
      setMessage("An error occurred while submitting your application. Please try again.");
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your daycare application has been submitted successfully. We will review it and contact you soon with further information.
            </p>
            <Button onClick={() => router.push("/parent-dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Application for Daycare Enrollment</CardTitle>
              <p className="text-gray-600 mt-2">Submit your application for daycare admission</p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Parent Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" /> Parent/Guardian Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="parentFullName">Parent Full Name *</Label>
                    <Input id="parentFullName" type="text" placeholder="Enter your full name" {...register("parentFullName", { required: "Parent full name is required" })} />
                    {errors.parentFullName && <p className="text-sm text-red-600">{errors.parentFullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" placeholder="Enter email address" {...register("email", { required: "Email is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" } })} />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input id="phoneNumber" type="tel" placeholder="Enter phone number" {...register("phoneNumber", { required: "Phone number is required" })} />
                  {errors.phoneNumber && <p className="text-sm text-red-600">{errors.phoneNumber.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" type="text" placeholder="Enter organization" {...register("organization")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site">Site</Label>
                    <Input id="site" type="text" placeholder="Enter site" {...register("site")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Any additional information that can help us" rows={4} {...register("description")} />
                </div>
              </div>
              {/* Children Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Baby className="h-5 w-5" /> Children Information
                </h3>
                {children.map((c, idx) => (
                  <div key={idx} className="rounded-md border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">Child #{idx + 1}</h4>
                      {children.length > 1 && (
                        <Button type="button" variant="outline" onClick={() => setChildren(prev => prev.filter((_, i) => i !== idx))}>Remove</Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Child's Full Name *</Label>
                        <Input value={c.childName} onChange={(e) => setChildren(prev => prev.map((it, i) => i === idx ? { ...it, childName: e.target.value } : it))} placeholder="Enter child's full name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Child's Age *</Label>
                        <Input type="number" min="1" max="18" value={c.childAge} onChange={(e) => setChildren(prev => prev.map((it, i) => i === idx ? { ...it, childAge: e.target.value === '' ? '' : Number(e.target.value) } : it))} placeholder="Enter age" />
                      </div>
                      
                    </div>
                  </div>
                ))}
                <div>
                  <Button type="button" variant="outline" onClick={() => setChildren(prev => [...prev, { childName: "", childAge: "" }])}>+ Add another child</Button>
                </div>
              </div>

              {message && (
                <Alert className={message.includes("successfully") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={message.includes("successfully") ? "text-green-800" : "text-red-800"}>
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
    </div>
  );
}

