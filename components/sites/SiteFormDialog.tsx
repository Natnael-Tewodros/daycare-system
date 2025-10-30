"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: {
    id?: number;
    name?: string;
    description?: string;
    website?: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null;
  onSuccess: () => void;
};

export default function SiteFormDialog({ open, onOpenChange, mode, initial, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    website: initial?.website || '',
    address: initial?.address || '',
    phone: initial?.phone || '',
    email: initial?.email || ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      if (mode === 'edit' && initial?.id) data.append('id', String(initial.id));
      data.append('name', formData.name);
      if (formData.description) data.append('description', formData.description);
      if (formData.website) data.append('website', formData.website);
      if (formData.address) data.append('address', formData.address);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.email) data.append('email', formData.email);
      if (logoFile) data.append('logo', logoFile);

      const endpoint = mode === 'create' ? '/api/sites' : '/api/sites';
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(endpoint, { method, body: data });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to save site');
        return;
      }
      onOpenChange(false);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">{mode === 'create' ? 'Create Site' : 'Edit Site'}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === 'create' ? 'Add a new site to the daycare system.' : 'Update site information.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Site Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter site name" required className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo" className="text-sm font-semibold text-gray-700">Site Logo</Label>
            <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            {logoPreview && (
              <div className="mt-3 p-3 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img src={logoPreview} alt="Preview" width={120} height={120} className="rounded-lg object-cover border" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-semibold text-gray-700">Website</Label>
            <Input id="website" type="url" value={formData.website} onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))} placeholder="https://example.com" className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1234567890" className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="site@example.com" className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address</Label>
            <Input id="address" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Enter site address" className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-6">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="px-6 bg-blue-600 hover:bg-blue-700">{isSubmitting ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Site' : 'Update Site')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


