"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { Building, Users, Calendar, Plus, Edit, Trash2 } from "lucide-react";

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
      return "/Finance.jpg"; 
    default:
      return null; // No default image, will show placeholder
  }
};

// Function to get organization color
const getOrganizationColor = (type: string) => {
  switch (type) {
    case "INSA":
      return "bg-green-100 text-green-800 border-green-200";
    case "AI":
      return "bg-green-100 text-green-800 border-green-200";
    case "MINISTRY_OF_PEACE":
      return "bg-green-100 text-green-800 border-green-200";
    case "FINANCE_SECURITY":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

interface Organization {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  children?: any[];
  rooms?: any[];
  childrenCount?: number;
}

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'INSA' as 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY'
  });
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Organization type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openCreateDialog = () => {
    setFormData({
      name: '',
      type: 'INSA' as 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY'
    });
    setErrors({});
    setShowCreateDialog(true);
  };

  const openEditDialog = (org: Organization) => {
    setFormData({
      name: org.name,
      type: org.type as 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY'
    });
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
      const response = await axios.post('/api/organization', formData);
      if (response.status === 201) {
        setShowCreateDialog(false);
        setFormData({ name: '', type: 'INSA' as 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY' });
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
      const response = await axios.put(`/api/organization/${selectedOrg.id}`, formData);
      if (response.status === 200) {
        setShowEditDialog(false);
        setSelectedOrg(null);
        setFormData({ name: '', type: 'INSA' as 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY' });
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
    <div className="p-4 space-y-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations</h1>
          <p className="text-gray-600">Partner organizations in the daycare system</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Add a new organization to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Organization Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSA">INSA</SelectItem>
                    <SelectItem value="AI">AI</SelectItem>
                    <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                    <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Organization'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org: Organization) => (
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
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(org)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(org)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Organization Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter organization name"
                required
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Organization Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSA">INSA</SelectItem>
                  <SelectItem value="AI">AI</SelectItem>
                  <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                  <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Organization'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
