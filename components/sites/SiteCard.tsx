"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Building, Users, HeartHandshake, Edit, Trash2, Phone, Mail, Globe, MapPin } from "lucide-react";

export type SiteData = {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  totalChildren: number;
  totalServants: number;
  totalOrganizations: number;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  site: SiteData;
  onEdit: (site: SiteData) => void;
  onDelete: (site: SiteData) => void;
};

export default function SiteCard({ site, onEdit, onDelete }: Props) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-gray-100 shadow-sm">
            {site.logo ? (
              <img
                src={site.logo}
                alt={`${site.name} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<svg class="h-10 w-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
                  }
                }}
              />
            ) : (
              <Building className="h-10 w-10 text-gray-500" />)
            }
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold text-gray-900 mb-1 truncate">{site.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(site.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(site)} className="hover:bg-blue-50 hover:border-blue-200 transition-colors">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(site)} className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Children</span>
              </div>
              <div className="text-xl font-bold text-blue-900">{site.totalChildren}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <HeartHandshake className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Caregivers</span>
              </div>
              <div className="text-xl font-bold text-green-900">{site.totalServants}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Organizations</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">{site.totalOrganizations}</div>
          </div>

          {(site.phone || site.email || site.website || site.address) && (
            <div className="pt-3 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
              <div className="space-y-2">
                {site.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Phone className="h-3 w-3 text-blue-600" />
                    </div>
                    <a href={`tel:${site.phone}`} className="text-blue-600 hover:text-blue-800 transition-colors">{site.phone}</a>
                  </div>
                )}
                {site.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="h-3 w-3 text-green-600" />
                    </div>
                    <a href={`mailto:${site.email}`} className="text-green-600 hover:text-green-800 transition-colors truncate">{site.email}</a>
                  </div>
                )}
                {site.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <Globe className="h-3 w-3 text-purple-600" />
                    </div>
                    <a href={site.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 transition-colors truncate">{site.website}</a>
                  </div>
                )}
                {site.address && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-orange-600" />
                    </div>
                    <span className="text-gray-600 truncate">{site.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


