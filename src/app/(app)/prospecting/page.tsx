"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import SystemPromptManager from './SystemPromptManager';
import { Lead } from '../../../types/Lead';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Upload, PhoneOutgoing, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";

// Import the SystemPrompt interface
interface SystemPrompt {
  id?: string;
  title: string;
  prompt: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
  isDefault?: boolean;
  tags?: string[];
}

export default function ProspectingPage() {
  const { userId } = useAuth();
  const { toast } = useToast();
  
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);

  // CSV upload state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setLeads([]);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setCsvError('Please upload a .csv file.');
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const data = results.data;
          if (!Array.isArray(data) || !data.length) {
            setCsvError('CSV is empty or invalid.');
            return;
          }
          
          const parsedLeads: Lead[] = data.map((row: any) => {
            const nameField = row.Name || row.name || row.NAME || 
                             row['Full Name'] || row['full name'] || 
                             row.firstName || row.FirstName || 
                             row['First Name'] || row['first name'] || '';
            const phoneField = row.Phone || row.phone || row.PHONE || 
                              row['Phone Number'] || row['phone number'] || 
                              row.phoneNumber || row.PhoneNumber || '';
            
            const name = String(nameField).trim();
            const phone = String(phoneField).trim();
            
            return { 
              firstName: name.split(' ')[0] || name || '', 
              fullName: name || '',
              phone: phone 
            };
          }).filter((lead: Lead) => lead.fullName && lead.phone);
          
          if (!parsedLeads.length) {
            setCsvError(`No valid leads found. Please ensure your CSV has 'Name' and 'Phone' columns.`);
            return;
          }
          setLeads(parsedLeads);
          toast({ title: "CSV Loaded", description: `Successfully loaded ${parsedLeads.length} leads.` });
        } catch (error) {
          console.error('CSV parsing error:', error);
          setCsvError('Failed to parse CSV.');
        }
      },
      error: () => setCsvError('Failed to read CSV file.'),
    });
  };

  const handleStartCampaign = async () => {
    if (!selectedPrompt || !selectedPrompt.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a system prompt first.' });
      return;
    }
    
    if (campaignLoading) return;
    
    setCampaignLoading(true);
    setCampaignStatus('🚀 Starting campaign...');
    
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      try {
        setCampaignStatus(`📞 Calling ${lead.fullName} (${i + 1}/${leads.length})...`);
        
        const res = await fetch('/api/start-call', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-ID': userId || ''
          },
          body: JSON.stringify({
            phoneNumber: lead.phone,
            prospectName: lead.fullName,
            promptId: selectedPrompt.id,
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          const errorMsg = data.message || data.error || 'Unknown error from server.';
          setCampaignStatus(`❌ Failed to call ${lead.fullName}: ${errorMsg}`);
          toast({ variant: 'destructive', title: `Call Failed for ${lead.fullName}`, description: errorMsg });
          break; // Stop campaign on first error
        }
        
        setCampaignStatus(`✅ Call initiated for ${lead.fullName}. Waiting for completion...`);
        toast({ title: `Call Initiated`, description: `AI is now calling ${lead.fullName}.` });
        
        // Wait before next call to simulate call duration
        if (i < leads.length - 1) {
          const callCompletionDelay = 30000; // 30 seconds
          await new Promise(resolve => setTimeout(resolve, callCompletionDelay));
        }
        
      } catch (err: any) {
        console.error(`[Campaign] Error calling ${lead.fullName}:`, err);
        setCampaignStatus(`❌ Error calling ${lead.fullName}: ${err.message}`);
        toast({ variant: 'destructive', title: 'Campaign Error', description: err.message });
        break; // Stop campaign on error
      }
    }
    
    setCampaignLoading(false);
    setCampaignStatus('🎉 Campaign completed!');
  };

  return (
    <>
    <PageHeader 
        title="Prospecting Campaigns"
        description="Upload a list of leads, select a prompt, and start your AI-powered calling campaign."
    />
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Upload Your Lead List</CardTitle>
            <CardDescription>Upload a CSV file with 'Name' and 'Phone' columns.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCsvUpload}
              className="max-w-sm"
            />
            {csvError && <p className="text-sm text-destructive mt-2">{csvError}</p>}
          </CardContent>
        </Card>
        
        {leads.length > 0 && (
          <Card>
             <CardHeader>
                <CardTitle>Lead Preview</CardTitle>
                <CardDescription>Showing the first 10 of {leads.length} loaded leads.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.slice(0, 10).map((lead, idx) => (
                    <TableRow key={idx}>
                        <TableCell>{lead.fullName}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
         <Card>
            <CardHeader>
                <CardTitle>2. Select a Prompt</CardTitle>
                 <CardDescription>Choose the AI script for this campaign.</CardDescription>
            </CardHeader>
            <CardContent>
                <SystemPromptManager onPromptSelected={setSelectedPrompt} />
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>3. Start Campaign</CardTitle>
                <CardDescription>Begin the AI calling sequence.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleStartCampaign}
                    disabled={campaignLoading || leads.length === 0 || !selectedPrompt}
                    className="w-full"
                    size="lg"
                >
                    {campaignLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> In Progress...</>
                    ) : (
                        <><PhoneOutgoing className="mr-2 h-4 w-4" /> Start Calling Campaign</>
                    )}
                </Button>
                {campaignStatus && (
                <Alert className="mt-4">
                    <AlertTitle className="flex items-center gap-2">
                        {campaignLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Campaign Status
                    </AlertTitle>
                    <AlertDescription>
                        {campaignStatus}
                    </AlertDescription>
                </Alert>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
