"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Organization = {
  id: number;
  name: string;
  rooms: {
    id: number;
    name: string;
    ageRange: string;
    children: { fullName: string }[];
    servants: { fullName: string }[];
  }[];
};

export default function OrganizationPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch("/api/organization");
        if (!res.ok) {
          throw new Error("Failed to fetch organizations");
        }
        const data = await res.json();
        setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  if (loading) {
    return <div>Loading organizations...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!organizations.length) {
    return <div>No organizations found</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Organization Overview</h1>

      {organizations.map((org) => (
        <Card key={org.id} className="border shadow-sm">
          <CardHeader>
            <CardTitle>{org.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>Number of Rooms:</strong> {org.rooms.length}
            </p>

            {org.rooms.map((room) => (
              <div key={room.id} className="border p-2 rounded">
                <p>
                  <strong>Room:</strong> {room.name} ({room.ageRange})
                </p>
                <p>
                  <strong>Children:</strong>{" "}
                  {room.children.length
                    ? room.children.map((c) => c.fullName).join(", ")
                    : "No children"}
                </p>
                <p>
                  <strong>Servants:</strong>{" "}
                  {room.servants.length
                    ? room.servants.map((s) => s.fullName).join(", ")
                    : "No servants"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
