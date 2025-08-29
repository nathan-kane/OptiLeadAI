"use client";

import { useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  planType: 'basic' | 'gold';
  children: ReactNode;
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
    // For plan selection from landing page, always go to signup first
    // This ensures proper flow: Plan Selection → Registration → Stripe
    localStorage.setItem('selectedPlan', planType);
    localStorage.setItem('redirectAfterAuth', 'checkout');
    
    // Always redirect to signup page with plan context
    window.location.href = `/signup?plan=${planType}`;
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
