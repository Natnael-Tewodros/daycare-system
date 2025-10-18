"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Building, Users, Calendar } from "lucide-react";

// Function to get organization logo
const getOrganizationLogo = (type: string) => {
  switch (type) {
    case "INSA":
      return "/Logo_of_Ethiopian_INSA.png";
    case "AI":
      return "/Ai.png";
    case "MINISTRY_OF_PEACE":
      return "/peace.png";
    case "FINANCE_SECURITY":
      return null; // No image for Finance Security, will show placeholder
    default:
      return null; // No default image, will show placeholder
  }
};

// Function to get organization color
const getOrganizationColor = (type: string) => {
  switch (type) {
    case "INSA":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "AI":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "MINISTRY_OF_PEACE":
      return "bg-green-100 text-green-800 border-green-200";
    case "FINANCE_SECURITY":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/organization");
      setOrgs(res.data);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchOrgs(); 
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations</h1>
          <p className="text-gray-600">Partner organizations in the daycare system</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations</h1>
        <p className="text-gray-600">Partner organizations in the daycare system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org: any) => (
          <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {getOrganizationLogo(org.type) ? (
                    <Image
                      src={getOrganizationLogo(org.type)!}
                      alt={`${org.name} logo`}
                      width={64}
                      height={64}
                      className="object-contain"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <Badge 
                    variant="outline" 
                    className={`mt-1 ${getOrganizationColor(org.type)}`}
                  >
                    {org.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{org.childrenCount || org.children?.length || 0} children enrolled</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{org.rooms?.length || 0} rooms</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Building className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
