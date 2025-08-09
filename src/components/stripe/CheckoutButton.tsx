"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  planType: 'basic' | 'gold';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'lg' | 'default';
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  disabled?: boolean;
}

export function CheckoutButton({ 
  planType, 
  children, 
  className = "",
  size = "default",
  variant = "default",
  disabled = false
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user, userId } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!user || !userId) {
      // Store the selected plan in localStorage for after signup
      localStorage.setItem('selectedPlan', planType);
      localStorage.setItem('redirectAfterAuth', 'checkout');
      
      // Redirect to signup page with plan context
      window.location.href = `/signup?plan=${planType}&redirect=checkout`;
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({
          planType,
          userId,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className}
      size={size}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children}
        </>
      )}
    </Button>
  );
}
