'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ClipboardCheck, Phone, Mail, MapPin } from 'lucide-react';

interface InspectorCompany {
  id: string;
  inspectorCompanyName: string;
  primaryContact: string;
  city: string;
  inspectorCompanyState: string;
  cellPhone?: string;
  officePhone?: string;
  email?: string;
  website?: string;
  address1?: string;
  address2?: string;
  zip?: string;
}

export default function InspectorsPage() {
  const [inspectorCompanies, setInspectorCompanies] = useState<InspectorCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchInspectorCompanies();
    }
  }, [user]);

  const fetchInspectorCompanies = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        console.error('No user ID available');
        return;
      }
      
      const inspectorCompaniesRef = collection(db, 'users', user.uid, 'inspectorCompany');
      const q = query(inspectorCompaniesRef, orderBy('inspectorCompanyName'));
      const querySnapshot = await getDocs(q);
      
      const companies: InspectorCompany[] = [];
      querySnapshot.forEach((doc) => {
        companies.push({
          id: doc.id,
          ...doc.data()
        } as InspectorCompany);
      });
      
      setInspectorCompanies(companies);
    } catch (error) {
      console.error('Error fetching inspector companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (companyId: string) => {
    router.push(`/service-partners/inspectors/${companyId}`);
  };

  const handleAddNew = () => {
    router.push('/service-partners/inspectors/new');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-4 w-32" />
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspectors</h1>
          <p className="text-muted-foreground">
            Manage your network of inspector partners
          </p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Inspector
        </Button>
      </div>

      {inspectorCompanies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inspectors found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first inspector partner.
            </p>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Inspector
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {inspectorCompanies.map((company) => (
            <Card 
              key={company.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCompanyClick(company.id)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-blue-600">
                        {company.inspectorCompanyName || 'N/A'}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {company.city || 'N/A'}, {company.inspectorCompanyState || 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {company.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{company.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2">
                      Primary Contact
                    </Badge>
                    <p className="text-sm font-medium mb-4">
                      {company.primaryContact || 'N/A'}
                    </p>
                    <div className="space-y-2">
                      {company.cellPhone && (
                        <div className="flex items-center justify-end gap-1 text-sm">
                          <span className="font-medium">Cell: {company.cellPhone}</span>
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {company.officePhone && (
                        <div className="flex items-center justify-end gap-1 text-sm">
                          <span className="font-medium">Office: {company.officePhone}</span>
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
