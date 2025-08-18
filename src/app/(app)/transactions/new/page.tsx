"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, setDoc, doc, serverTimestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
// import { toast } from 'sonner';

interface ServicePartner {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  name: string;
  fullName?: string;
  status?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  contactStatus?: string;
}

export default function NewTransactionPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Service Partner Lists
  const [mortgageCompanies, setMortgageCompanies] = useState<ServicePartner[]>([]);
  const [titleCompanies, setTitleCompanies] = useState<ServicePartner[]>([]);
  const [appraiserCompanies, setAppraiserCompanies] = useState<ServicePartner[]>([]);
  const [inspectorCompanies, setInspectorCompanies] = useState<ServicePartner[]>([]);
  
  // Lead Management
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [formData, setFormData] = useState({
    // Lead Information
    leadId: '',
    
    // Client Information
    clientId: '',
    clientFirstName: '',
    clientLastName: '',
    clientAddress1: '',
    clientAddress2: '',
    clientCity: '',
    clientState: '',
    clientZip: '',
    clientType: '',
    clientCellPhone: '',
    clientHomePhone: '',
    clientEmail: '',
    
    // Property Information
    propertyAddress: '',
    propertyCity: '',
    propertyState: '',
    propertyZip: '',
    mlsNumber: '',
    
    // Contract Information
    contractDate: '',
    contractPrice: '',
    
    // Important Dates (24-hour periods)
    sellerDisclosure24a: '',
    dueDiligence24b: '',
    financing24c: '',
    settlement24d: '',
    
    // Additional Dates
    inspectionDate: '',
    appraisalDate: '',
    closingDate: '',
    walkThroughDate: '',
    
    // Transaction Status
    trxnStatus: 'Active',
    
    // Company Selections
    selectedInspectorCompany: '',
    selectedAppraiserCompany: '',
    selectedTitleCompany: '',
    selectedMortgageCompany: '',
    selectedOtherAgentCompany: '',
    selectedOtherTitleCompany: '',
  });

  // Fetch service partner companies and leads
  useEffect(() => {
    if (currentUser?.uid) {
      fetchServicePartners();
      fetchLeads();
    }
  }, [currentUser]);

  // Fetch service partners from user's collections
  const fetchServicePartners = async () => {
    if (!currentUser) return;

    try {
      // Fetch all service partner types in parallel
      const [mortgageSnap, titleSnap, appraiserSnap, inspectorSnap] = await Promise.all([
        getDocs(query(collection(db, `users/${currentUser.uid}/mortgage`), orderBy('mortgageCompanyName'))),
        getDocs(query(collection(db, `users/${currentUser.uid}/titleCompany`), orderBy('titleCompanyName'))),
        getDocs(query(collection(db, `users/${currentUser.uid}/appraiserCompany`), orderBy('appraiserCompanyName'))),
        getDocs(query(collection(db, `users/${currentUser.uid}/inspectorCompany`), orderBy('inspectorCompanyName')))
      ]);

      // Map documents to ServicePartner objects with correct field names
      setMortgageCompanies(mortgageSnap.docs.map(doc => ({ id: doc.id, name: doc.data().mortgageCompanyName || 'Unnamed Company' })));
      setTitleCompanies(titleSnap.docs.map(doc => ({ id: doc.id, name: doc.data().titleCompanyName || 'Unnamed Company' })));
      setAppraiserCompanies(appraiserSnap.docs.map(doc => ({ id: doc.id, name: doc.data().appraiserCompanyName || 'Unnamed Company' })));
      setInspectorCompanies(inspectorSnap.docs.map(doc => ({ id: doc.id, name: doc.data().inspectorCompanyName || 'Unnamed Company' })));
    } catch (error) {
      console.error('Error fetching service partners:', error);
    }
  };

  // Fetch leads from user's collection with Contact Status filter
  const fetchLeads = async () => {
    if (!currentUser) return;

    try {
      console.log('Fetching leads for user:', currentUser.uid);
      
      // First try to get all leads to see what's available
      const allLeadsSnap = await getDocs(
        collection(db, `users/${currentUser.uid}/leads`)
      );
      
      console.log('Total leads found:', allLeadsSnap.docs.length);
      
      // Filter for contacted leads
      const contactedLeads = allLeadsSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Lead))
        .filter(lead => lead.contactStatus === 'Contacted')
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      console.log('Contacted leads found:', contactedLeads.length, contactedLeads);
      
      setLeads(contactedLeads as Lead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  // Handle lead selection and auto-populate client fields
  const handleLeadSelection = (leadId: string) => {
    if (leadId === 'none' || leadId === 'no-leads') {
      // Clear leadId if no lead selected
      setFormData(prev => ({
        ...prev,
        leadId: ''
      }));
      return;
    }

    const selectedLead = leads.find(lead => lead.id === leadId);
    
    if (selectedLead) {
      // Auto-populate client fields from lead data
      const leadName = selectedLead.fullName || selectedLead.name || '';
      const nameParts = leadName.split(' ');
      
      setFormData(prev => ({
        ...prev,
        leadId: leadId,
        clientType: selectedLead.status || selectedLead.contactStatus || '',
        clientFirstName: nameParts[0] || '',
        clientLastName: nameParts.slice(1).join(' ') || '',
        clientEmail: selectedLead.email || '',
        clientCellPhone: selectedLead.phoneNumber || selectedLead.phone || '',
        clientHomePhone: selectedLead.phoneNumber || selectedLead.phone || '',
        propertyAddress: selectedLead.address || '',
        propertyCity: selectedLead.city || '',
        propertyState: selectedLead.state || '',
        propertyZip: selectedLead.zipcode || ''
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);

      // Generate client ID if not provided
      const clientId = formData.clientId || `client_${Date.now()}`;

      // Prepare client data
      const clientData = {
        clientType: formData.clientType,
        clientFirstName: formData.clientFirstName,
        clientLastName: formData.clientLastName,
        clientAddress1: formData.clientAddress1,
        clientAddress2: formData.clientAddress2,
        clientCity: formData.clientCity,
        clientState: formData.clientState,
        clientZip: formData.clientZip,
        clientCellPhone: formData.clientCellPhone,
        clientHomePhone: formData.clientHomePhone,
        clientEmail: formData.clientEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Prepare transaction data (without client info)
      const transactionData = {
        // Lead Information
        leadId: formData.leadId,
        
        // Property Information
        propertyAddress: formData.propertyAddress,
        propertyCity: formData.propertyCity,
        propertyState: formData.propertyState,
        propertyZipcode: formData.propertyZip,
        mlsNumber: formData.mlsNumber,
        
        // Contract Information
        contractDate: formData.contractDate,
        contractPrice: formData.contractPrice,
        
        // Important Dates (24-hour periods)
        sellerDisclosure24a: formData.sellerDisclosure24a,
        dueDiligence24b: formData.dueDiligence24b,
        financing24c: formData.financing24c,
        settlement24d: formData.settlement24d,
        
        // Additional Dates
        inspectionDate: formData.inspectionDate,
        appraisalDate: formData.appraisalDate,
        closingDate: formData.closingDate,
        walkThroughDate: formData.walkThroughDate,
        
        // Transaction Status
        trxnStatus: formData.trxnStatus,
        
        // Company Selections
        selectedInspectorCompany: formData.selectedInspectorCompany,
        selectedAppraiserCompany: formData.selectedAppraiserCompany,
        selectedTitleCompany: formData.selectedTitleCompany,
        selectedMortgageCompany: formData.selectedMortgageCompany,
        selectedOtherAgentCompany: formData.selectedOtherAgentCompany,
        selectedOtherTitleCompany: formData.selectedOtherTitleCompany,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save client data to /users/{userId}/clients/{clientId}/
      await setDoc(doc(db, `users/${currentUser.uid}/clients`, clientId), clientData);

      // Save transaction data nested under client to /users/{userId}/clients/{clientId}/transactions/{transactionId}/
      await addDoc(collection(db, `users/${currentUser.uid}/clients/${clientId}/transactions`), transactionData);

      console.log('Transaction created successfully!');
      router.push('/transactions');
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Transaction</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Lead Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Lead Selection</h3>
              <div>
                <Label htmlFor="leadId">Select Lead (Optional) - {leads.length} contacted leads found</Label>
                <Select 
                  value={formData.leadId} 
                  onValueChange={(value) => handleLeadSelection(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead to auto-populate client info" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No lead selected</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.fullName || lead.name || `Lead ${lead.id}`} - {lead.status || lead.contactStatus || 'Unknown Status'}
                      </SelectItem>
                    ))}
                    {leads.length === 0 && (
                      <SelectItem value="no-leads" disabled>
                        No contacted leads found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientFirstName">First Name</Label>
                  <Input
                    id="clientFirstName"
                    value={formData.clientFirstName}
                    onChange={(e) => handleInputChange('clientFirstName', e.target.value)}
                    placeholder="Enter client first name"
                  />
                </div>
                <div>
                  <Label htmlFor="clientLastName">Last Name</Label>
                  <Input
                    id="clientLastName"
                    value={formData.clientLastName}
                    onChange={(e) => handleInputChange('clientLastName', e.target.value)}
                    placeholder="Enter client last name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientType">Client Type</Label>
                  <Select value={formData.clientType} onValueChange={(value) => handleInputChange('clientType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buyer">Buyer</SelectItem>
                      <SelectItem value="Seller">Seller</SelectItem>
                      <SelectItem value="Renter">Renter</SelectItem>
                      <SelectItem value="Landlord">Landlord</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="Enter client email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientCellPhone">Cell Phone</Label>
                  <Input
                    id="clientCellPhone"
                    value={formData.clientCellPhone}
                    onChange={(e) => handleInputChange('clientCellPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="clientHomePhone">Home Phone</Label>
                  <Input
                    id="clientHomePhone"
                    value={formData.clientHomePhone}
                    onChange={(e) => handleInputChange('clientHomePhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="clientAddress1">Address Line 1</Label>
                <Input
                  id="clientAddress1"
                  value={formData.clientAddress1}
                  onChange={(e) => handleInputChange('clientAddress1', e.target.value)}
                  placeholder="Enter client address"
                />
              </div>
              
              <div>
                <Label htmlFor="clientAddress2">Address Line 2</Label>
                <Input
                  id="clientAddress2"
                  value={formData.clientAddress2}
                  onChange={(e) => handleInputChange('clientAddress2', e.target.value)}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="clientCity">City</Label>
                  <Input
                    id="clientCity"
                    value={formData.clientCity}
                    onChange={(e) => handleInputChange('clientCity', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="clientState">State</Label>
                  <Input
                    id="clientState"
                    value={formData.clientState}
                    onChange={(e) => handleInputChange('clientState', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="clientZip">ZIP Code</Label>
                  <Input
                    id="clientZip"
                    value={formData.clientZip}
                    onChange={(e) => handleInputChange('clientZip', e.target.value)}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Property Information</h3>
              <div>
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                  placeholder="Enter property address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="propertyCity">City</Label>
                  <Input
                    id="propertyCity"
                    value={formData.propertyCity}
                    onChange={(e) => handleInputChange('propertyCity', e.target.value)}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="propertyState">State</Label>
                  <Input
                    id="propertyState"
                    value={formData.propertyState}
                    onChange={(e) => handleInputChange('propertyState', e.target.value)}
                    placeholder="Enter state"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="propertyZip">ZIP Code</Label>
                  <Input
                    id="propertyZip"
                    value={formData.propertyZip}
                    onChange={(e) => handleInputChange('propertyZip', e.target.value)}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mlsNumber">MLS Number</Label>
                <Input
                  id="mlsNumber"
                  value={formData.mlsNumber}
                  onChange={(e) => handleInputChange('mlsNumber', e.target.value)}
                  placeholder="Enter MLS number"
                />
              </div>
            </div>

            {/* Contract Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Contract Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractDate">Contract Date</Label>
                  <Input
                    id="contractDate"
                    type="date"
                    value={formData.contractDate}
                    onChange={(e) => handleInputChange('contractDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contractPrice">Contract Price</Label>
                  <Input
                    id="contractPrice"
                    value={formData.contractPrice}
                    onChange={(e) => handleInputChange('contractPrice', e.target.value)}
                    placeholder="Enter contract price"
                    type="number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="trxnStatus">Transaction Status</Label>
                <Select value={formData.trxnStatus} onValueChange={(value) => handleInputChange('trxnStatus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Under Contract">Under Contract</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Important Deadlines (24-hour periods) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Important Deadlines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sellerDisclosure24a">Seller Disclosure Deadline (24A)</Label>
                  <Input
                    id="sellerDisclosure24a"
                    type="date"
                    value={formData.sellerDisclosure24a}
                    onChange={(e) => handleInputChange('sellerDisclosure24a', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDiligence24b">Due Diligence Deadline (24B)</Label>
                  <Input
                    id="dueDiligence24b"
                    type="date"
                    value={formData.dueDiligence24b}
                    onChange={(e) => handleInputChange('dueDiligence24b', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financing24c">Financing & Appraisal Deadline (24C)</Label>
                  <Input
                    id="financing24c"
                    type="date"
                    value={formData.financing24c}
                    onChange={(e) => handleInputChange('financing24c', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="settlement24d">Settlement Deadline (24D)</Label>
                  <Input
                    id="settlement24d"
                    type="date"
                    value={formData.settlement24d}
                    onChange={(e) => handleInputChange('settlement24d', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Service Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Service Dates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspectionDate">Inspection Date</Label>
                  <Input
                    id="inspectionDate"
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="appraisalDate">Appraisal Date</Label>
                  <Input
                    id="appraisalDate"
                    type="date"
                    value={formData.appraisalDate}
                    onChange={(e) => handleInputChange('appraisalDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="closingDate">Closing Date</Label>
                  <Input
                    id="closingDate"
                    type="date"
                    value={formData.closingDate}
                    onChange={(e) => handleInputChange('closingDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="walkThroughDate">Final Walk-Through Date</Label>
                  <Input
                    id="walkThroughDate"
                    type="date"
                    value={formData.walkThroughDate}
                    onChange={(e) => handleInputChange('walkThroughDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Company Selections */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Professional Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="selectedInspectorCompany">Inspector Company</Label>
                  <Select 
                    value={formData.selectedInspectorCompany} 
                    onValueChange={(value) => handleInputChange('selectedInspectorCompany', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select inspector company" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectorCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                      {inspectorCompanies.length === 0 && (
                        <SelectItem value="no-inspector-companies" disabled>
                          No inspector companies found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="selectedAppraiserCompany">Appraiser Company</Label>
                  <Select 
                    value={formData.selectedAppraiserCompany} 
                    onValueChange={(value) => handleInputChange('selectedAppraiserCompany', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select appraiser company" />
                    </SelectTrigger>
                    <SelectContent>
                      {appraiserCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                      {appraiserCompanies.length === 0 && (
                        <SelectItem value="no-appraiser-companies" disabled>
                          No appraiser companies found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="selectedTitleCompany">Title Company</Label>
                  <Select 
                    value={formData.selectedTitleCompany} 
                    onValueChange={(value) => handleInputChange('selectedTitleCompany', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title company" />
                    </SelectTrigger>
                    <SelectContent>
                      {titleCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                      {titleCompanies.length === 0 && (
                        <SelectItem value="no-title-companies" disabled>
                          No title companies found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="selectedMortgageCompany">Mortgage Company</Label>
                  <Select 
                    value={formData.selectedMortgageCompany} 
                    onValueChange={(value) => handleInputChange('selectedMortgageCompany', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mortgage company" />
                    </SelectTrigger>
                    <SelectContent>
                      {mortgageCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                      {mortgageCompanies.length === 0 && (
                        <SelectItem value="no-mortgage-companies" disabled>
                          No mortgage companies found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="selectedOtherAgentCompany">Other Agent Company</Label>
                  <Input
                    id="selectedOtherAgentCompany"
                    value={formData.selectedOtherAgentCompany}
                    onChange={(e) => handleInputChange('selectedOtherAgentCompany', e.target.value)}
                    placeholder="Enter other agent company name"
                  />
                </div>
                <div>
                  <Label htmlFor="selectedOtherTitleCompany">Other Title Company</Label>
                  <Input
                    id="selectedOtherTitleCompany"
                    value={formData.selectedOtherTitleCompany}
                    onChange={(e) => handleInputChange('selectedOtherTitleCompany', e.target.value)}
                    placeholder="Enter other title company name"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Creating...' : 'Create Transaction'}
              </Button>
              <Link href="/transactions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
