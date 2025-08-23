"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import type { Client } from '@/types';
import { ArrowLeft, Save, Trash2, User, Mail, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ClientDetailPage() {
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'Active',
    notes: '',
    preferredContactMethod: 'email',
    dateOfBirth: '',
    occupation: '',
    company: ''
  });

  useEffect(() => {
    if (authLoading || !clientId) return;

    if (!userId) {
      console.log("ClientDetailPage: User is NOT authenticated.");
      setIsLoading(false);
      return;
    }

    console.log("ClientDetailPage: Setting up Firestore listener for client:", clientId);
    
    // Fetch client from user-scoped collection: users/{userId}/clients/{clientId}
    const clientRef = doc(db, "users", userId, "clients", clientId);
    
    const unsubscribeSnapshot = onSnapshot(clientRef, (doc) => {
      if (doc.exists()) {
        const clientData = { id: doc.id, ...doc.data() } as Client;
        console.log("ClientDetailPage: Fetched client data:", clientData);
        setClient(clientData);
        setFormData({
          name: `${clientData.clientFirstName || ''} ${clientData.clientLastName || ''}`.trim() || clientData.name || '',
          email: clientData.clientEmail || clientData.email || '',
          phone: clientData.clientCellPhone || clientData.clientHomePhone || clientData.phone || '',
          address: clientData.clientAddress || clientData.address || '',
          city: clientData.clientCity || clientData.city || '',
          state: clientData.clientState || clientData.state || '',
          zipCode: clientData.clientZipCode || clientData.zipCode || '',
          status: clientData.status || 'Active',
          notes: clientData.notes || '',
          preferredContactMethod: clientData.preferredContactMethod || 'email',
          dateOfBirth: clientData.dateOfBirth || '',
          occupation: clientData.occupation || '',
          company: clientData.company || ''
        });
      } else {
        console.log("ClientDetailPage: Client not found");
        toast({
          variant: "destructive",
          title: "Client Not Found",
          description: "The requested client could not be found.",
        });
        router.push('/clients');
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching client:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Could not fetch client data from the database." 
      });
      setIsLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [userId, authLoading, clientId, toast, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!userId || !clientId) {
      toast({
        title: "Error",
        description: "User not authenticated or client ID missing.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Client name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const clientRef = doc(db, "users", userId, "clients", clientId);
      
      // Parse the name field back into first and last name
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await updateDoc(clientRef, {
        clientFirstName: firstName,
        clientLastName: lastName,
        clientEmail: formData.email,
        clientCellPhone: formData.phone,
        clientAddress: formData.address,
        clientCity: formData.city,
        clientState: formData.state,
        clientZipCode: formData.zipCode,
        status: formData.status,
        notes: formData.notes,
        preferredContactMethod: formData.preferredContactMethod,
        dateOfBirth: formData.dateOfBirth,
        occupation: formData.occupation,
        company: formData.company,
        updatedAt: new Date(),
      });

      toast({
        title: "Client Updated",
        description: `${formData.name} has been successfully updated.`,
        variant: "default",
      });

      setHasChanges(false);
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !clientId) return;

    try {
      const clientRef = doc(db, "users", userId, "clients", clientId);
      await deleteDoc(clientRef);

      toast({
        title: "Client Deleted",
        description: `${formData.name} has been successfully deleted.`,
        variant: "default",
      });

      router.push('/clients');
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p>Client not found.</p>
          <Button onClick={() => router.push('/clients')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageHeader
            title={`Client: ${formData.name || 'Unnamed Client'}`}
            description="View and edit client information."
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/clients')} className="rounded-full border-2 border-gray-200 hover:border-blue-400 transition-all duration-200">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold uppercase hover:scale-105 transition-all duration-200"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold uppercase hover:scale-105 transition-all duration-200">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Client
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the client
                  "{formData.name}" and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete Client
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100">
            <CardTitle className="flex items-center font-extrabold text-slate-900 tracking-tight">
              <User className="mr-2 h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Primary client details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter client's full name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Past Client">Past Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
              <Select value={formData.preferredContactMethod} onValueChange={(value) => handleInputChange('preferredContactMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="mail">Mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100">
            <CardTitle className="flex items-center font-extrabold text-slate-900 tracking-tight">
              <MapPin className="mr-2 h-5 w-5" />
              Address Information
            </CardTitle>
            <CardDescription>
              Client's physical address and location details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100">
            <CardTitle className="flex items-center font-extrabold text-slate-900 tracking-tight">
              <FileText className="mr-2 h-5 w-5" />
              Additional Information
            </CardTitle>
            <CardDescription>
              Extra details and personal information about the client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Client's job title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100">
            <CardTitle className="flex items-center font-extrabold text-slate-900 tracking-tight">
              <FileText className="mr-2 h-5 w-5" />
              Notes
            </CardTitle>
            <CardDescription>
              Additional notes and comments about the client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="notes">Client Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this client..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Metadata */}
      <Card className="mt-6">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-green-100">
          <CardTitle className="flex items-center font-extrabold text-slate-900 tracking-tight">
            <Calendar className="mr-2 h-5 w-5" />
            Client History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <strong>Created:</strong> {client.createdAt ? new Date(client.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
            </div>
            <div>
              <strong>Last Updated:</strong> {client.updatedAt ? new Date(client.updatedAt.seconds * 1000).toLocaleString() : 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
