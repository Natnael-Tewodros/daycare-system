"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";

type FormData = { name: string; email: string; password: string };

export default function SignupPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const [message, setMessage] = useState("");

  const onSubmit = async (data: FormData) => {
    setMessage("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) setMessage(result.error || "Something went wrong");
      else setMessage(`User ${result.name} created successfully!`);
    } catch {
      setMessage("Network error, try again");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label>Name</Label>
              <Input {...register("name")} placeholder="Your full name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="you@example.com" required />
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
