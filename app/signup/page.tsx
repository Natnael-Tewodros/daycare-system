"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";

type FormData = { id: string; name: string; username?: string; email: string; password: string; role: string };

export default function SignupPage() {
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();
  const [message, setMessage] = useState("");
  // Set default role to PARENT for regular users
  const [selectedRole, setSelectedRole] = useState("PARENT");

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
        const createdUser = typeof result === 'object' ? result : null;
        
        // Automatically log in the user after signup
        localStorage.setItem('userId', createdUser?.id || data.id);
        localStorage.setItem('userRole', 'PARENT'); // New signups are always PARENT
        localStorage.setItem('parentInfo', JSON.stringify({
          name: createdUser?.name || data.name,
          email: createdUser?.email || data.email,
          children: [] // Will be empty for new signups until they register children
        }));
        
        setMessage(`Account created successfully! Redirecting...`);
        setTimeout(() => {
          window.location.href = '/parent-dashboard';
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
          <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
          <CardDescription className="text-gray-600">Join our daycare community</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="id" className="text-sm font-medium text-gray-700">User ID</Label>
              <Input 
                {...register("id")} 
                id="id"
                placeholder="Choose your unique ID" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input 
                {...register("name")} 
                id="name"
                placeholder="Enter your full name" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username (Optional)</Label>
              <Input 
                {...register("username")} 
                id="username"
                placeholder="Choose a username" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
              <Input 
                {...register("email")} 
                id="email"
                type="email" 
                placeholder="Enter your email address" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input 
                {...register("password")} 
                id="password"
                type="password" 
                placeholder="Create a secure password" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required 
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Create Account
            </Button>
          </form>
          {message && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 text-center">{message}</p>
            </div>
          )}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
