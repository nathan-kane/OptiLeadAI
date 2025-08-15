"use client";

import type { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit3, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
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
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
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
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">Loading...</TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">
                      No leads found. Start making calls to see leads here!
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead: any) => (
                    <TableRow key={lead.id} className="text-xs sm:text-sm">
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'Contacted')}>
                              <Edit3 className="mr-2 h-4 w-4" /> Mark as Contacted
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'Converted')} className="text-green-600">
                              Mark as Converted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'Disqualified')} className="text-red-600">
                              Mark as Disqualified
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
