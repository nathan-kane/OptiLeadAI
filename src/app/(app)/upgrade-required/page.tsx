"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/stripe/CheckoutButton';
import { Crown, ArrowUp, Star } from 'lucide-react';
import Link from 'next/link';

export default function UpgradeRequiredPage() {
  const { planType } = useAuth();

  const currentPlan = planType || 'none';
  const isBasicUser = currentPlan === 'basic';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upgrade Required
          </h1>
          <p className="text-gray-600">
            This feature requires a {isBasicUser ? 'Gold' : 'paid'} plan to access.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {currentPlan === 'none' ? 'No Plan' : `${currentPlan} Plan`}
              </Badge>
              <ArrowUp className="w-4 h-4" />
              <Badge className="bg-yellow-500">
                <Crown className="w-3 h-3 mr-1" />
                Gold Plan
              </Badge>
            </CardTitle>
            <CardDescription>
              Unlock advanced AI features with our Gold plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Gold Plan Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">All Basic Features</p>
                    <p className="text-sm text-gray-600">Complete access to all Basic plan capabilities</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">AI Agent Script Enhancements</p>
                    <p className="text-sm text-gray-600">Advanced script optimization from call transcript analysis</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">RAG Knowledge Base</p>
                    <p className="text-sm text-gray-600">Retrieval-Augmented Generation for intelligent responses</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Follow-up Call Recording & Analysis</p>
                    <p className="text-sm text-gray-600">Advanced call analysis and training insights</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-baseline justify-center mb-4">
                <span className="text-4xl font-bold text-gray-900">$1,999</span>
                <span className="text-lg text-gray-600 ml-2">/month</span>
              </div>
              
              <CheckoutButton 
                planType="gold" 
                size="lg" 
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white border-0"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Gold Plan
              </CheckoutButton>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  Questions about upgrading?
                </p>
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            asChild
            className="text-sm"
          >
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
