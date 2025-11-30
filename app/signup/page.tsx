"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, UserPlus } from "lucide-react";

type FormData = {
  id: string;
  name: string;
  username?: string;
  email: string;
  password: string;
  role: string;
  registrationType: string; // 'PERMANENT' | 'EVENT'
  eventType?: string; // only needed if registrationType === 'EVENT'
};

export default function SignupPage() {
  const { register, handleSubmit, setValue, watch } = useForm<FormData>();
  const [message, setMessage] = useState("");
  // Set default role to PARENT for regular users
  const [selectedRole, setSelectedRole] = useState("PARENT");
  const [registrationType, setRegistrationType] = useState('PERMANENT');
  const [eventType, setEventType] = useState('');

  const onSubmit = async (data: FormData) => {
    setMessage("");
    if (!registrationType) { setMessage("Please select a registration type."); return; }
    if (registrationType === 'EVENT' && !eventType) { setMessage("Please select an event type."); return; }
    try {
      const payload = {
        id: (data.id || '').trim(),
        name: (data.name || '').trim(),
        username: (data.username || '').trim() || undefined,
        email: (data.email || '').trim(),
        password: (data.password || '').trim(),
        role: selectedRole,
        registrationType,
        eventType: registrationType === 'EVENT' ? eventType : undefined
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
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden flex items-center justify-center p-4 py-12">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <Card className="w-full max-w-lg shadow-2xl border-slate-200 bg-white/80 backdrop-blur-xl relative z-10">
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
            <CardTitle className="text-3xl font-bold text-slate-900">Create Account</CardTitle>
            <CardDescription className="text-slate-500 text-base">
              Join our daycare community today
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id" className="text-sm font-semibold text-slate-700">
                  User ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("id")}
                  id="id"
                  placeholder="Unique ID"
                  className="h-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("name")}
                  id="name"
                  placeholder="Your full name"
                  className="h-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("username", { required: true })}
                id="username"
                placeholder="Choose a username (remember this for child registration)"
                className="h-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                required
              />
              <p className="text-xs text-indigo-600 font-medium bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex gap-2 items-start">
                <span className="mt-0.5">ℹ️</span>
                Important: You will need this username to register your child. Please save it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="name@example.com"
                className="h-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("password")}
                id="password"
                type="password"
                placeholder="Create a secure password"
                className="h-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registration type dropdown */}
              <div className="space-y-2">
                <Label htmlFor="registrationType" className="text-sm font-semibold text-slate-700">
                  Registration Type <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <select
                    id="registrationType"
                    className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all"
                    value={registrationType}
                    onChange={e => setRegistrationType(e.target.value)}
                    required
                  >
                    <option value="PERMANENT">Permanent</option>
                    <option value="EVENT">Event</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>

              {/* Event type dropdown */}
              {registrationType === 'EVENT' && (
                <div className="space-y-2">
                  <Label htmlFor="eventType" className="text-sm font-semibold text-slate-700">
                    Event Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <select
                      id="eventType"
                      className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all"
                      value={eventType}
                      onChange={e => setEventType(e.target.value)}
                      required
                    >
                      <option value="">Select event</option>
                      <option value="SUMMER_CAMP">Summer Camp</option>
                      <option value="WINTER_WORKSHOP">Winter Workshop</option>
                      <option value="OPEN_DAY">Open Day</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-200 transition-all duration-200 rounded-xl mt-2">
              <UserPlus className="w-4 h-4 mr-2" /> Create Account
            </Button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-xl border ${message.includes("successfully") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              <p className="text-sm font-medium text-center flex items-center justify-center gap-2">
                {message.includes("successfully") && <Sparkles className="w-4 h-4" />}
                {message}
              </p>
            </div>
          )}

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-bold">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
