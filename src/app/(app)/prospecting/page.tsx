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
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
          title="Prospecting Campaigns"
          description="Upload a list of leads, select a prompt, and start your AI-powered calling campaign."
      />
      <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
          <CardTitle className="text-2xl font-extrabold text-slate-900">1. Upload Your Lead List</CardTitle>
          <CardDescription className="text-base text-slate-600">Upload a CSV file with 'Name' and 'Phone' columns.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCsvUpload}
              className="max-w-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
            />
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          {csvError && <p className="text-sm text-destructive mt-2">{csvError}</p>}
        </CardContent>
      </Card>
      
      {leads.length > 0 && (
        <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
           <CardHeader className="px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
              <CardTitle className="text-2xl font-extrabold text-slate-900">Lead Preview</CardTitle>
              <CardDescription className="text-base text-slate-600">Showing the first 10 of {leads.length} loaded leads.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
              <div className="overflow-x-auto rounded-b-2xl border border-gray-200">
                <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50">
                    <TableHead className="font-bold text-slate-900">Full Name</TableHead>
                    <TableHead className="font-bold text-slate-900">Phone Number</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.slice(0, 10).map((lead, idx) => (
                    <TableRow key={idx} className="hover:bg-blue-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{lead.fullName}</TableCell>
                        <TableCell className="text-slate-600">{lead.phone}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
              </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
          <CardTitle className="text-2xl font-extrabold text-slate-900">2. Select a Prompt</CardTitle>
          <CardDescription className="text-base text-slate-600">Choose the AI script for this campaign.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <SystemPromptManager onPromptSelected={setSelectedPrompt} />
        </CardContent>
      </Card>

      <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
          <CardTitle className="text-2xl font-extrabold text-slate-900">3. Start Campaign</CardTitle>
          <CardDescription className="text-base text-slate-600">Begin the AI calling sequence.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Button
            onClick={handleStartCampaign}
            disabled={campaignLoading || leads.length === 0 || !selectedPrompt}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold text-lg py-4 shadow-lg hover:scale-105 transition-all duration-200 uppercase tracking-wide"
            size="lg"
          >
            {campaignLoading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> IN PROGRESS...</>
            ) : (
              <><PhoneOutgoing className="mr-2 h-5 w-5" /> START CALLING CAMPAIGN</>
            )}
          </Button>
          {campaignStatus && (
          <Alert className="mt-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
            <AlertTitle className="flex items-center gap-2 text-slate-900 font-bold">
              {campaignLoading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
              Campaign Status
            </AlertTitle>
            <AlertDescription className="text-slate-700 text-base">
              {campaignStatus}
            </AlertDescription>
          </Alert>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
