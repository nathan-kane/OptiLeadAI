'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { migrateClientData, checkUserHasClients } from '@/utils/migrateClientData';
import { useToast } from '@/hooks/use-toast';

export function UserIdDebugger() {
  const { userId, user } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [clientCounts, setClientCounts] = useState<{[key: string]: number}>({});

  const knownUserWithData = "XUnMNiLGDEa6WFf2ZIm89pV7Zks1";

  const handleCheckClients = async () => {
    if (!userId) return;
    
    setIsChecking(true);
    try {
      // Check current user
      const currentUserClients = await checkUserHasClients(userId);
      
      // Check known user with data
      const knownUserClients = await checkUserHasClients(knownUserWithData);
      
      setClientCounts({
        [userId]: currentUserClients.clientCount,
        [knownUserWithData]: knownUserClients.clientCount
      });

      toast({
        title: "Client Check Complete",
        description: `Current user: ${currentUserClients.clientCount} clients, Known user: ${knownUserClients.clientCount} clients`,
      });
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Failed to check client data",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleMigrateData = async () => {
    if (!userId) return;
    
    setIsMigrating(true);
    try {
      const result = await migrateClientData(knownUserWithData, userId);
      
      if (result.success) {
        toast({
          title: "Migration Successful",
          description: result.message,
        });
        // Refresh client counts
        handleCheckClients();
      } else {
        toast({
          title: "Migration Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "Failed to migrate client data",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (!userId) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>User Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">User is not authenticated</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>User ID Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p><strong>Current Authenticated User ID:</strong></p>
          <code className="bg-gray-100 p-2 rounded block text-sm">{userId}</code>
        </div>
        
        <div>
          <p><strong>User Email:</strong></p>
          <code className="bg-gray-100 p-2 rounded block text-sm">{user?.email || 'Not available'}</code>
        </div>
        
        <div>
          <p><strong>Known User ID with Client Data:</strong></p>
          <code className="bg-gray-100 p-2 rounded block text-sm">{knownUserWithData}</code>
        </div>

        <div>
          <p><strong>Database Paths:</strong></p>
          <div className="space-y-1 text-sm">
            <div>Current user clients: <code>/users/{userId}/clients</code></div>
            <div>Known user clients: <code>/users/{knownUserWithData}/clients</code></div>
          </div>
        </div>

        {Object.keys(clientCounts).length > 0 && (
          <div>
            <p><strong>Client Counts:</strong></p>
            <div className="space-y-1 text-sm">
              <div>Current user: {clientCounts[userId] || 0} clients</div>
              <div>Known user: {clientCounts[knownUserWithData] || 0} clients</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleCheckClients} 
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? 'Checking...' : 'Check Client Data'}
          </Button>
          
          {userId !== knownUserWithData && (
            <Button 
              onClick={handleMigrateData} 
              disabled={isMigrating}
            >
              {isMigrating ? 'Migrating...' : 'Migrate Client Data'}
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Issue:</strong> Your authenticated user ID doesn't match the user ID where client data exists.</p>
          <p><strong>Solution:</strong> Use the "Migrate Client Data" button to copy client data to your authenticated user account.</p>
        </div>
      </CardContent>
    </Card>
  );
}
