"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Building, Users, Calendar, Plus, Edit, Trash2, Globe, MapPin, Phone, Mail, UserCircle } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  logo?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  children?: any[];
  rooms?: any[];
  childrenCount?: number;
  servantsCount?: number;
  servants?: Array<{
    id: number;
    fullName: string;
    email?: string;
    phone?: string;
  }>;
}

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    address: '',
    phone: '',
    email: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData({
      name: '',
      website: '',
      address: '',
      phone: '',
      email: ''
    });
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
    setShowCreateDialog(true);
  };

  const openEditDialog = (org: Organization) => {
    setFormData({
      name: org.name,
      website: org.website || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || ''
    });
    setLogoFile(null);
    setLogoPreview(org.logo || null);
    setSelectedOrg(org);
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
      if (formData.website) data.append('website', formData.website);
      if (formData.address) data.append('address', formData.address);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.email) data.append('email', formData.email);
      if (logoFile) data.append('logo', logoFile);

      const response = await axios.post('/api/organization', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.status === 201) {
        setShowCreateDialog(false);
        setFormData({ name: '', website: '', address: '', phone: '', email: '' });
        setLogoFile(null);
        setLogoPreview(null);
        setErrors({});
        fetchOrgs();
        alert('Organization created successfully!');
      }
    } catch (error: any) {
      console.error('Error creating organization:', error);
      alert(error.response?.data?.error || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedOrg) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.website) data.append('website', formData.website);
      if (formData.address) data.append('address', formData.address);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.email) data.append('email', formData.email);
      if (logoFile) data.append('logo', logoFile);

      const response = await axios.put(`/api/organization/${selectedOrg.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.status === 200) {
        setShowEditDialog(false);
        setSelectedOrg(null);
        setFormData({ name: '', website: '', address: '', phone: '', email: '' });
        setLogoFile(null);
        setLogoPreview(null);
        setErrors({});
        fetchOrgs();
        alert('Organization updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating organization:', error);
      alert(error.response?.data?.error || 'Failed to update organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/organization/${org.id}`);
      if (response.status === 200) {
        fetchOrgs();
        alert('Organization deleted successfully!');
      }
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      alert(error.response?.data?.error || 'Failed to delete organization');
    }
  };

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
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Organizations</h1>
            <p className="text-lg text-gray-600 mb-4">Manage partner organizations in the daycare system</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>{orgs.length} Total Organizations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>{orgs.reduce((sum, org) => sum + (org.childrenCount || org.children?.length || 0), 0)} Children Enrolled</span>
              </div>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="mr-2 h-5 w-5" /> Add Organization
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">Create Organization</DialogTitle>
              <DialogDescription className="text-gray-600">
                Add a new organization to the daycare system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo" className="text-sm font-semibold text-gray-700">Organization Logo</Label>
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
                    placeholder="org@example.com"
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
                  placeholder="Enter organization address"
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="px-6">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-6 bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? 'Creating...' : 'Create Organization'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org: Organization) => (
          <Card key={org.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-gray-100 shadow-sm">
                  {org.logo ? (
                    <img
                      src={org.logo.startsWith('/') ? org.logo : `/${org.logo}`}
                      alt={`${org.name} logo`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
                        }
                      }}
                    />
                  ) : (
                    <Building className="h-10 w-10 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-1 truncate">{org.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(org)}
                    className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(org)}
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
                    <div className="text-xl font-bold text-blue-900">{org.childrenCount || org.children?.length || 0}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <UserCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Caregivers</span>
                    </div>
                    <div className="text-xl font-bold text-green-900">{org.servantsCount || 0}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Rooms</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{org.rooms?.length || 0}</div>
                </div>

                {/* Contact Information */}
                {(org.phone || org.email || org.website || org.address) && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      {org.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="h-3 w-3 text-blue-600" />
                          </div>
                          <a href={`tel:${org.phone}`} className="text-blue-600 hover:text-blue-800 transition-colors">{org.phone}</a>
                        </div>
                      )}
                      {org.email && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <Mail className="h-3 w-3 text-green-600" />
                          </div>
                          <a href={`mailto:${org.email}`} className="text-green-600 hover:text-green-800 transition-colors truncate">{org.email}</a>
                        </div>
                      )}
                      {org.website && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Globe className="h-3 w-3 text-purple-600" />
                          </div>
                          <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 transition-colors truncate">{org.website}</a>
                        </div>
                      )}
                      {org.address && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                            <MapPin className="h-3 w-3 text-orange-600" />
                          </div>
                          <span className="text-gray-600 truncate">{org.address}</span>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Organization</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update organization information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700">Organization Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter organization name"
                required
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-logo" className="text-sm font-semibold text-gray-700">Organization Logo</Label>
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
                  placeholder="org@example.com"
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
                placeholder="Enter organization address"
                className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="px-6">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-6 bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Updating...' : 'Update Organization'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
