"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type FormData = { email: string; password: string };

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <Card className="w-full max-w-md shadow-2xl border-slate-200 bg-white/80 backdrop-blur-xl relative z-10">
        <CardHeader className="space-y-4 pb-6">
          <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
              <Image
                src="/Logo_of_Ethiopian_INSA.png"
                alt="INSA logo"
                width={64}
                height={64}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-slate-500 text-base">
              Sign in to manage your daycare account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email or Username</Label>
              <Input
                {...register("email")}
                id="email"
                type="text"
                placeholder="name@example.com or username"
                className="h-12 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                <Link href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 pr-12 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-800 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-200 transition-all duration-200 rounded-xl">
              Sign In
            </Button>
          </form>
          {message && (
            <div className={`mt-6 p-4 rounded-xl border ${message.includes("Welcome") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              <p className="text-sm font-medium text-center flex items-center justify-center gap-2">
                {message.includes("Welcome") && <Sparkles className="w-4 h-4" />}
                {message}
              </p>
            </div>
          )}
          <div className="mt-8 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-bold">
                Create account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
