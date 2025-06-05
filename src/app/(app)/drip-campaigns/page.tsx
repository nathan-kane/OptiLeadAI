"use client";

import { useState } from 'react';
import type { DripCampaign } from '@/types';
import { mockDripCampaigns } from '@/data/mock-data';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Play, Pause, Edit, Trash2, BarChart2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DripCampaignForm } from '@/components/drip-campaign-form';
import { useToast } from "@/hooks/use-toast";

const getStatusBadgeVariant = (status: DripCampaign['status']) => {
  switch (status) {
    case 'Active':
      return 'default'; // Using primary for active
    case 'Paused':
      return 'secondary';
    case 'Draft':
      return 'outline';
    default:
      return 'outline';
  }
};

export default function DripCampaignsPage() {
  const [campaigns, setCampaigns] = useState<DripCampaign[]>(mockDripCampaigns);
  const { toast } = useToast();

  const handleSaveCampaign = (campaignToSave: DripCampaign) => {
    setCampaigns(prev => {
      const existingIndex = prev.findIndex(c => c.id === campaignToSave.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = campaignToSave;
        return updated;
      }
      return [...prev, campaignToSave];
    });
  };
  
  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    toast({ title: "Campaign Deleted", description: "The campaign has been removed." });
  };

  const handleToggleStatus = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const newStatus = c.status === 'Active' ? 'Paused' : 'Active';
        toast({ title: "Status Updated", description: `Campaign status changed to ${newStatus}.` });
        return {...c, status: newStatus};
      }
      return c;
    }));
  };

  return (
    <>
      <PageHeader
        title="Automated Drip Campaigns"
        description="Create, manage, and monitor your email nurturing sequences."
        actions={
          <DripCampaignForm 
            onSave={handleSaveCampaign} 
            triggerButton={<Button><PlusCircle className="mr-2 h-4 w-4" /> Create Campaign</Button>}
          />
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>Showing {campaigns.length} drip campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Emails</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(campaign.status)}>{campaign.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {campaign.triggerType === 'scoreThreshold' ? `Score > ${campaign.triggerValue}` : 
                     campaign.triggerType === 'formSubmission' ? `Form: ${campaign.triggerValue}` : 'Manual'}
                  </TableCell>
                  <TableCell>{campaign.totalEmails}</TableCell>
                  <TableCell>{campaign.enrollmentCount}</TableCell>
                  <TableCell>{campaign.openRate || 0}%</TableCell>
                  <TableCell>{campaign.clickThroughRate || 0}%</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => alert(`Viewing stats for ${campaign.name}`)}>
                          <BarChart2 className="mr-2 h-4 w-4" /> View Stats
                        </DropdownMenuItem>
                         <DripCampaignForm 
                            campaign={campaign}
                            onSave={handleSaveCampaign} 
                            triggerButton={
                                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </button>
                            }
                        />
                        <DropdownMenuItem onClick={() => handleToggleStatus(campaign.id)}>
                          {campaign.status === 'Active' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                          {campaign.status === 'Active' ? 'Pause' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteCampaign(campaign.id)} className="text-destructive data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
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
