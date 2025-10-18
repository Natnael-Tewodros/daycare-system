"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";

type FormData = { id: string; name: string; username?: string; email: string; password: string; role: string };

export default function SignupPage() {
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();
  const [message, setMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState("ADMIN");

  const onSubmit = async (data: FormData) => {
    setMessage("");
    try {
      const payload = {
        id: (data.id || '').trim(),
        name: (data.name || '').trim(),
        username: (data.username || '').trim() || undefined,
        email: (data.email || '').trim(),
        password: (data.password || '').trim(),
        role: selectedRole,
      };
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result: any = null;
      const contentType = res.headers.get('content-type') || '';
      try {
        result = contentType.includes('application/json') ? await res.json() : await res.text();
      } catch (_) {
        // ignore parse errors
      }

      if (!res.ok) {
        const errorMsg = typeof result === 'string' ? result : (result?.error || "Something went wrong");
        setMessage(errorMsg);
      } else {
        const createdName = typeof result === 'object' ? result.name : 'User';
        setMessage(`User ${createdName} created successfully! Redirecting to login...`);
        setTimeout(() => {
          window.location.href = "/login";
        }, 800);
      }
    } catch {
      setMessage("Network error, try again");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your account - Admin or Parent</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label>User ID</Label>
              <Input {...register("id")} placeholder="Choose your ID (letters, numbers, - or _)" required />
            </div>
            <div>
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Your full name" required />
            </div>
          <div>
            <Label>Username (optional)</Label>
            <Input {...register("username")} placeholder="Choose a username" />
          </div>
            <div>
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <Label>Account Type</Label>
              <Select value={selectedRole} onValueChange={(value) => {
                setSelectedRole(value);
                setValue("role", value);
              }}>
                <SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PARENT">Parent</SelectItem>
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>
            <div>
              <Label>Password</Label>
              <Input {...register("password")} type="password" placeholder="Enter password" required />
            </div>
            <Button type="submit" className="w-full mt-2">
              Sign Up
            </Button>
          </form>
          {message && <p className="mt-4 text-center text-red-500">{message}</p>}
          <div className="mt-6 text-center text-sm text-primary">
            Already have an account?
            <Link 
              href="/login" 
              className="ml-2 text-blue-400 underline hover:text-blue-900"
            >
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
