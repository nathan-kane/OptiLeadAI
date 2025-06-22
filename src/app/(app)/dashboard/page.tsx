
"use client";

import type { Lead } from '@/types';
import { mockLeads } from '@/data/mock-data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, BellPlus, Edit3, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { auth } from '@/lib/firebase/client'; // Import auth
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged

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
  // Use Tailwind classes for specific colors not covered by badge variants
  switch (status) {
    case 'Qualified': return 'bg-green-500 hover:bg-green-600'; // Example custom color
    case 'Converted': return 'bg-blue-500 hover:bg-blue-600'; // Example custom color
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
  const [leads, setLeads] = useState<Lead[]>(mockLeads.sort((a, b) => b.score - a.score));
  const router = useRouter(); // Initialize useRouter

  // Log when DashboardPage mounts to confirm it's being rendered
  useEffect(() => {
    console.log("DashboardPage: Mounted. Checking auth state via AppLayout.");
    // Auth check is primarily handled by AppLayout, but we can add specific logs if needed.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("DashboardPage: User is authenticated (verified by page itself). UID:", user.uid);
      } else {
        console.log("DashboardPage: User is NOT authenticated (verified by page itself). Redirecting to /login via AppLayout is expected.");
      }
    });
    return () => unsubscribe();
  }, []);


  const handleNotifySales = (lead: Lead) => {
    toast({
      title: "Sales Notified",
      description: `${lead.name} has been flagged for sales attention.`,
    });
  };

  const handleUpdateStatus = (leadId: string, newStatus: Lead['status']) => {
    setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? {...lead, status: newStatus} : lead));
    toast({
      title: "Status Updated",
      description: `Lead status changed to ${newStatus}.`,
    });
  };


  return (
    <>
      <PageHeader
        title="Lead Prioritization Dashboard"
        description="Focus on your most promising leads, sorted by AI score."
        actions={<Button>Add New Lead</Button>}
      />
      <Card>
        <CardHeader className="px-2 sm:px-6 py-4">
          <CardTitle className="text-lg sm:text-2xl">Active Leads</CardTitle>
          <CardDescription className="text-xs sm:text-base">Showing {leads.length} leads. Interact with them using the actions menu.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 py-2">
          {/* Responsive scroll container for table */}
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-xs sm:text-sm">Score</TableHead>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Company</TableHead>
                  <TableHead className="text-xs sm:text-sm">Priority</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Data</TableHead>
                  <TableHead className="text-xs sm:text-sm">Last Interaction</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="text-xs sm:text-sm">
                    <TableCell className="font-medium">{lead.score}</TableCell>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(lead.priority)}>{lead.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(lead.status)}
                        className={getStatusColorClass(lead.status) || (lead.status === 'Qualified' ? 'bg-accent text-accent-foreground hover:bg-accent/80' : '')}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DataValidationIcon status={lead.dataValidationStatus} />
                    </TableCell>
                    <TableCell>{lead.lastInteraction}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => alert(`Viewing details for ${lead.name}`)}>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
