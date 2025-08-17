"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, DollarSign, MapPin, User, Hash } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  clientId: string;
  clientName?: string;
  clientType: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  contractPrice: string;
  trxnStatus: string;
  mlsNumber: string;
  createdAt?: any;
}

export default function TransactionsPage() {
  const { user: currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Format currency similar to the Flutter version
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


  // Fetch transactions (similar to Flutter Firestore query)
  const fetchTransactions = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Get all clients for the user
      const clientsQuery = query(collection(db, `users/${currentUser.uid}/clients`));
      const clientsSnapshot = await getDocs(clientsQuery);
      
      const transactionsList: Transaction[] = [];

      // For each client, get their transactions
      for (const clientDoc of clientsSnapshot.docs) {
        const clientData = clientDoc.data();
        const clientId = clientDoc.id;
        
        // Query transactions for this client where status is not "Archived"
        const transactionsQuery = query(
          collection(db, `users/${currentUser.uid}/clients/${clientId}/transactions`),
          where("trxnStatus", "!=", "Archived")
        );
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        
        // Process each transaction
        for (const transactionDoc of transactionsSnapshot.docs) {
          const transactionData = transactionDoc.data();
          
          transactionsList.push({
            id: transactionDoc.id,
            clientId: clientId,
            clientName: `${clientData.clientFirstName || ''} ${clientData.clientLastName || ''}`.trim() || 'Unknown Client',
            clientType: clientData.clientType || 'N/A',
            propertyAddress: transactionData.propertyAddress || 'N/A',
            propertyCity: transactionData.propertyCity || 'N/A',
            propertyState: transactionData.propertyState || 'N/A',
            contractPrice: transactionData.contractPrice || '0',
            trxnStatus: transactionData.trxnStatus || 'Unknown',
            mlsNumber: transactionData.mlsNumber || 'N/A',
            createdAt: transactionData.createdAt
          });
        }
      }

      // Sort by creation date (newest first)
      transactionsList.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setTransactions(transactionsList);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentUser]);

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Transactions Dashboard</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions Dashboard</h1>
        <Link href="/transactions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-gray-500 text-center mb-4">
              You haven't created any transactions yet. Get started by creating your first transaction.
            </p>
            <Link href="/transactions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Transaction
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <Link href={`/transactions/${transaction.clientId}/${transaction.id}`}>
                        <h3 className="font-semibold text-blue-600 hover:underline cursor-pointer">
                          {transaction.clientName}
                        </h3>
                      </Link>
                      <Badge variant="outline" className="text-xs">
                        {transaction.clientType}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {transaction.propertyAddress}, {transaction.propertyCity}, {transaction.propertyState}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          Price: {formatCurrency(transaction.contractPrice)}
                        </span>
                      </div>
                      <div>
                        Status: <Badge className={getStatusColor(transaction.trxnStatus)}>
                          {transaction.trxnStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                      <Hash className="h-3 w-3" />
                      <span>MLS#: {transaction.mlsNumber}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Link href={`/transactions/${transaction.clientId}/${transaction.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
