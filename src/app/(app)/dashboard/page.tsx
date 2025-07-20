
"use client";

import type { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, BellPlus, Edit3, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AddLeadForm } from '@/components/add-lead-form';

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

const getStatusBadgeVariant = (status: Lead['status']) => {
  switch (status) {
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

const getStatusColorClass = (status: Lead['status']) => {
  switch (status) {
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("DashboardPage: User authenticated. Setting up Firestore listener.");
        const leadsQuery = query(collection(db, "leads"), orderBy("createdAt", "desc"));
        const unsubscribeSnapshot = onSnapshot(leadsQuery, (snapshot) => {
          const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          setLeads(leadsData);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching leads:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not fetch leads from the database." });
          setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        console.log("DashboardPage: User is NOT authenticated.");
        setIsLoading(false);
        setLeads([]);
      }
    });
    return () => unsubscribeAuth();
  }, [toast]);


  const handleNotifySales = (lead: Lead) => {
    toast({
      title: "Sales Notified",
      description: `${lead.name} has been flagged for sales attention.`,
    });
  };

  const handleUpdateStatus = (leadId: string, newStatus: Lead['status']) => {
    // This would be a Firestore update in a real app
    console.log(`Updating lead ${leadId} to status ${newStatus}`);
    toast({
      title: "Status Updated",
      description: `Lead status changed to ${newStatus}. (Note: DB update not yet implemented)`,
    });
  };


  return (
    <>
      <PageHeader
        title="Lead Prioritization Dashboard"
        description="Focus on your most promising leads, sorted by AI score."
        actions={<AddLeadForm />}
      />
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
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Timeline</TableHead>
                  <TableHead className="text-xs sm:text-sm">Location</TableHead>
                  <TableHead className="text-xs sm:text-sm">Budget</TableHead>
                  <TableHead className="text-xs sm:text-sm">Quality</TableHead>
                  <TableHead className="text-xs sm:text-sm">Next Step</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">Loading...</TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center h-24">
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
                      <TableCell>{lead.timeline || 'N/A'}</TableCell>
                      <TableCell>{lead.location || 'N/A'}</TableCell>
                      <TableCell>{lead.budget || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={lead.leadQuality === 'High' ? 'destructive' : lead.leadQuality === 'Medium' ? 'default' : 'secondary'}>
                          {lead.leadQuality || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.nextStep || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => alert(`Viewing details for ${lead.fullName}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNotifySales(lead)}>
                              <BellPlus className="mr-2 h-4 w-4" /> Notify Sales
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'Contacted')}>
                              <Edit3 className="mr-2 h-4 w-4" /> Mark as Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'Qualified')}>
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Qualified
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
