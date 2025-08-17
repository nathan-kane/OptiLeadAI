"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, MapPin, DollarSign, Calendar, Hash, Building, Phone, Mail, Save } from 'lucide-react';
import Link from 'next/link';

interface ClientData {
  clientId: string;
  clientType: string;
  clientFirstName: string;
  clientLastName: string;
  clientAddress1: string;
  clientAddress2?: string;
  clientCity: string;
  clientState: string;
  clientZip: string;
  clientCellPhone: string;
  clientHomePhone?: string;
  clientEmail: string;
  createdAt?: any;
  updatedAt?: any;
}

interface TransactionDetail {
  id: string;
  leadId?: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZipcode: string;
  mlsNumber: string;
  contractDate: string;
  contractPrice: string;
  sellerDisclosure24a?: string;
  dueDiligence24b?: string;
  financing24c?: string;
  settlement24d?: string;
  inspectionDate?: string;
  appraisalDate?: string;
  closingDate?: string;
  walkThroughDate?: string;
  trxnStatus: string;
  selectedInspectorCompany?: string;
  selectedAppraiserCompany?: string;
  selectedTitleCompany?: string;
  selectedMortgageCompany?: string;
  selectedOtherAgentCompany?: string;
  selectedOtherTitleCompany?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface ServicePartner {
  id: string;
  name: string;
}

export default function TransactionDetailPage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientData | null>(null);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Service Partner Lists
  const [mortgageCompanies, setMortgageCompanies] = useState<ServicePartner[]>([]);
  const [titleCompanies, setTitleCompanies] = useState<ServicePartner[]>([]);
  const [appraiserCompanies, setAppraiserCompanies] = useState<ServicePartner[]>([]);
  const [inspectorCompanies, setInspectorCompanies] = useState<ServicePartner[]>([]);

  // Get clientId and transactionId from URL params
  const clientId = params.clientId as string;
  const transactionId = params.transactionId as string;

  // Format currency
  const formatCurrency = (textCurrency: string): string => {
    if (!textCurrency) return "$0.00";
    
    const numericCurrency = textCurrency.replace(/[^\d]/g, '');
    if (numericCurrency) {
      const value = parseFloat(numericCurrency) / 100;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    return "$0.00";
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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

  // Fetch client data from /users/{userId}/clients/{clientId}/
  const fetchClient = async () => {
    if (!currentUser || !clientId) return;

    try {
      const clientDoc = await getDoc(
        doc(db, `users/${currentUser.uid}/clients`, clientId)
      );

      if (clientDoc.exists()) {
        const data = clientDoc.data();
        setClient({
          clientId: clientDoc.id,
          ...data
        } as ClientData);
      } else {
        setError('Client not found');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      setError('Failed to load client data');
    }
  };

  // Fetch transaction details from /users/{userId}/clients/{clientId}/transactions/{transactionId}/
  const fetchTransaction = async () => {
    if (!currentUser || !clientId || !transactionId) return;

    try {
      setLoading(true);
      setError(null);

      const transactionDoc = await getDoc(
        doc(db, `users/${currentUser.uid}/clients/${clientId}/transactions`, transactionId)
      );

      if (transactionDoc.exists()) {
        const data = transactionDoc.data();
        setTransaction({
          id: transactionDoc.id,
          ...data
        } as TransactionDetail);
      } else {
        setError('Transaction not found');
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      setError('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for client data
  const handleClientChange = (field: string, value: string) => {
    if (!client) return;
    setClient(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  // Handle input changes for transaction data
  const handleTransactionChange = (field: string, value: string) => {
    if (!transaction) return;
    // Convert "none" to empty string for service partner fields
    const finalValue = value === "none" ? "" : value;
    setTransaction(prev => ({
      ...prev!,
      [field]: finalValue
    }));
  };

  // Save transaction changes to nested structure
  const handleSave = async () => {
    if (!currentUser || !client || !transaction) return;

    try {
      setSaving(true);
      
      // Update client data at /users/{userId}/clients/{clientId}/
      const { clientId: clientDocId, createdAt: clientCreatedAt, ...clientUpdateData } = client;
      await updateDoc(doc(db, `users/${currentUser.uid}/clients`, clientId), {
        ...clientUpdateData,
        updatedAt: new Date()
      });

      // Update transaction data at /users/{userId}/clients/{clientId}/transactions/{transactionId}/
      const { id: transactionDocId, createdAt: transactionCreatedAt, ...transactionUpdateData } = transaction;
      await updateDoc(doc(db, `users/${currentUser.uid}/clients/${clientId}/transactions`, transactionId), {
        ...transactionUpdateData,
        updatedAt: new Date()
      });
      
      alert('Transaction updated successfully!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchClient();
      fetchTransaction();
      fetchServicePartners();
    }
  }, [currentUser, clientId, transactionId]);

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper functions to get company names by ID
  const getCompanyName = (companyId: string, companyList: ServicePartner[]) => {
    const company = companyList.find(c => c.id === companyId);
    return company?.name || companyId;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !client || !transaction) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transactions
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Transaction Not Found'}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              The transaction you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/transactions">
              <Button>Back to Transactions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Transaction</h1>
        <Badge className={getStatusColor(transaction.trxnStatus)}>
          {transaction.trxnStatus}
        </Badge>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="clientFirstName">First Name</Label>
                    <Input
                      id="clientFirstName"
                      value={client.clientFirstName || ''}
                      onChange={(e) => handleClientChange('clientFirstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientLastName">Last Name</Label>
                    <Input
                      id="clientLastName"
                      value={client.clientLastName || ''}
                      onChange={(e) => handleClientChange('clientLastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientType">Client Type</Label>
                  <Input
                    id="clientType"
                    value={client.clientType || ''}
                    onChange={(e) => handleClientChange('clientType', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="clientCellPhone">Cell Phone</Label>
                  <Input
                    id="clientCellPhone"
                    value={client.clientCellPhone || ''}
                    onChange={(e) => handleClientChange('clientCellPhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="clientHomePhone">Home Phone</Label>
                  <Input
                    id="clientHomePhone"
                    value={client.clientHomePhone || ''}
                    onChange={(e) => handleClientChange('clientHomePhone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={client.clientEmail || ''}
                    onChange={(e) => handleClientChange('clientEmail', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="font-medium">Client Address</h5>
                <div>
                  <Label htmlFor="clientAddress1">Address Line 1</Label>
                  <Input
                    id="clientAddress1"
                    value={client.clientAddress1 || ''}
                    onChange={(e) => handleClientChange('clientAddress1', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="clientAddress2">Address Line 2</Label>
                  <Input
                    id="clientAddress2"
                    value={client.clientAddress2 || ''}
                    onChange={(e) => handleClientChange('clientAddress2', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="clientCity">City</Label>
                    <Input
                      id="clientCity"
                      value={client.clientCity || ''}
                      onChange={(e) => handleClientChange('clientCity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientState">State</Label>
                    <Input
                      id="clientState"
                      value={client.clientState || ''}
                      onChange={(e) => handleClientChange('clientState', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="clientZip">ZIP Code</Label>
                  <Input
                    id="clientZip"
                    value={client.clientZip || ''}
                    onChange={(e) => handleClientChange('clientZip', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="propertyAddress">Property Address</Label>
                  <Input
                    id="propertyAddress"
                    value={transaction.propertyAddress || ''}
                    onChange={(e) => handleTransactionChange('propertyAddress', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="propertyCity">City</Label>
                    <Input
                      id="propertyCity"
                      value={transaction.propertyCity || ''}
                      onChange={(e) => handleTransactionChange('propertyCity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="propertyState">State</Label>
                    <Input
                      id="propertyState"
                      value={transaction.propertyState || ''}
                      onChange={(e) => handleTransactionChange('propertyState', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="propertyZipcode">ZIP Code</Label>
                  <Input
                    id="propertyZipcode"
                    value={transaction.propertyZipcode || ''}
                    onChange={(e) => handleTransactionChange('propertyZipcode', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div>
                  <Label htmlFor="mlsNumber">MLS Number</Label>
                  <Input
                    id="mlsNumber"
                    value={transaction.mlsNumber || ''}
                    onChange={(e) => handleTransactionChange('mlsNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractPrice">Contract Price</Label>
                <Input
                  id="contractPrice"
                  value={transaction.contractPrice || ''}
                  onChange={(e) => handleTransactionChange('contractPrice', e.target.value)}
                  placeholder="Enter contract price"
                />
              </div>
              <div>
                <Label htmlFor="contractDate">Contract Date</Label>
                <Input
                  id="contractDate"
                  type="date"
                  value={transaction.contractDate || ''}
                  onChange={(e) => handleTransactionChange('contractDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sellerDisclosure24a">Seller Disclosure (24A)</Label>
                <Input
                  id="sellerDisclosure24a"
                  type="date"
                  value={transaction.sellerDisclosure24a || ''}
                  onChange={(e) => handleTransactionChange('sellerDisclosure24a', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueDiligence24b">Due Diligence (24B)</Label>
                <Input
                  id="dueDiligence24b"
                  type="date"
                  value={transaction.dueDiligence24b || ''}
                  onChange={(e) => handleTransactionChange('dueDiligence24b', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="financing24c">Financing (24C)</Label>
                <Input
                  id="financing24c"
                  type="date"
                  value={transaction.financing24c || ''}
                  onChange={(e) => handleTransactionChange('financing24c', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="settlement24d">Settlement (24D)</Label>
                <Input
                  id="settlement24d"
                  type="date"
                  value={transaction.settlement24d || ''}
                  onChange={(e) => handleTransactionChange('settlement24d', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="inspectionDate">Inspection Date</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={transaction.inspectionDate || ''}
                  onChange={(e) => handleTransactionChange('inspectionDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="appraisalDate">Appraisal Date</Label>
                <Input
                  id="appraisalDate"
                  type="date"
                  value={transaction.appraisalDate || ''}
                  onChange={(e) => handleTransactionChange('appraisalDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="closingDate">Closing Date</Label>
                <Input
                  id="closingDate"
                  type="date"
                  value={transaction.closingDate || ''}
                  onChange={(e) => handleTransactionChange('closingDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="walkThroughDate">Walk Through Date</Label>
                <Input
                  id="walkThroughDate"
                  type="date"
                  value={transaction.walkThroughDate || ''}
                  onChange={(e) => handleTransactionChange('walkThroughDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Partners */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Service Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="selectedInspectorCompany">Inspector Company</Label>
                <Select
                  value={transaction.selectedInspectorCompany || ''}
                  onValueChange={(value) => handleTransactionChange('selectedInspectorCompany', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select inspector company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {inspectorCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="selectedAppraiserCompany">Appraiser Company</Label>
                <Select
                  value={transaction.selectedAppraiserCompany || ''}
                  onValueChange={(value) => handleTransactionChange('selectedAppraiserCompany', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select appraiser company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {appraiserCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="selectedTitleCompany">Title Company</Label>
                <Select
                  value={transaction.selectedTitleCompany || ''}
                  onValueChange={(value) => handleTransactionChange('selectedTitleCompany', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select title company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {titleCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="selectedMortgageCompany">Mortgage Company</Label>
                <Select
                  value={transaction.selectedMortgageCompany || ''}
                  onValueChange={(value) => handleTransactionChange('selectedMortgageCompany', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mortgage company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {mortgageCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="selectedOtherAgentCompany">Other Agent Company</Label>
                <Input
                  id="selectedOtherAgentCompany"
                  value={transaction.selectedOtherAgentCompany || ''}
                  onChange={(e) => handleTransactionChange('selectedOtherAgentCompany', e.target.value)}
                  placeholder="Enter other agent company"
                />
              </div>
              <div>
                <Label htmlFor="selectedOtherTitleCompany">Other Title Company</Label>
                <Input
                  id="selectedOtherTitleCompany"
                  value={transaction.selectedOtherTitleCompany || ''}
                  onChange={(e) => handleTransactionChange('selectedOtherTitleCompany', e.target.value)}
                  placeholder="Enter other title company"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Information */}
        {transaction.leadId && (
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Linked to Lead</Badge>
                <span className="text-sm text-gray-600">Lead ID: {transaction.leadId}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
