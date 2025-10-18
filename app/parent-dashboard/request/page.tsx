"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, User, Baby, Building, FileText, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = {
  childName: string;
  childAge: number;
  gender: string;
  dateOfBirth: string;
  parentName: string;
  email: string;
  phone: string;
  organization: string;
  site: string;
  preferredStartDate: string;
  notes: string;
};

export default function RequestPage() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setMessage("");
    setIsLoading(true);

    try {
      const payload = {
        childName: data.childName.trim(),
        childAge: data.childAge,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        parentName: data.parentName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        organization: data.organization,
        site: data.site,
        preferredStartDate: data.preferredStartDate,
        notes: data.notes.trim()
      };

      const res = await fetch("/api/enrollment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.message || "Application submission failed");
      } else {
        setMessage("Application submitted successfully! We will review it and contact you soon.");
        setIsSubmitted(true);
        setTimeout(() => {
          router.push("/parent-dashboard");
        }, 3000);
      }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daycare Application</h1>
        <p className="text-gray-600">Apply to enroll your child in our daycare system</p>
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
            {/* Child Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Baby className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Child Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="childName">Child's Full Name *</Label>
                  <Input
                    id="childName"
                    type="text"
                    placeholder="Enter child's full name"
                    {...register("childName", { required: "Child's name is required" })}
                  />
                  {errors.childName && <p className="text-sm text-red-600">{errors.childName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childAge">Child's Age *</Label>
                  <Input
                    id="childAge"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Enter age"
                    {...register("childAge", { 
                      required: "Child's age is required",
                      min: { value: 1, message: "Age must be at least 1" },
                      max: { value: 12, message: "Age must be 12 or less" }
                    })}
                  />
                  {errors.childAge && <p className="text-sm text-red-600">{errors.childAge.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => setValue("gender", value)}>
                    <SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </SelectTrigger>
                  </Select>
                  {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth", { required: "Date of birth is required" })}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Parent Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent's Full Name *</Label>
                  <Input
                    id="parentName"
                    type="text"
                    placeholder="Enter parent's full name"
                    {...register("parentName", { required: "Parent's name is required" })}
                  />
                  {errors.parentName && <p className="text-sm text-red-600">{errors.parentName.message}</p>}
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
                        message: "Invalid email address"
                      }
                    })}
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  {...register("phone", { required: "Phone number is required" })}
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Organization and Site */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Organization & Site</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Select onValueChange={(value) => setValue("organization", value)}>
                    <SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSA">INSA</SelectItem>
                        <SelectItem value="AI">AI</SelectItem>
                        <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                        <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
                      </SelectContent>
                    </SelectTrigger>
                  </Select>
                  {errors.organization && <p className="text-sm text-red-600">{errors.organization.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site">Preferred Site *</Label>
                  <Select onValueChange={(value) => setValue("site", value)}>
                    <SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INSA">INSA Site</SelectItem>
                        <SelectItem value="OPERATION">Operation Site</SelectItem>
                      </SelectContent>
                    </SelectTrigger>
                  </Select>
                  {errors.site && <p className="text-sm text-red-600">{errors.site.message}</p>}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredStartDate">Preferred Start Date</Label>
                <Input
                  id="preferredStartDate"
                  type="date"
                  {...register("preferredStartDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information, special requirements, medical conditions, or other important details..."
                  rows={4}
                  {...register("notes")}
                />
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
  );
}

