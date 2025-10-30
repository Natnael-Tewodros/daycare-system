"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SiteCard, { SiteData } from "@/components/sites/SiteCard";
import SiteFormDialog from "@/components/sites/SiteFormDialog";

interface SitesData extends Array<SiteData> {}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Name will be validated in dialog component; keep placeholder in case of future inline usage
    if (false) {
      newErrors.name = 'Site name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openCreateDialog = () => {
    setErrors({});
    setShowCreateDialog(true);
  };

  const openEditDialog = (site: SiteData) => {
    setSelectedSite(site);
    setErrors({});
    setShowEditDialog(true);
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
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="mr-2 h-5 w-5" /> Add Site
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <SiteCard key={site.id} site={site} onEdit={openEditDialog} onDelete={handleDelete} />
        ))}
      </div>

      <SiteFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} mode="create" onSuccess={fetchSites} />

      <SiteFormDialog open={showEditDialog} onOpenChange={setShowEditDialog} mode="edit" initial={selectedSite} onSuccess={() => { setSelectedSite(null); fetchSites(); }} />
    </div>
  );
}
