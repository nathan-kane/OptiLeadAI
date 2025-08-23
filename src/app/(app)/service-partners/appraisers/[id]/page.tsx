'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2, Search } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

interface AppraiserCompanyData {
  appraiserCompanyName: string;
  primaryContact: string;
  address1: string;
  address2: string;
  city: string;
  appraiserCompanyState: string;
  zip: string;
  cellPhone: string;
  officePhone: string;
  email: string;
  website: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function AppraiserCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isNew = params.id === 'new';
  const companyId = params.id as string;

  const [formData, setFormData] = useState<AppraiserCompanyData>({
    appraiserCompanyName: '',
    primaryContact: '',
    address1: '',
    address2: '',
    city: '',
    appraiserCompanyState: '',
    zip: '',
    cellPhone: '',
    officePhone: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    if (!isNew && user) {
      fetchAppraiserCompany();
    }
  }, [isNew, user, companyId]);

  const fetchAppraiserCompany = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        console.error('No user ID available');
        return;
      }
      
      const docRef = doc(db, 'users', user.uid, 'appraiserCompany', companyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as AppraiserCompanyData;
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching appraiser company:', error);
      alert('Error loading appraiser company data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AppraiserCompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneChange = (field: 'cellPhone' | 'officePhone', value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange(field, formatted);
  };

  const handleSave = async () => {
    if (!formData.appraiserCompanyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    if (!user?.uid) {
      alert('User not authenticated');
      return;
    }

    try {
      setSaving(true);
      
      if (isNew) {
        const docRef = doc(db, 'users', user.uid, 'appraiserCompany', crypto.randomUUID());
        await setDoc(docRef, formData);
        console.log('New appraiser company created');
      } else {
        const docRef = doc(db, 'users', user.uid, 'appraiserCompany', companyId);
        await updateDoc(docRef, formData as any);
        console.log('Appraiser company updated');
      }
      
      router.push('/service-partners/appraisers');
    } catch (error) {
      console.error('Error saving appraiser company:', error);
      alert('Error saving appraiser company');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appraiser company? This action cannot be undone.')) {
      return;
    }

    if (!user?.uid) {
      alert('User not authenticated');
      return;
    }

    try {
      setDeleting(true);
      const docRef = doc(db, 'users', user.uid, 'appraiserCompany', companyId);
      await deleteDoc(docRef);
      console.log('Appraiser company deleted');
      router.push('/service-partners/appraisers');
    } catch (error) {
      console.error('Error deleting appraiser company:', error);
      alert('Error deleting appraiser company');
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    router.push('/service-partners/appraisers');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title={isNew ? 'Add New Appraiser' : 'Edit Appraiser'}
        description={isNew ? 'Create a new appraiser profile' : 'Update appraiser information'}
        actions={
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100">
          <CardTitle className="flex items-center gap-2 font-extrabold text-slate-900 tracking-tight">
            <Search className="h-5 w-5" />
            Appraiser Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="appraiserCompanyName">Company Name *</Label>
            <Input
              id="appraiserCompanyName"
              value={formData.appraiserCompanyName}
              onChange={(e) => handleInputChange('appraiserCompanyName', e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryContact">Primary Contact</Label>
            <Input
              id="primaryContact"
              value={formData.primaryContact}
              onChange={(e) => handleInputChange('primaryContact', e.target.value)}
              placeholder="Enter primary contact name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input
                id="address1"
                value={formData.address1}
                onChange={(e) => handleInputChange('address1', e.target.value)}
                placeholder="Enter street address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input
                id="address2"
                value={formData.address2}
                onChange={(e) => handleInputChange('address2', e.target.value)}
                placeholder="Suite, unit, etc. (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appraiserCompanyState">State</Label>
              <Select 
                value={formData.appraiserCompanyState} 
                onValueChange={(value) => handleInputChange('appraiserCompanyState', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                placeholder="Enter ZIP code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cellPhone">Cell Phone</Label>
              <Input
                id="cellPhone"
                value={formData.cellPhone}
                onChange={(e) => handlePhoneChange('cellPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officePhone">Office Phone</Label>
              <Input
                id="officePhone"
                value={formData.officePhone}
                onChange={(e) => handlePhoneChange('officePhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <div>
              {!isNew && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete Appraiser'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Appraiser'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
