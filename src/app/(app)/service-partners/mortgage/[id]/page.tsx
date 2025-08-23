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
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, Save, Trash2, Building2 } from 'lucide-react';

interface MortgageCompanyData {
  mortgageCompanyName: string;
  primaryContact: string;
  address1: string;
  address2: string;
  city: string;
  mortgageCompanyState: string;
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

export default function MortgageCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isNew = params.id === 'new';
  const companyId = params.id as string;

  const [formData, setFormData] = useState<MortgageCompanyData>({
    mortgageCompanyName: '',
    primaryContact: '',
    address1: '',
    address2: '',
    city: '',
    mortgageCompanyState: '',
    zip: '',
    cellPhone: '',
    officePhone: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    if (!isNew && user) {
      fetchMortgageCompany();
    }
  }, [isNew, user, companyId]);

  const fetchMortgageCompany = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        console.error('No user ID available');
        return;
      }
      
      const docRef = doc(db, 'users', user.uid, 'mortgage', companyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as MortgageCompanyData;
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching mortgage company:', error);
      alert('Error loading mortgage company data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MortgageCompanyData, value: string) => {
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
    if (!formData.mortgageCompanyName.trim()) {
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
        // Create new document with auto-generated ID
        const docRef = doc(db, 'users', user.uid, 'mortgage', crypto.randomUUID());
        await setDoc(docRef, formData);
        console.log('New mortgage company created');
      } else {
        // Update existing document
        const docRef = doc(db, 'users', user.uid, 'mortgage', companyId);
        await updateDoc(docRef, formData as any);
        console.log('Mortgage company updated');
      }
      
      router.push('/service-partners/mortgage');
    } catch (error) {
      console.error('Error saving mortgage company:', error);
      alert('Error saving mortgage company');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this mortgage company? This action cannot be undone.')) {
      return;
    }

    if (!user?.uid) {
      alert('User not authenticated');
      return;
    }

    try {
      setDeleting(true);
      const docRef = doc(db, 'users', user.uid, 'mortgage', companyId);
      await deleteDoc(docRef);
      console.log('Mortgage company deleted');
      router.push('/service-partners/mortgage');
    } catch (error) {
      console.error('Error deleting mortgage company:', error);
      alert('Error deleting mortgage company');
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    router.push('/service-partners/mortgage');
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
        title={isNew ? 'Add New Mortgage Company' : 'Edit Mortgage Company'}
        description={isNew ? 'Create a new mortgage company profile' : 'Update mortgage company information'}
        actions={
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100">
          <CardTitle className="flex items-center gap-2 font-extrabold text-slate-900 tracking-tight">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="mortgageCompanyName">Company Name *</Label>
            <Input
              id="mortgageCompanyName"
              value={formData.mortgageCompanyName}
              onChange={(e) => handleInputChange('mortgageCompanyName', e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          {/* Primary Contact */}
          <div className="space-y-2">
            <Label htmlFor="primaryContact">Primary Contact</Label>
            <Input
              id="primaryContact"
              value={formData.primaryContact}
              onChange={(e) => handleInputChange('primaryContact', e.target.value)}
              placeholder="Enter primary contact name"
            />
          </div>

          {/* Address Section */}
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
              <Label htmlFor="mortgageCompanyState">State</Label>
              <Select 
                value={formData.mortgageCompanyState} 
                onValueChange={(value) => handleInputChange('mortgageCompanyState', value)}
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

          {/* Contact Information */}
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

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {!isNew && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold uppercase hover:scale-105 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete Company'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="rounded-full border-2 border-gray-200 hover:border-blue-400 transition-all duration-200">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold uppercase hover:scale-105 transition-all duration-200">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Company'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
