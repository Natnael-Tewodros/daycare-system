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
      const payload = {
        email: (data.email || "").trim(), // can be email or username
        password: (data.password || "").trim(),
      };
      
      // First try admin login
      console.log('Sending login request with payload:', payload);
      
      const adminRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let adminResult: any = {};
      try {
        const contentType = adminRes.headers.get('content-type');
        console.log('Admin login response status:', adminRes.status);
        console.log('Admin login response content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          adminResult = await adminRes.json();
          console.log('Admin login result:', adminResult);
        } else {
          const textResponse = await adminRes.text();
          console.log('Admin login text response:', textResponse);
          adminResult = { error: textResponse || 'Invalid response format' };
        }
      } catch (parseError) {
        console.error('Error parsing admin response:', parseError);
        adminResult = { error: 'Failed to parse response' };
      }

      if (adminRes.ok && typeof adminResult === 'object' && adminResult?.user?.id) {
        // Login successful
        setMessage(`Welcome back!`);
        localStorage.setItem('userId', String(adminResult.user.id));
        localStorage.setItem('userRole', adminResult.user.role);
        
        // Store parent info for parent dashboard
        if (adminResult.user.role === 'PARENT') {
          localStorage.setItem('parentInfo', JSON.stringify({
            name: adminResult.user.name,
            email: adminResult.user.email,
            children: adminResult.children || [] // Children fetched from login API
          }));
        }
        
        // Redirect based on role
        if (adminResult.user.role === 'ADMIN') {
          router.push("/dashboard");
        } else if (adminResult.user.role === 'PARENT') {
          router.push("/parent-dashboard");
        } else {
          router.push("/dashboard"); // fallback
        }
        return;
      }

      // If admin login failed, try parent login using the parent-login API logic
      let parentResult: any = {};
      try {
        const parentRes = await fetch("/api/auth/parent-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        try {
          const contentType = parentRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            parentResult = await parentRes.json();
          } else {
            const textResponse = await parentRes.text();
            parentResult = { error: textResponse || 'Invalid response format' };
          }
        } catch (parseError) {
          console.error('Error parsing parent response:', parseError);
          parentResult = { error: 'Failed to parse response' };
        }

        if (parentRes.ok && parentResult.success) {
          // Parent login successful
          setMessage(`Welcome back!`);
          localStorage.setItem('parentInfo', JSON.stringify(parentResult.parent));
          router.push("/parent-dashboard");
          return;
        }
      } catch (parentError) {
        console.error('Parent login error:', parentError);
        parentResult = { error: 'Network error' };
      }

      // Both logins failed - provide specific error messages
      let errorMsg = "Invalid credentials";
      
      if (adminResult?.error && parentResult?.error) {
        errorMsg = "Invalid email or password. Please check your credentials and try again.";
      } else if (adminResult?.error) {
        errorMsg = "Admin login failed. Please check your email and password.";
      } else if (parentResult?.error) {
        errorMsg = "Parent login failed. Please check your email and password.";
      }
      
      // Log the actual error details for debugging
      console.error('Login failed - Admin result:', adminResult);
      console.error('Login failed - Parent result:', parentResult);
      console.error('Admin response status:', adminRes.status);
      console.error('Admin response ok:', adminRes.ok);
      setMessage(errorMsg);
    } catch (error) {
      console.error('Login error:', error);
      setMessage("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
          <CardDescription className="text-gray-600">Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
                placeholder="Enter your password" 
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required 
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Sign In
            </Button>
          </form>
          {message && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 text-center">{message}</p>
            </div>
          )}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up here
              </Link>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              For parent access, contact the daycare administration to register your child.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
