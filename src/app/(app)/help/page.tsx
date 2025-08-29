"use client";

import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight, Upload, MessageSquare, Phone, BarChart3, Users, DollarSign, User, Settings, TrendingUp, Mail, Target, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HelpSection {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
}

export default function HelpPage() {
  const [openSections, setOpenSections] = useState<string[]>(['dashboard-overview']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Dashboard Help Sections
  const dashboardSections: HelpSection[] = [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      icon: <BarChart3 className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>The Lead Prioritization Dashboard is your command center for managing qualified leads from your calling campaigns.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📊 What You'll See:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Active Leads Table:</strong> All leads from your prospecting campaigns in one view</li>
              <li><strong>Lead Details:</strong> Name, phone, contact status, timeline, budget, quality score, call transcript, and more</li>
              <li><strong>Call Transcripts:</strong> Full AI conversation records for each lead for review and analysis</li>
              <li><strong>Bulk Actions:</strong> Update multiple leads simultaneously</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">✅ Key Benefits:</h4>
            <ul className="space-y-1 text-green-700">
              <li>Focus on highest-quality leads first</li>
              <li>Track lead progression through your sales funnel</li>
              <li>Review AI conversation insights</li>
              <li>Manage lead status efficiently</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard-lead-management',
      title: 'Managing Leads',
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Learn how to effectively manage and update your leads in the dashboard.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📝 Lead Status Options:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>New:</strong> Fresh lead from calling campaign</li>
              <li><strong>Contacted:</strong> You've reached out to these leads personally</li>
              <li><strong>Qualified:</strong> Lead meets your criteria for High, Medium, or Low</li>
              <li><strong>Nurturing:</strong> Building relationship over time and needs more attention</li>
              <li><strong>Converted:</strong> Lead became a client</li>
              <li><strong>Rejected/Disqualified:</strong> Not a good fit but will remain in the database</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">🔄 Updating Single Lead Status:</h4>
            <ol className="space-y-1 text-amber-700 list-decimal list-inside">
              <li>Click the three dots (⋯) next to any lead</li>
              <li>Select "Update Status" from the dropdown</li>
              <li>Choose the appropriate new status</li>
              <li>The lead will be automatically updated</li>
            </ol>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">⚡ Bulk Actions For Updating Multiple Leads Status:</h4>
            <ul className="space-y-1 text-purple-700">
              <li>Select multiple leads using checkboxes</li>
              <li>Use bulk action buttons to update all selected leads</li>
              <li>Available actions: Mark as Contacted, Qualified, Nurturing, Converted, Rejected, or Delete</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard-transcripts',
      title: 'Understanding Call Transcripts',
      icon: <FileText className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Every AI call generates a detailed transcript showing the complete conversation.</p>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">📝 Transcript Information:</h4>
            <ul className="space-y-1 text-green-700">
              <li><strong>Complete Conversation:</strong> Word-for-word AI and prospect dialogue</li>
              <li><strong>Lead Qualification:</strong> Budget, timeline, and buying intent</li>
              <li><strong>Contact Information:</strong> Verified phone numbers and preferences</li>
              <li><strong>Next Steps:</strong> Recommended follow-up actions</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🔍 How to Use Transcripts:</h4>
            <ol className="space-y-1 text-blue-700 list-decimal list-inside">
              <li>Scroll to the "Call Transcript" column in the leads table</li>
              <li>Read the full conversation to understand lead quality</li>
              <li>Look for budget mentions, timeline indicators, and objections</li>
              <li>Use insights to personalize your follow-up approach</li>
            </ol>
          </div>
        </div>
      )
    }
  ];

  // Prospecting Help Sections (Enhanced)
  const prospectingSections: HelpSection[] = [
    {
      id: 'prospecting-upload',
      title: 'Step 1: Upload Your Lead List',
      icon: <Upload className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Start by uploading a file containing the names and phone numbers of your prospects.</p>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">✅ File Requirements:</h4>
            <ul className="space-y-1 text-green-700">
              <li><strong>Accepted formats:</strong> Excel (.xlsx, .xls) or CSV (.csv)</li>
              <li><strong>Required columns:</strong>
                <ul className="ml-4 space-y-1">
                  <li>Full name of the prospect (or First Name + Last Name columns)</li>
                  <li>At least one phone number column</li>
                  <li><strong>Multiple phone numbers:</strong> Include columns like "Cell Phone", "Home Phone", "Office Phone"</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📤 Upload Instructions:</h4>
            <ol className="space-y-1 text-blue-700 list-decimal list-inside">
              <li>Click the "Choose File" button</li>
              <li>Browse to your file</li>
              <li>Select your Excel or CSV file</li>
              <li>Once uploaded, the file will be read and a preview of your prospects will appear below the button</li>
                <ul className="ml-4 space-y-1">
                  <li>  Make sure the phone number has a +1 at the front, for example +1234567890 or +1555 555-5555 or +1(555) 555-5555</li>
                  <li>The system will add the +1 to any phone number that is missing it during the upload process</li>
                </ul>              
              <li>The system automatically detects and extracts all phone numbers</li>
            </ol>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">⚠️ Troubleshooting:</h4>
            <ul className="space-y-1 text-amber-700">
              <li><strong>No leads showing?</strong> Check that your file has name and phone columns</li>
              <li><strong>Missing phone numbers?</strong> Any rows missing phone numbers will be filtered out and not uploaded to the system</li>
              <li><strong>File won't upload?</strong> Verify file format is .csv, .xlsx, or .xls</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'prospecting-prompts',
      title: 'Step 2: Select or Customize a Prompt',
      icon: <MessageSquare className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Prompts guide the AI agent's conversation with each lead. Choose from existing prompts or create custom ones.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🔹 Using the Default Prompt:</h4>
            <ul className="space-y-1 text-blue-700">
              <li>Each account includes a "Default Lead Qualification Prompt"</li>
              <li>Select this prompt to auto-fill the Prompt Name and Prompt Body fields</li>
              <li>You may edit the prompt, such as changing the AI agent's name from "Lisa" to a name of your choice. However, the AI agent's voice is a female voice</li>
              <li>The default prompt is optimized for real estate lead qualification</li>
            </ul>
          </div>
{/*
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">🆕 Creating Custom Prompts:</h4>
            <ol className="space-y-1 text-purple-700 list-decimal list-inside">
              <li>Click "New Prompt" to start from scratch</li>
              <li>Enter a descriptive prompt name</li>
              <li>Write your custom conversation script</li>
              <li>Include qualification questions specific to your business</li>
              <li>Save the prompt for future campaigns</li>
            </ol>
          </div>
*/}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">⚠️ Important Guidelines:</h4>
            <ul className="space-y-1 text-amber-700">
              <li>Keep prompts under 5000 characters for optimal performance</li>
              <li>Use a professional, conversational tone</li>
              <li>Include clear qualification questions</li>
              <li>Test prompts with small lead lists first</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">💾 Saving Changes:</h4>
            <p className="text-gray-700">After editing, click "Update Prompt" to save your changes for future use.</p>
          </div>
        </div>
      )
    },
    {
      id: 'prospecting-campaign',
      title: 'Step 3: Start the Calling Campaign',
      icon: <Phone className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Launch your AI-powered calling campaign to automatically contact all leads in your list.</p>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">🚀 Campaign Process:</h4>
            <ol className="space-y-2 text-green-700 list-decimal list-inside">
              <li>Click the <strong>"START CALLING CAMPAIGN"</strong> button</li>
              <li>The AI agent begins calling each prospect using your selected prompt</li>
              <li>For each lead, the system tries all available phone numbers</li>
              <li>Answering Machine Detection (AMD) automatically identifies voicemails</li>
              <li>When a human answers, the AI conducts the full qualification conversation</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📊 Call Status Indicators:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>🔄 In Progress:</strong> Call is being placed</li>
              <li><strong>✅ Answered by Human:</strong> Human answered, conversation proceeding</li>
              <li><strong>📧 Voicemail:</strong> AMD detected voicemail/machine</li>
              <li><strong>❌ Failed:</strong> Call failed due to error</li>
            </ul>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">⏱️ Campaign Timing:</h4>
            <ul className="space-y-1 text-purple-700">
              <li>5-second delay between phone numbers for the same lead</li>
              <li>30-second delay between different leads</li>
              <li>Campaign continues until all leads are processed</li>
              <li>Real-time status updates throughout the process</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'prospecting-results',
      title: 'Step 4: Viewing Campaign Results',
      icon: <TrendingUp className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>After your campaign completes, all qualified leads and conversation data are automatically saved to your dashboard.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📈 What Gets Saved:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Lead qualification status:</strong> Buyer/Seller classification</li>
              <li><strong>Budget information:</strong> Price range and financial capacity</li>
              <li><strong>Timeline details:</strong> When they plan to buy/sell</li>
              <li><strong>Full call transcript:</strong> Complete conversation record</li>
              <li><strong>Contact preferences:</strong> Best times and methods to reach them</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">🎯 Next Steps:</h4>
            <ol className="space-y-1 text-green-700 list-decimal list-inside">
              <li>Go to your <strong>Dashboard</strong> to view all qualified leads</li>
              <li>Review call transcripts to understand each lead's needs</li>
              <li>Update lead statuses as you follow up personally</li>
              <li>Use the insights to prioritize your outreach efforts</li>
            </ol>
          </div>
        </div>
      )
    }
  ];

  // Transactions Help Sections
  const transactionsSections: HelpSection[] = [
    {
      id: 'transactions-overview',
      title: 'Transactions Overview',
      icon: <DollarSign className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>The Transactions Dashboard helps you manage your real estate deals from contract to closing.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🏠 What You Can Track:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Property Details:</strong> Address, MLS number, contract price</li>
              <li><strong>Client Information:</strong> Buyer/seller details and contact info</li>
              <li><strong>Transaction Status:</strong> Active, Pending, Closed, Cancelled</li>
              <li><strong>Timeline:</strong> Key dates and milestones</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">✅ Key Benefits:</h4>
            <ul className="space-y-1 text-green-700">
              <li>Keep all deal information organized in one place</li>
              <li>Track transaction progress and status</li>
              <li>Access client and property details quickly</li>
              <li>Monitor your sales pipeline effectively</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'transactions-creating',
      title: 'Creating New Transactions',
      icon: <FileText className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Learn how to add new real estate transactions to your pipeline.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📝 Required Information:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Client Details:</strong> Name, contact information, buyer/seller type</li>
              <li><strong>Property Information:</strong> Address, city, state</li>
              <li><strong>Financial Details:</strong> Contract price, commission structure</li>
              <li><strong>Transaction Details:</strong> MLS number, status, key dates</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">➕ Creating a Transaction:</h4>
            <ol className="space-y-1 text-green-700 list-decimal list-inside">
              <li>Click the "Create Transaction" button</li>
              <li>Fill in client information (or select existing client)</li>
              <li>Enter property details and contract information</li>
              <li>Set the initial transaction status</li>
              <li>Save the transaction to add it to your pipeline</li>
            </ol>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">💡 Pro Tips:</h4>
            <ul className="space-y-1 text-amber-700">
              <li>Create transactions as soon as contracts are signed</li>
              <li>Keep MLS numbers updated for easy reference</li>
              <li>Use consistent status naming for better organization</li>
              <li>Include all relevant dates for timeline tracking</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'transactions-managing',
      title: 'Managing Transaction Status',
      icon: <TrendingUp className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Keep your transactions up-to-date by managing their status throughout the deal lifecycle.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📊 Transaction Statuses:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Active:</strong> Contract signed, deal in progress</li>
              <li><strong>Pending:</strong> Awaiting inspections, financing, or other contingencies</li>
              <li><strong>Closed:</strong> Deal completed successfully</li>
              <li><strong>Cancelled:</strong> Deal fell through or was terminated</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">🔄 Updating Status:</h4>
            <ol className="space-y-1 text-green-700 list-decimal list-inside">
              <li>Click on any transaction to view details</li>
              <li>Edit the transaction status field</li>
              <li>Update other relevant information as needed</li>
              <li>Save changes to keep records current</li>
            </ol>
          </div>
        </div>
      )
    }
  ];

  // Clients Help Sections
  const clientsSections: HelpSection[] = [
    {
      id: 'clients-overview',
      title: 'Clients Overview',
      icon: <User className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>The Clients Dashboard is your central hub for managing client relationships and contact information.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">👥 Client Management Features:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Contact Information:</strong> Names, phone numbers, email addresses</li>
              <li><strong>Location Data:</strong> Addresses, cities, states, zip codes</li>
              <li><strong>Client Status:</strong> Active, inactive, or archived clients</li>
              <li><strong>Search & Filter:</strong> Quickly find specific clients</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">✅ Benefits:</h4>
            <ul className="space-y-1 text-green-700">
              <li>Keep all client information organized and accessible</li>
              <li>Quickly reference contact details during conversations</li>
              <li>Track client relationships over time</li>
              <li>Integrate with transaction management</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'clients-adding',
      title: 'Adding New Clients',
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Learn how to add new clients to your database and keep their information organized.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📝 Client Information Fields:</h4>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Name:</strong> Full name (required)</li>
              <li><strong>Contact:</strong> Email address and phone number</li>
              <li><strong>Address:</strong> Street address, city, state, zip code</li>
              <li><strong>Status:</strong> Active, inactive, or custom status</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">➕ Adding a Client:</h4>
            <ol className="space-y-1 text-green-700 list-decimal list-inside">
              <li>Click the "Add New Client" button</li>
              <li>Fill in the client's name (required field)</li>
              <li>Add contact information and address details</li>
              <li>Set the client status (defaults to "Active")</li>
              <li>Click "Add Client" to save the information</li>
            </ol>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">🔍 Finding Clients:</h4>
            <ul className="space-y-1 text-purple-700">
              <li>Use the search bar to find clients by name, email, or phone</li>
              <li>Click on any client row to view detailed information</li>
              <li>Edit client information by clicking on their name</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'clients-management',
      title: 'Client Relationship Management',
      icon: <Settings className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p>Effectively manage your client relationships and keep information up-to-date.</p>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🔄 Updating Client Information:</h4>
            <ol className="space-y-1 text-blue-700 list-decimal list-inside">
              <li>Click on any client name to open their profile</li>
              <li>Edit any field that needs updating</li>
              <li>Save changes to keep records current</li>
              <li>Use status updates to track relationship progress</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">📊 Client Organization Tips:</h4>
            <ul className="space-y-1 text-green-700">
              <li>Keep contact information current and complete</li>
              <li>Use consistent naming conventions</li>
              <li>Update client status based on relationship stage</li>
              <li>Regular review and cleanup of client database</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">🔗 Integration with Transactions:</h4>
            <p className="text-amber-700">Clients in your database can be easily linked to transactions, creating a complete picture of your business relationships.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📚 OptiLeadAI Help Center</h1>
        <p className="text-muted-foreground">
          Comprehensive guides for using all features of your AI-powered real estate platform.
        </p>
      </div>

      <Tabs defaultValue="prospecting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-gray-100 p-1">
          <TabsTrigger value="prospecting" className="rounded-lg">Prospecting</TabsTrigger>
          <TabsTrigger value="dashboard" className="rounded-lg">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-lg">Transactions</TabsTrigger>
          <TabsTrigger value="clients" className="rounded-lg">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="prospecting" className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">📞 Prospecting Campaigns</h2>
            <p className="text-muted-foreground">
              Launch AI-powered calling campaigns to qualify potential leads automatically.
            </p>
          </div>
          {prospectingSections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </div>
                      {openSections.includes(section.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {section.content}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">📊 Lead Dashboard</h2>
            <p className="text-muted-foreground">
              Manage and prioritize your qualified leads from AI calling campaigns.
            </p>
          </div>
          {dashboardSections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </div>
                      {openSections.includes(section.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {section.content}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">🏠 Transactions</h2>
            <p className="text-muted-foreground">
              Manage your real estate deals from contract to closing.
            </p>
          </div>
          {transactionsSections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </div>
                      {openSections.includes(section.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {section.content}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">👥 Clients</h2>
            <p className="text-muted-foreground">
              Manage client relationships and contact information.
            </p>
          </div>
          {clientsSections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </div>
                      {openSections.includes(section.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {section.content}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Need additional help? Contact our support team or check out our other help sections for Service Partners, Analytics, and advanced features.
        </p>
      </div>
    </div>
  );
}
