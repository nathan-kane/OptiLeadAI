"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import SystemPromptManager from './SystemPromptManager';
import { Lead, CallAttempt } from '../../../types/Lead';
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
  const [leadCallStatuses, setLeadCallStatuses] = useState<{[key: string]: CallAttempt[]}>({});
  const [csvError, setCsvError] = useState<string | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setLeads([]);
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      setCsvError('Please upload a .csv, .xlsx, or .xls file.');
      return;
    }

    if (isCSV) {
      // Handle CSV files with Papa Parse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          processFileData(results.data, 'CSV');
        },
        error: () => setCsvError('Failed to read CSV file.'),
      });
    } else if (isExcel) {
      // Handle Excel files with xlsx
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert array of arrays to array of objects (similar to Papa Parse output)
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          const objectData = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          processFileData(objectData, 'Excel');
        } catch (error) {
          console.error('Excel parsing error:', error);
          setCsvError('Failed to parse Excel file.');
        }
      };
      reader.onerror = () => setCsvError('Failed to read Excel file.');
      reader.readAsArrayBuffer(file);
    }
  };

  const processFileData = (data: any[], fileType: string) => {
    try {
      if (!Array.isArray(data) || !data.length) {
        setCsvError(`${fileType} file is empty or invalid.`);
        return;
      }
      
      const parsedLeads: Lead[] = data.map((row: any) => {
        // Extract Full Name - prioritize "Full Name" column, then combine First + Last
        let fullName = '';
        const fullNameField = row['Full Name'] || row['full name'] || row.FullName || row.fullName || '';
        if (fullNameField && String(fullNameField).trim()) {
          fullName = String(fullNameField).trim();
        } else {
          const firstName = row['First Name'] || row['first name'] || row.FirstName || row.firstName || '';
          const lastName = row['Last Name'] || row['last name'] || row.LastName || row.lastName || '';
          const firstStr = String(firstName).trim();
          const lastStr = String(lastName).trim();
          if (firstStr && lastStr) {
            fullName = `${firstStr} ${lastStr}`;
          } else if (firstStr) {
            fullName = firstStr;
          } else if (lastStr) {
            fullName = lastStr;
          }
        }
        
        // Extract ALL phone numbers from any column containing "Phone" or "Mobile"
        const phoneNumbers: string[] = [];
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
            const phoneValue = String(row[key] || '').trim();
            if (phoneValue && !phoneNumbers.includes(phoneValue)) {
              phoneNumbers.push(phoneValue);
            }
          }
        });
        
        return { 
          firstName: fullName.split(' ')[0] || fullName || '', 
          fullName: fullName,
          phoneNumbers: phoneNumbers,
          listingStatus: row['Listing Status'] || row['listing status'] || row.ListingStatus || row.listingStatus || '',
          callAttempts: []
        };
      }).filter((lead: any) => {
        // Filter out rows without Full Name or phone numbers
        if (!lead.fullName || lead.phoneNumbers.length === 0) return false;
        
        // Filter out rows with Listing Status of "Withdrawn" or "Contract"
        const status = String(lead.listingStatus).toLowerCase().trim();
        if (status === 'withdrawn' || status === 'contract') return false;
        
        return true;
      });
      
      if (!parsedLeads.length) {
        setCsvError(`No valid leads found. Please ensure your ${fileType} file has name columns and phone/mobile columns.`);
        return;
      }
      setLeads(parsedLeads);
      toast({ title: `${fileType} Loaded`, description: `Successfully loaded ${parsedLeads.length} leads.` });
    } catch (error) {
      console.error(`${fileType} processing error:`, error);
      setCsvError(`Failed to process ${fileType} file.`);
    }
  };

  const logCallAttempt = async (leadName: string, phoneNumber: string, status: CallAttempt['status']) => {
    const callAttempt: CallAttempt = {
      phoneNumber,
      status,
      timestamp: new Date().toISOString()
    };

    // Update local state
    setLeadCallStatuses(prev => ({
      ...prev,
      [leadName]: [...(prev[leadName] || []), callAttempt]
    }));

    // Log to database
    try {
      await fetch('/api/log-call-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId || ''
        },
        body: JSON.stringify({
          leadName,
          phoneNumber,
          status,
          timestamp: callAttempt.timestamp
        })
      });
    } catch (error) {
      console.error('Failed to log call attempt:', error);
    }
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
      let humanAnswered = false;
      
      setCampaignStatus(`📞 Processing ${lead.fullName} (${i + 1}/${leads.length})...`);
      
      // Try each phone number for this lead
      for (let phoneIndex = 0; phoneIndex < lead.phoneNumbers.length; phoneIndex++) {
        const phoneNumber = lead.phoneNumbers[phoneIndex];
        
        try {
          setCampaignStatus(`📞 Calling ${lead.fullName} at ${phoneNumber} (${phoneIndex + 1}/${lead.phoneNumbers.length})...`);
          
          // Log call attempt as "In Progress"
          await logCallAttempt(lead.fullName, phoneNumber, 'In Progress');
          
          const res = await fetch('/api/start-call', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-User-ID': userId || ''
            },
            body: JSON.stringify({
              phoneNumber: phoneNumber,
              prospectName: lead.fullName,
              promptId: selectedPrompt.id,
              enableAMD: true // Enable Answering Machine Detection
            }),
          });
          
          const data = await res.json();
          
          if (!res.ok || !data.success) {
            const errorMsg = data.message || data.error || 'Unknown error from server.';
            setCampaignStatus(`❌ Failed to call ${lead.fullName} at ${phoneNumber}: ${errorMsg}`);
            await logCallAttempt(lead.fullName, phoneNumber, 'Failed');
            toast({ variant: 'destructive', title: `Call Failed`, description: `${lead.fullName} at ${phoneNumber}: ${errorMsg}` });
            continue; // Try next phone number
          }
          
          // Check AMD result
          if (data.amdResult === 'machine' || data.amdResult === 'voicemail') {
            setCampaignStatus(`📧 Voicemail detected for ${lead.fullName} at ${phoneNumber}`);
            await logCallAttempt(lead.fullName, phoneNumber, 'Voicemail');
            toast({ title: `Voicemail Detected`, description: `${lead.fullName} at ${phoneNumber} - trying next number` });
            continue; // Try next phone number
          } else if (data.amdResult === 'human') {
            setCampaignStatus(`✅ Human answered for ${lead.fullName} at ${phoneNumber}`);
            await logCallAttempt(lead.fullName, phoneNumber, 'Answered by Human');
            toast({ title: `Human Answered`, description: `AI is now talking to ${lead.fullName}` });
            humanAnswered = true;
            break; // Stop trying other numbers for this lead
          }
          
          // Wait before next call attempt
          if (phoneIndex < lead.phoneNumbers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay between numbers
          }
          
        } catch (err: any) {
          console.error(`[Campaign] Error calling ${lead.fullName} at ${phoneNumber}:`, err);
          setCampaignStatus(`❌ Error calling ${lead.fullName} at ${phoneNumber}: ${err.message}`);
          await logCallAttempt(lead.fullName, phoneNumber, 'Failed');
          toast({ variant: 'destructive', title: 'Call Error', description: `${lead.fullName} at ${phoneNumber}: ${err.message}` });
          continue; // Try next phone number
        }
      }
      
      if (humanAnswered) {
        setCampaignStatus(`✅ Successfully connected with ${lead.fullName}. Waiting for call completion...`);
        // Wait for call completion before moving to next lead
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
      } else {
        setCampaignStatus(`📝 All numbers tried for ${lead.fullName} - moving to next lead`);
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
          <CardDescription className="text-base text-slate-600">Upload a CSV or Excel file with 'Name' and 'Phone' columns.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
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
                    <TableHead className="font-bold text-slate-900">Phone Numbers</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.slice(0, 10).map((lead, idx) => (
                    <TableRow key={idx} className="hover:bg-blue-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{lead.fullName}</TableCell>
                        <TableCell className="text-slate-600">
                          <div className="space-y-1">
                            {lead.phoneNumbers.map((phone, phoneIdx) => {
                              const callAttempts = leadCallStatuses[lead.fullName] || [];
                              const phoneAttempt = callAttempts.find(attempt => attempt.phoneNumber === phone);
                              const statusColor = phoneAttempt?.status === 'Answered by Human' ? 'text-green-600' : 
                                                phoneAttempt?.status === 'Voicemail' ? 'text-yellow-600' :
                                                phoneAttempt?.status === 'Failed' ? 'text-red-600' :
                                                phoneAttempt?.status === 'In Progress' ? 'text-blue-600' : 'text-slate-600';
                              const statusIcon = phoneAttempt?.status === 'Answered by Human' ? '✅' : 
                                               phoneAttempt?.status === 'Voicemail' ? '📧' :
                                               phoneAttempt?.status === 'Failed' ? '❌' :
                                               phoneAttempt?.status === 'In Progress' ? '🔄' : '';
                              
                              return (
                                <div key={phoneIdx} className={`text-sm flex items-center gap-2 ${statusColor}`}>
                                  <span>{phone}</span>
                                  {statusIcon && <span>{statusIcon}</span>}
                                  {phoneAttempt?.status && (
                                    <span className="text-xs">({phoneAttempt.status})</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
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
