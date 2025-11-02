"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ChildProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [child, setChild] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChild = async () => {
      try {
        const res = await fetch(`/api/children/${id}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setChild(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load child');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchChild();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!child) return <p className="p-6">Not found</p>;

  const profileImageUrl = child.profilePic ? `/uploads/${child.profilePic}` : "/placeholder-avatar.svg";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>{"<-"} Back</Button>

      <Card>
        <CardHeader>
          <CardTitle>Child Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 relative rounded-full overflow-hidden border">
              <Image src={profileImageUrl} alt="Profile" fill sizes="160px" className="object-cover" />
            </div>
            {child.childInfoFile && (
              <a className="mt-3 text-blue-600 hover:underline" href={`/uploads/${child.childInfoFile}`} target="_blank" rel="noreferrer">Download Document</a>
            )}
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><strong>Full Name:</strong> {child.fullName}</div>
            <div><strong>Parent:</strong> {child.parentName}</div>
            <div><strong>Gender:</strong> {child.gender}</div>
            <div><strong>Relationship:</strong> {child.relationship}</div>
            <div><strong>Site:</strong> {child.site}</div>
            <div><strong>Organization:</strong> {child.organization?.name || ''}</div>
            <div><strong>DOB:</strong> {new Date(child.dateOfBirth).toLocaleDateString()}</div>
            <div><strong>Registered:</strong> {new Date(child.createdAt).toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


