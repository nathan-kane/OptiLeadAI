"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SafariErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Safari Error Boundary caught an error:', error, errorInfo);
    
    // Log Safari-specific error details
    if (typeof window !== 'undefined') {
      console.error('User Agent:', navigator.userAgent);
      console.error('Safari Version:', navigator.userAgent.includes('Safari'));
      console.error('iOS Version:', navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad'));
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Browser Compatibility Issue
            </h1>
            <p className="text-gray-600 mb-4">
              We're having trouble loading this page in your browser. This may be due to Safari-specific compatibility issues.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Please try:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Updating Safari to the latest version</li>
                <li>Trying a different browser (Chrome, Firefox)</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
