"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Calendar, Plus, Save, RefreshCw } from "lucide-react";

type Observation = {
  id: number;
  observationDate: string;
  activities: string[];
  engagementLevel?: string | null;
  skillNotes?: string | null;
  mood?: string | null;
  cooperation?: string | null;
  socialNotes?: string | null;
  healthStatus?: string | null;
  hygieneNotes?: string | null;
  energyLevel?: string | null;
  eatingHabits?: string | null;
  breakfastStatus?: string | null;
  lunchStatus?: string | null;
  snackStatus?: string | null;
  napStartTime?: string | null;
  napDuration?: number | null;
  sleepQuality?: string | null;
  teacherNotes?: string | null;
};

export default function ChildObservationsPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [child, setChild] = useState<{ id: number; fullName: string } | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);

  // Form state
  const [observationDate, setObservationDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [activitiesText, setActivitiesText] = useState<string>("");
  const [engagementLevel, setEngagementLevel] = useState<string>("");
  const [skillNotes, setSkillNotes] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [cooperation, setCooperation] = useState<string>("");
  const [socialNotes, setSocialNotes] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [hygieneNotes, setHygieneNotes] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<string>("");
  const [eatingHabits, setEatingHabits] = useState<string>("");
  const [breakfastStatus, setBreakfastStatus] = useState<string>("");
  const [lunchStatus, setLunchStatus] = useState<string>("");
  const [snackStatus, setSnackStatus] = useState<string>("");
  const [napStartTime, setNapStartTime] = useState<string>("");
  const [napDuration, setNapDuration] = useState<string>("");
  const [sleepQuality, setSleepQuality] = useState<string>("");
  const [teacherNotes, setTeacherNotes] = useState<string>("");

  const activitiesArray = useMemo(() => {
    return activitiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activitiesText]);

  useEffect(() => {
    if (!childId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [childRes, obsRes] = await Promise.all([
          fetch(`/api/children/${childId}`),
          fetch(`/api/daily-observations?childId=${childId}`),
        ]);
        if (childRes.ok) setChild(await childRes.json());
        const obs = obsRes.ok ? await obsRes.json() : [];
        setObservations(obs);
      } catch (e: any) {
        setError(e?.message || "Failed to load observations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId]);

  const resetForm = () => {
    setObservationDate(new Date().toISOString().split("T")[0]);
    setActivitiesText("");
    setEngagementLevel("");
    setSkillNotes("");
    setMood("");
    setCooperation("");
    setSocialNotes("");
    setHealthStatus("");
    setHygieneNotes("");
    setEnergyLevel("");
    setEatingHabits("");
    setBreakfastStatus("");
    setLunchStatus("");
    setSnackStatus("");
    setNapStartTime("");
    setNapDuration("");
    setSleepQuality("");
    setTeacherNotes("");
  };

  const saveObservation = async () => {
    if (!childId) return;
    try {
      setSaving(true);
      setError(null);
      const payload = {
        childId: Number(childId),
        observationDate,
        activities: activitiesArray,
        engagementLevel: engagementLevel || null,
        skillNotes: skillNotes || null,
        mood: mood || null,
        cooperation: cooperation || null,
        socialNotes: socialNotes || null,
        healthStatus: healthStatus || null,
        hygieneNotes: hygieneNotes || null,
        energyLevel: energyLevel || null,
        eatingHabits: eatingHabits || null,
        breakfastStatus: breakfastStatus || null,
        lunchStatus: lunchStatus || null,
        snackStatus: snackStatus || null,
        napStartTime: napStartTime ? new Date(`${observationDate}T${napStartTime}:00`).toISOString() : null,
        napDuration: napDuration ? Number(napDuration) : null,
        sleepQuality: sleepQuality || null,
        teacherNotes: teacherNotes || null,
      };
      const res = await fetch("/api/daily-observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to save observation");
      const created = await res.json();
      setObservations((prev) => [created, ...prev]);
      resetForm();
    } catch (e: any) {
      setError(e?.message || "Failed to save observation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Observations</h1>
          <p className="text-gray-600">{child?.fullName ? `Record daily inputs for ${child.fullName}` : "Record daily inputs"}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3">{error}</div>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Add Observation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <Input type="date" value={observationDate} onChange={(e) => setObservationDate(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Activities (comma separated)</label>
                <Input placeholder="Circle time, Art, Outdoor play" value={activitiesText} onChange={(e) => setActivitiesText(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Engagement Level</label>
                <Select value={engagementLevel} onValueChange={setEngagementLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mood</label>
                <Input placeholder="Happy, Calm, Energetic" value={mood} onChange={(e) => setMood(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Cooperation</label>
                <Select value={cooperation} onValueChange={setCooperation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="needs_reminders">Needs Reminders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-3">
                <label className="text-sm font-medium mb-2 block">Skill Notes</label>
                <Textarea rows={2} placeholder="E.g., Counted to 12; improved pincer grasp" value={skillNotes} onChange={(e) => setSkillNotes(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Health Status</label>
                <Input placeholder="Healthy, Mild sniffles" value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Hygiene Notes</label>
                <Input placeholder="Independent handwashing" value={hygieneNotes} onChange={(e) => setHygieneNotes(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Energy Level</label>
                <Select value={energyLevel} onValueChange={setEnergyLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Eating Habits</label>
                <Select value={eatingHabits} onValueChange={setEatingHabits}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Breakfast</label>
                <Select value={breakfastStatus} onValueChange={setBreakfastStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eaten">Eaten</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Lunch</label>
                <Select value={lunchStatus} onValueChange={setLunchStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eaten">Eaten</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Snack</label>
                <Select value={snackStatus} onValueChange={setSnackStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eaten">Eaten</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nap Start</label>
                <Input type="time" value={napStartTime} onChange={(e) => setNapStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nap Duration (minutes)</label>
                <Input type="number" min={0} value={napDuration} onChange={(e) => setNapDuration(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sleep Quality</label>
                <Select value={sleepQuality} onValueChange={setSleepQuality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restful">Restful</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="troubled">Troubled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Teacher Notes</label>
                <Textarea rows={2} placeholder="Any additional notes" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveObservation} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Observation
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Observations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-700" /> Recent Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {observations.length === 0 ? (
              <div className="text-gray-500">No observations yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Activities</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Engagement</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mood</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Meals</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sleep</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {observations.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{new Date(o.observationDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{(o.activities || []).join(", ")}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{o.engagementLevel || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{o.mood || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{[o.breakfastStatus, o.lunchStatus, o.snackStatus].filter(Boolean).join(", ") || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{o.napDuration ? `${o.napDuration} min` : "—"} {o.sleepQuality ? `(${o.sleepQuality})` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
