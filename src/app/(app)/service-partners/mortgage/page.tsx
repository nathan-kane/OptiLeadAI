'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { Plus, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface MortgageCompany {
  id: string;
  mortgageCompanyName: string;
  primaryContact: string;
  city: string;
  mortgageCompanyState: string;
  cellPhone?: string;
  officePhone?: string;
  email?: string;
  website?: string;
  address1?: string;
  address2?: string;
  zip?: string;
}

export default function MortgageCompaniesPage() {
  const [mortgageCompanies, setMortgageCompanies] = useState<MortgageCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchMortgageCompanies();
    }
  }, [user]);

  const fetchMortgageCompanies = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        console.error('No user ID available');
        return;
      }
      
      const mortgageCompaniesRef = collection(db, 'users', user.uid, 'mortgage');
      const q = query(mortgageCompaniesRef, orderBy('mortgageCompanyName'));
      const querySnapshot = await getDocs(q);
      
      const companies: MortgageCompany[] = [];
      querySnapshot.forEach((doc) => {
        companies.push({
          id: doc.id,
          ...doc.data()
        } as MortgageCompany);
      });
      
      setMortgageCompanies(companies);
    } catch (error) {
      console.error('Error fetching mortgage companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (companyId: string) => {
    router.push(`/service-partners/mortgage/${companyId}`);
  };

  const handleAddNew = () => {
    router.push('/service-partners/mortgage/new');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="bg-gradient-to-r from-blue-100 to-green-100 px-6 py-3 rounded-2xl inline-block">
              <Skeleton className="h-8 w-64 mb-2 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-96 rounded-xl mt-2" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-32 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-xl" />
                  </div>
                  <Skeleton className="h-4 w-32 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageHeader
                  title="Mortgage Companies"
                  description="Manage your mortgage company partners."
                />
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold uppercase hover:scale-105 transition-all duration-200">
          <Plus className="h-4 w-4" />
          Add New Company
        </Button>
      </div>

      {mortgageCompanies.length === 0 ? (
        <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <Building2 className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No mortgage companies found</h3>
            <p className="text-slate-600 text-center mb-6">
              Get started by adding your first mortgage company partner.
            </p>
            <Button onClick={handleAddNew} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold uppercase hover:scale-105 transition-all duration-200">
              <Plus className="h-4 w-4" />
              Add First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="px-2 sm:px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900">Mortgage Companies</CardTitle>
            <CardDescription className="text-base sm:text-lg text-slate-600">
              Showing {mortgageCompanies.length} mortgage company partners. Manage your lending network.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 py-4">
            <div className="grid gap-6">
              {mortgageCompanies.map((company) => (
                <Card 
                  key={company.id} 
                  className="cursor-pointer shadow-lg border border-gray-200 bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                  onClick={() => handleCompanyClick(company.id)}
                >
                  <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-extrabold text-slate-900 hover:text-blue-600 transition-colors">
                        {company.mortgageCompanyName || 'N/A'}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {company.city || 'N/A'}, {company.mortgageCompanyState || 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {company.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-700">{company.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2 rounded-full border-2 border-blue-200 text-blue-700">
                      Primary Contact
                    </Badge>
                    <p className="text-sm font-semibold text-slate-900 mb-4">
                      {company.primaryContact || 'N/A'}
                    </p>
                    <div className="space-y-2">
                      {company.cellPhone && (
                        <div className="flex items-center justify-end gap-1 text-sm">
                          <span className="font-medium text-slate-700">Cell: {company.cellPhone}</span>
                          <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                      {company.officePhone && (
                        <div className="flex items-center justify-end gap-1 text-sm">
                          <span className="font-medium text-slate-700">Office: {company.officePhone}</span>
                          <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
