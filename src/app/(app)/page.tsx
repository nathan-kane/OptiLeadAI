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
import React, { useState } from 'react';

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
    case 'Qualified': return 'default'; // Potentially different color if 'default' is primary. Let's use accent
    case 'Nurturing': return 'secondary';
    case 'Converted': return 'default'; // This should be a success color, maybe primary
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
        <CardHeader>
          <CardTitle>Active Leads</CardTitle>
          <CardDescription>Showing {leads.length} leads. Interact with them using the actions menu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Score</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Last Interaction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
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
        </CardContent>
      </Card>
    </>
  );
}
