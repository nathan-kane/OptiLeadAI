"use client";

import type { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, Edit3, AlertTriangle, CheckCircle2, Info, Trash2, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AddLeadForm } from '@/components/add-lead-form';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckoutButton } from '@/components/stripe/CheckoutButton';

const getPriorityBadgeVariant = (priority: Lead['priority']) => {
  switch (priority) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'default'; // Using primary color for medium
    case 'Low':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusBadgeVariant = (contactStatus: Lead['contactStatus']) => {
  switch (contactStatus) {
    case 'New': return 'outline';
    case 'Contacted': return 'default';
    case 'Qualified': return 'default';
    case 'Nurturing': return 'secondary';
    case 'Converted': return 'default';
    case 'Rejected': return 'destructive';
    case 'Disqualified': return 'destructive';
    default: return 'outline';
  }
};

const getStatusColorClass = (contactStatus: Lead['contactStatus']) => {
  switch (contactStatus) {
    case 'Qualified': return 'bg-green-500 hover:bg-green-600';
    case 'Converted': return 'bg-blue-500 hover:bg-blue-600';
    default: return '';
  }
}

const DataValidationIcon = ({ status }: { status: Lead['dataValidationStatus']}) => {
  switch (status) {
    case 'Valid':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'Invalid':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'Unverified':
      return <Info className="h-4 w-4 text-yellow-500" />;
    default:
      return null;
  }
};


export default function DashboardPage() {
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckoutPrompt, setShowCheckoutPrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle successful payment redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      toast({
        title: "Payment Successful!",
        description: "Welcome to OptiLeadAI! Your subscription is now active.",
        variant: "default",
      });
      
      // Clean up URL
      router.replace('/dashboard');
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    // Wait for auth to complete and userId to be available
    if (authLoading) {
      return;
    }

    if (!userId) {
      console.log("DashboardPage: User is NOT authenticated.");
      setIsLoading(false);
      setLeads([]);
      return;
    }

    console.log("DashboardPage: User authenticated. Setting up Firestore listener for user:", userId);
    
    // Fetch leads from user-scoped collection: users/{userId}/leads
    const leadsQuery = query(
      collection(db, "users", userId, "leads"), 
      orderBy("createdAt", "desc")
    );
    
    const unsubscribeSnapshot = onSnapshot(leadsQuery, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      console.log("DashboardPage: Fetched", leadsData.length, "leads for user:", userId);
      setLeads(leadsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user leads:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Could not fetch leads from the database." 
      });
      setIsLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [userId, authLoading, toast]);


  const handleNotifySales = (lead: Lead) => {
    toast({
      title: "Sales Notified",
      description: `${lead.name} has been flagged for sales attention.`,
    });
  };

  const handleUpdateStatus = async (leadId: string, newContactStatus: Lead['contactStatus']) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the lead contact status in Firestore
      const leadRef = doc(db, "users", userId, "leads", leadId);
      await updateDoc(leadRef, {
        contactStatus: newContactStatus,
        lastInteraction: new Date().toISOString(),
        updatedAt: new Date()
      });

      // Update local state immediately for better UX
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, contactStatus: newContactStatus, lastInteraction: new Date().toISOString() }
            : lead
        )
      );

      toast({
        title: "Contact Status Updated",
        description: `Lead contact status successfully changed to ${newContactStatus}.`,
        variant: "default",
      });

      console.log(`Successfully updated lead ${leadId} contact status to ${newContactStatus}`);
    } catch (error) {
      console.error("Error updating lead contact status:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update lead contact status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete the lead from Firestore
      const leadRef = doc(db, "users", userId, "leads", leadId);
      await deleteDoc(leadRef);

      // Update local state immediately for better UX
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));

      toast({
        title: "Lead Deleted",
        description: `${leadName} has been successfully deleted.`,
        variant: "default",
      });

      console.log(`Successfully deleted lead ${leadId}`);
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Selection helper functions
  const handleSelectLead = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(leadId);
      } else {
        newSet.delete(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const isAllSelected = leads.length > 0 && selectedLeads.size === leads.length;
  const isIndeterminate = selectedLeads.size > 0 && selectedLeads.size < leads.length;

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (!userId || selectedLeads.size === 0) return;

    try {
      const deletePromises = Array.from(selectedLeads).map(leadId => {
        const leadRef = doc(db, "users", userId, "leads", leadId);
        return deleteDoc(leadRef);
      });

      await Promise.all(deletePromises);

      // Update local state
      setLeads(prevLeads => prevLeads.filter(lead => !selectedLeads.has(lead.id)));
      setSelectedLeads(new Set());

      toast({
        title: "Leads Deleted",
        description: `Successfully deleted ${selectedLeads.size} lead(s).`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete some leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: Lead['contactStatus']) => {
    if (!userId || selectedLeads.size === 0) return;

    try {
      const updatePromises = Array.from(selectedLeads).map(leadId => {
        const leadRef = doc(db, "users", userId, "leads", leadId);
        return updateDoc(leadRef, {
          contactStatus: newStatus,
          lastInteraction: new Date().toISOString(),
          updatedAt: new Date()
        });
      });

      await Promise.all(updatePromises);

      // Update local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          selectedLeads.has(lead.id) 
            ? { ...lead, contactStatus: newStatus, lastInteraction: new Date().toISOString() }
            : lead
        )
      );
      setSelectedLeads(new Set());

      toast({
        title: "Status Updated",
        description: `Successfully updated ${selectedLeads.size} lead(s) to ${newStatus}.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating leads:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update some leads. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <>
      <PageHeader
        title="Lead Prioritization Dashboard"
        description="Focus on your most promising leads, sorted by AI score."
        actions={<AddLeadForm />}
      />
      
      {/* Checkout Prompt Card */}
      {showCheckoutPrompt && selectedPlan && (
        <div className="mb-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                🎉 Welcome to OptiLeadAI!
              </CardTitle>
              <CardDescription className="text-blue-700">
                Complete your {selectedPlan === 'basic' ? 'Basic' : 'Gold'} plan subscription to start using all features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <CheckoutButton 
                  planType={selectedPlan as 'basic' | 'gold'}
                  size="lg"
                  className="flex-1"
                >
                  Complete {selectedPlan === 'basic' ? 'Basic' : 'Gold'} Plan Purchase
                </CheckoutButton>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCheckoutPrompt(false)}
                  className="flex-1 sm:flex-none"
                >
                  Skip for Now
                </Button>
              </div>
              <p className="text-sm text-blue-600">
                You can always upgrade later from your billing settings.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card>
        <CardHeader className="px-2 sm:px-6 py-4">
          <CardTitle className="text-lg sm:text-2xl">Active Leads</CardTitle>
          <CardDescription className="text-xs sm:text-base">
            {isLoading ? "Loading leads..." : `Showing ${leads.length} leads. Interact with them using the actions menu.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 py-2">
          {/* Bulk Actions Bar */}
          {selectedLeads.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedLeads.size} lead(s) selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('Contacted')}
                  className="text-xs"
                >
                  <Edit3 className="mr-1 h-3 w-3" /> Mark as Contacted
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('Qualified')}
                  className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Mark as Qualified
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('Nurturing')}
                  className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Info className="mr-1 h-3 w-3" /> Mark as Nurturing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('Converted')}
                  className="text-xs text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Check className="mr-1 h-3 w-3" /> Mark as Converted
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('Rejected')}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="mr-1 h-3 w-3" /> Mark as Rejected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('Disqualified')}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" /> Mark as Disqualified
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Delete Selected
                </Button>
              </div>
            </div>
          )}
          
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[750px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all leads"
                      className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
                      {...(isIndeterminate && { 'data-state': 'indeterminate' })}
                    />
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Phone</TableHead>
                  <TableHead className="text-xs sm:text-sm">Type</TableHead>
                  <TableHead className="text-xs sm:text-sm">Contact Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Timeline</TableHead>
                  <TableHead className="text-xs sm:text-sm">Location</TableHead>
                  <TableHead className="text-xs sm:text-sm">Budget</TableHead>
                  <TableHead className="text-xs sm:text-sm">Quality</TableHead>
                  <TableHead className="text-xs sm:text-sm">Next Step</TableHead>
                  <TableHead className="text-xs sm:text-sm">Created Date</TableHead>
                  <TableHead className="text-xs sm:text-sm">Call Transcript</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center h-24">Loading...</TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center h-24">
                      No leads found. Start making calls to see leads here!
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead: any) => (
                    <TableRow key={lead.id} className="text-xs sm:text-sm">
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                          aria-label={`Select ${lead.fullName || 'lead'}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.fullName || 'N/A'}</TableCell>
                      <TableCell>{lead.phoneNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={lead.status === 'Buyer' ? 'default' : lead.status === 'Seller' ? 'secondary' : 'outline'}>
                          {lead.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.contactStatus || 'New')}>
                          {lead.contactStatus || 'New'}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.timeline || 'N/A'}</TableCell>
                      <TableCell>{lead.location || 'N/A'}</TableCell>
                      <TableCell>{lead.budget || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={lead.leadQuality === 'High' ? 'destructive' : lead.leadQuality === 'Medium' ? 'default' : 'secondary'}>
                          {lead.leadQuality || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.nextStep || 'N/A'}</TableCell>
                      <TableCell>{lead.createdAt ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="max-w-2xl w-[30rem]">
                        {lead.rawTranscript ? (
                          <div className="text-xs text-gray-600 whitespace-pre-wrap break-words leading-relaxed max-h-32 overflow-y-auto">
                            {lead.rawTranscript}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No transcript</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
