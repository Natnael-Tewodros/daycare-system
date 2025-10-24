"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { 
  Building, 
  Users, 
  UserCog, 
  Home, 
  MapPin, 
  Calendar,
  TrendingUp,
  Activity,
  Eye,
  ArrowRight,
  Building2,
  HeartHandshake,
  GraduationCap,
  Settings,
  Edit,
  Plus
} from "lucide-react";
import Link from "next/link";

interface SiteData {
  name: string;
  description: string;
  servants: any[];
  totalChildren: number;
  totalServants: number;
  totalOrganizations: number;
  totalRooms: number;
}

interface SitesData {
  HeadOffice: SiteData;
  OPERATION: SiteData;
}

interface SiteSettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<SitesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sites");
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setSites(data);
      setError(null);
    } catch (err) {
      console.error("Fetch sites error:", err);
      setError("Failed to load sites data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const openSettingsDialog = (siteKey: string) => {
    setSelectedSite(siteKey);
    // Load existing settings for the site
    const siteData = sites?.[siteKey as keyof SitesData];
    setSiteSettings({
      name: siteData?.name || '',
      description: siteData?.description || '',
      address: '', // This would come from a settings API
      phone: '',
      email: ''
    });
    setShowSettingsDialog(true);
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here you would save settings to an API
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSettingsDialog(false);
      setSelectedSite(null);
      alert('Site settings updated successfully!');
    } catch (error) {
      console.error('Error updating site settings:', error);
      alert('Failed to update site settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof SiteSettings, value: string) => {
    setSiteSettings(prev => ({ ...prev, [field]: value }));
  };

  const getSiteIcon = (siteName: string) => {
    switch (siteName) {
      case 'HeadOffice':
        return Building;
      case 'OPERATION':
        return Activity;
      default:
        return Building2;
    }
  };

  const getSiteColor = (siteName: string) => {
    switch (siteName) {
      case 'HeadOffice':
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
          card: 'bg-gradient-to-br from-blue-50 to-blue-100',
          text: 'text-blue-600',
          border: 'border-blue-200'
        };
      case 'OPERATION':
        return {
          bg: 'bg-gradient-to-br from-green-500 to-green-600',
          card: 'bg-gradient-to-br from-green-50 to-green-100',
          text: 'text-green-600',
          border: 'border-green-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-500 to-gray-600',
          card: 'bg-gradient-to-br from-gray-50 to-gray-100',
          text: 'text-gray-600',
          border: 'border-gray-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg">{error}</p>
        <Button onClick={fetchSites} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!sites) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No sites data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Site Management
              </h1>
              <p className="text-lg text-muted-foreground">Manage and monitor HeadOffice and OPERATION sites</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800">
                {Object.keys(sites).length} Sites
              </Badge>
            </div>
          </div>
        </div>

        {/* Sites Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {Object.entries(sites).map(([siteKey, siteData]) => {
            const SiteIcon = getSiteIcon(siteKey);
            const colors = getSiteColor(siteKey);
            
            return (
              <Card key={siteKey} className={`${colors.card} shadow-xl border-0 overflow-hidden`}>
                <CardHeader className={`${colors.bg} text-white pb-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-full">
                        {siteKey === 'HeadOffice' ? (
                          <Image
                            src="/Logo_of_Ethiopian_INSA.png"
                            alt="HeadOffice Logo"
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        ) : (
                          <SiteIcon className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">{siteData.name}</CardTitle>
                        <p className="text-white/90 text-sm">{siteData.description}</p>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-0">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{siteData.totalChildren || 0}</div>
                      <div className="text-sm text-muted-foreground">Children</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center justify-center mb-2">
                        <HeartHandshake className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{siteData.totalServants || 0}</div>
                      <div className="text-sm text-muted-foreground">Caregivers</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center justify-center mb-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{siteData.totalOrganizations || 0}</div>
                      <div className="text-sm text-muted-foreground">Organizations</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center justify-center mb-2">
                        <Home className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold text-orange-600">{siteData.totalRooms || 0}</div>
                      <div className="text-sm text-muted-foreground">Rooms</div>
                    </div>
                  </div>


                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.location.href = `/dashboard/children?site=${siteKey}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Children
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.location.href = `/dashboard/caregiver?site=${siteKey}`}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      View Caregivers
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openSettingsDialog(siteKey)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Statistics */}
        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Site Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {Object.values(sites).reduce((sum, site) => sum + (site.totalChildren || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Children</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Object.values(sites).reduce((sum, site) => sum + (site.totalServants || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Caregivers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {Object.values(sites).reduce((sum, site) => sum + (site.totalOrganizations || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Organizations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {Object.values(sites).reduce((sum, site) => sum + (site.totalRooms || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Rooms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Site Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Site Settings</DialogTitle>
              <DialogDescription>
                Manage settings and information for {selectedSite} site.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={siteSettings.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter site name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Description</Label>
                <Input
                  id="site-description"
                  value={siteSettings.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter site description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-address">Address</Label>
                <Input
                  id="site-address"
                  value={siteSettings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter site address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-phone">Phone</Label>
                <Input
                  id="site-phone"
                  value={siteSettings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter site phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-email">Email</Label>
                <Input
                  id="site-email"
                  type="email"
                  value={siteSettings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter site email"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
