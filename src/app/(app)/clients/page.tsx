"use client";

import type { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, Plus, User, Phone, Mail, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ClientsPage() {
  const { toast } = useToast();
  const { userId, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'Active'
  });
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      console.log("ClientsPage: User is NOT authenticated.");
      setIsLoading(false);
      setClients([]);
      return;
    }

    console.log("ClientsPage: User authenticated. Setting up Firestore listener for user:", userId);
    console.log("ClientsPage: Expected database path:", `users/${userId}/clients`);
    console.log("ClientsPage: Setting up query with orderBy createdAt...");
    
    // Try without orderBy first to see if that's causing issues
    const clientsQuery = query(
      collection(db, "users", userId, "clients")
    );
    
    const unsubscribeSnapshot = onSnapshot(clientsQuery, (snapshot) => {
      console.log("ClientsPage: Snapshot received, docs count:", snapshot.docs.length);
      console.log("ClientsPage: Snapshot empty?", snapshot.empty);
      console.log("ClientsPage: Raw snapshot docs:", snapshot.docs);
      
      const clientsData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("ClientsPage: Processing doc:", doc.id, "with data:", data);
        return { id: doc.id, ...data } as any;
      });
      
      console.log("ClientsPage: Fetched", clientsData.length, "clients for user:", userId);
      console.log("ClientsPage: Final client data:", clientsData);
      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching user clients:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Full error object:", error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: `Could not fetch clients: ${error.message}` 
      });
      setIsLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [userId, authLoading, toast]);

  const handleAddClient = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    if (!newClient.name.trim()) {
      toast({
        title: "Error",
        description: "Client name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const clientData = {
        ...newClient,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "users", userId, "clients"), clientData);

      toast({
        title: "Client Added",
        description: `${newClient.name} has been successfully added.`,
        variant: "default",
      });

      // Reset form
      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        status: 'Active'
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        title: "Add Failed",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(client =>
    client.clientFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.clientCellPhone?.includes(searchTerm) ||
    client.clientHomePhone?.includes(searchTerm)
  );

  const handleClientClick = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <PageHeader
            title="Clients Dashboard"
            description="Manage your client relationships and information."
          />
        </div>
      </div>

      {/* Search and Add Client */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
          />
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold uppercase hover:scale-105 transition-all duration-200">
              <Plus className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-0 shadow-xl">
            <DialogHeader className="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-t-2xl border-b border-gray-100">
              <DialogTitle className="text-xl font-extrabold text-slate-900">Add New Client</DialogTitle>
              <DialogDescription className="text-slate-600">
                Enter the client's information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 p-6">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  className="col-span-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  City
                </Label>
                <Input
                  id="city"
                  value={newClient.city}
                  onChange={(e) => setNewClient(prev => ({ ...prev, city: e.target.value }))}
                  className="col-span-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="state" className="text-right">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={newClient.state}
                    onChange={(e) => setNewClient(prev => ({ ...prev, state: e.target.value }))}
                    className="col-span-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="zipCode" className="text-right">
                    Zip
                  </Label>
                  <Input
                    id="zipCode"
                    value={newClient.zipCode}
                    onChange={(e) => setNewClient(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="col-span-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <Button type="submit" onClick={handleAddClient} className="rounded-full bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold uppercase hover:scale-105 transition-all duration-200">
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients Table */}
      <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="px-6 py-6 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
          <CardTitle className="text-2xl font-extrabold text-slate-900">Clients</CardTitle>
          <CardDescription className="text-base text-slate-600">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Email</TableHead>
                  <TableHead className="text-xs sm:text-sm">Phone</TableHead>
                  <TableHead className="text-xs sm:text-sm">Location</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      {searchTerm ? 'No clients found matching your search.' : 'No clients found. Add your first client!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client: any) => (
                    <TableRow 
                      key={client.id} 
                      className="text-xs sm:text-sm cursor-pointer hover:bg-blue-50/50 transition-colors"
                      onClick={() => handleClientClick(client.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          {client.clientFirstName && client.clientLastName 
                            ? `${client.clientFirstName} ${client.clientLastName}` 
                            : client.clientFirstName || client.clientLastName || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                          {client.clientEmail || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          {client.clientCellPhone || client.clientHomePhone || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          {client.clientCity && client.clientState 
                            ? `${client.clientCity}, ${client.clientState}` 
                            : client.clientCity || client.clientState || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'Active' ? 'default' : 'secondary'}>
                          {client.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.createdAt ? new Date(client.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
