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
  Plus,
  Trash2,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import Link from "next/link";

interface SiteData {
  id: number;
  name: string;
  description: string;
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
}

interface SitesData extends Array<SiteData> {}

interface SiteFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
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

  const handleInputChange = (field: keyof SiteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Site name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      website: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
    setShowCreateDialog(true);
  };

  const openEditDialog = (site: SiteData) => {
    setFormData({
      name: site.name,
      description: site.description || '',
      address: site.address || '',
      phone: site.phone || '',
      email: site.email || '',
      website: site.website || ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setSelectedSite(site);
    setErrors({});
    setShowEditDialog(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.description) data.append('description', formData.description);
      if (formData.website) data.append('website', formData.website);
      if (formData.address) data.append('address', formData.address);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.email) data.append('email', formData.email);
      if (logoFile) data.append('logo', logoFile);

      const response = await fetch('/api/sites', {
        method: 'POST',
        body: data
      });
      
      if (response.ok) {
        setShowCreateDialog(false);
        setFormData({ name: '', description: '', address: '', phone: '', email: '', website: '' });
        setLogoFile(null);
        setLogoPreview(null);
        setErrors({});
        fetchSites();
        alert('Site created successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create site');
      }
    } catch (error) {
      console.error('Error creating site:', error);
      alert('Failed to create site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedSite) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      data.append('id', selectedSite.id.toString());
      data.append('name', formData.name);
      if (formData.description) data.append('description', formData.description);
      if (formData.website) data.append('website', formData.website);
      if (formData.address) data.append('address', formData.address);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.email) data.append('email', formData.email);
      if (logoFile) data.append('logo', logoFile);

      const response = await fetch('/api/sites', {
        method: 'PUT',
        body: data
      });
      
      if (response.ok) {
        setShowEditDialog(false);
        setSelectedSite(null);
        setFormData({ name: '', description: '', address: '', phone: '', email: '', website: '' });
        setLogoFile(null);
        setLogoPreview(null);
        setErrors({});
        fetchSites();
        alert('Site updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update site');
      }
    } catch (error) {
      console.error('Error updating site:', error);
      alert('Failed to update site');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (site: SiteData) => {
    if (!confirm(`Are you sure you want to delete "${site.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/sites?id=${site.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchSites();
        alert('Site deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete site');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      alert('Failed to delete site');
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sites</h1>
          <p className="text-gray-600">Manage daycare sites</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sites...</p>
          </div>
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

  if (!sites || sites.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No sites found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Sites</h1>
            <p className="text-lg text-gray-600 mb-4">Manage daycare sites and locations</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>{sites.length} Total Sites</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{sites.reduce((sum, site) => sum + site.totalChildren, 0)} Children Enrolled</span>
              </div>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="mr-2 h-5 w-5" /> Add Site
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <Card key={site.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
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
                    <Building className="h-10 w-10 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-1 truncate">{site.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(site.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(site)}
                    className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(site)}
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Stats Section */}
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

                {/* Contact Information */}
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
        ))}
      </div>

      {/* Create Site Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Create Site</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a new site to the daycare system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Site Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter site name"
                required
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm font-semibold text-gray-700">Site Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {logoPreview && (
                <div className="mt-3 p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <img src={logoPreview} alt="Preview" width={120} height={120} className="rounded-lg object-cover border" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-semibold text-gray-700">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="site@example.com"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter site address"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-6 bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Creating...' : 'Create Site'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Site Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Site</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update site information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700">Site Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter site name"
                required
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-logo" className="text-sm font-semibold text-gray-700">Site Logo</Label>
              <Input
                id="edit-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {logoPreview && (
                <div className="mt-3 p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Preview:</p>
                  <img src={logoPreview} alt="Preview" width={120} height={120} className="rounded-lg object-cover border" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-website" className="text-sm font-semibold text-gray-700">Website</Label>
              <Input
                id="edit-website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-semibold text-gray-700">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-semibold text-gray-700">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="site@example.com"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address" className="text-sm font-semibold text-gray-700">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter site address"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-6 bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Updating...' : 'Update Site'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
