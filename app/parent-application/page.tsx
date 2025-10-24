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
import { Calendar, User, Baby, Building, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

type FormData = {
  childName: string;
  childAge: number;
  dateOfBirth: string;
  parentName: string;
  address: string;
  phone: string;
  email: string;
  preferredStartDate: string;
  careNeeded: string;
  notes: string;
};

export default function ParentApplicationPage() {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setMessage("");
    setIsLoading(true);

    try {
      const payload = {
        childName: data.childName.trim(),
        childAge: data.childAge,
        dateOfBirth: data.dateOfBirth,
        parentName: data.parentName.trim(),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        preferredStartDate: data.preferredStartDate,
        careNeeded: data.careNeeded.trim(),
        notes: data.notes.trim()
      };

      const res = await fetch("/api/enrollment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage(result.error || "Application submission failed");
      } else {
        setMessage("Application submitted successfully! We will review it and contact you soon. If approved, the admin will register your child for you.");
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
              {/* Child Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  Child Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Parent/Guardian Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                  <Input
                    id="parentName"
                    type="text"
                    placeholder="Enter your full name"
                    {...register("parentName", { required: "Parent name is required" })}
                  />
                  {errors.parentName && <p className="text-sm text-red-600">{errors.parentName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    rows={3}
                    {...register("address", { required: "Address is required" })}
                  />
                  {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>


              {/* Care Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Care Requirements
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="preferredStartDate">Preferred Start Date *</Label>
                  <Input
                    id="preferredStartDate"
                    type="date"
                    {...register("preferredStartDate", { required: "Preferred start date is required" })}
                  />
                  {errors.preferredStartDate && <p className="text-sm text-red-600">{errors.preferredStartDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careNeeded">Days/Hours of Care Needed *</Label>
                  <Input
                    id="careNeeded"
                    type="text"
                    placeholder="e.g., Monday–Friday, 8 AM–4 PM"
                    {...register("careNeeded", { required: "Care schedule is required" })}
                  />
                  {errors.careNeeded && <p className="text-sm text-red-600">{errors.careNeeded.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Information</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements, medical conditions, or additional information..."
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

              <div className="flex gap-4">
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

