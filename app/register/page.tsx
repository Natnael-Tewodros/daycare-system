// app/register/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type FormValues = {
  // Organization
  orgName: string;

  // User (employee)
  userName: string;
  userEmail: string;
  userPassword: string;

  // Servant
  servantFullName: string;
  servantEmail?: string;
  servantPhone?: string;
  servantRelationship?: string;
  servantMedicalReport?: string;

  // Child
  childFullName: string;
  childParentName?: string;
  childOption?: string;
  childRelationship?: string;
  childDateOfBirth?: string;
  childGender?: string;
  childProfileImage?: string;
  childMedicalReport?: string;
};

export default function RegisterAllPage() {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setMessage(null);

    const payload = {
      organization: { name: values.orgName },
      user: { name: values.userName, email: values.userEmail, password: values.userPassword },
      servant: {
        fullName: values.servantFullName,
        email: values.servantEmail,
        phone: values.servantPhone,
        relationship: values.servantRelationship,
        medicalReport: values.servantMedicalReport ?? null,
      },
      child: {
        fullName: values.childFullName,
        parentName: values.childParentName,
        option: values.childOption,
        relationship: values.childRelationship,
        dateOfBirth: values.childDateOfBirth,
        gender: values.childGender,
        profileImage: values.childProfileImage ?? null,
        medicalReport: values.childMedicalReport ?? null,
      },
    };

    try {
      const res = await fetch("/api/registerAll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Registration failed");
      } else {
        setMessage("Successfully registered organization, user, servant and child.");
        reset();
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-6 bg-gray-50">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Register Organization · Employee · Servant · Child</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <section>
                <h3 className="text-lg font-medium mb-2">Organization</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>Organization Name</Label>
                    <Input {...register("orgName", { required: true })} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-2">Employee (User)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input {...register("userName", { required: true })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input {...register("userEmail", { required: true })} type="email" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input {...register("userPassword", { required: true })} type="password" />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-2">Servant (Caregiver)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Full name</Label>
                    <Input {...register("servantFullName", { required: true })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input {...register("servantEmail")} type="email" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input {...register("servantPhone")} />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input {...register("servantRelationship")} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Medical Report (URL or notes)</Label>
                    <Textarea {...register("servantMedicalReport")} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium mb-2">Child</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Full name</Label>
                    <Input {...register("childFullName", { required: true })} />
                  </div>
                  <div>
                    <Label>Parent name</Label>
                    <Input {...register("childParentName")} />
                  </div>
                  <div>
                    <Label>Option / KG</Label>
                    <Input {...register("childOption")} />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Input {...register("childRelationship")} />
                  </div>
                  <div>
                    <Label>Date of birth</Label>
                    <Input {...register("childDateOfBirth")} type="date" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Input {...register("childGender")} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Profile image (URL)</Label>
                    <Input {...register("childProfileImage")} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Medical report (URL or notes)</Label>
                    <Textarea {...register("childMedicalReport")} />
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-between">
                <div>
                  {message && <p className="text-sm text-red-600">{message}</p>}
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Registering..." : "Register All"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
