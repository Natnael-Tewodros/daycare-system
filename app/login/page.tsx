"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormData = { email: string; password: string };

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const [message, setMessage] = useState("");
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error('Login failed:', result);
        setMessage(result.error || "Invalid credentials");
      } else {
        setMessage(`Welcome back!`);
        // Redirect to dashboard after successful login
        router.push("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input {...register("password")} type="password" placeholder="Enter password" required />
            </div>
            <Button type="submit" className="w-full mt-2">
              Login
            </Button>
          </form>
          {message && <p className="mt-4 text-center text-blue-500">{message}</p>}
          <div className="mt-6 text-center text-sm text-primary">
            Don't have an account?
            <Link href="/signup" className="ml-2 text-blue-400 underline hover:text-blue-900">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
