/**
 * API utility functions that automatically include userId in headers
 */

import { storage } from './storage';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Makes an authenticated API call with userId automatically included in X-User-ID header
 */
export const apiCall = async (endpoint: string, options: ApiOptions = {}) => {
  const userId = storage.getUserId();
  
  if (!userId) {
    throw new Error('User not authenticated. Please log in first.');
  }

  const { method = 'GET', body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
    ...headers,
  };

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, requestOptions);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response;
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint: string, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'GET', headers }),

  post: (endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'POST', body, headers }),

  put: (endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'PUT', body, headers }),

  delete: (endpoint: string, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'DELETE', headers }),

  patch: (endpoint: string, body?: any, headers?: Record<string, string>) =>
    apiCall(endpoint, { method: 'PATCH', body, headers }),
};

/**
 * Example usage for the start-call endpoint
 */
export const startCall = async (phoneNumber: string, prospectName: string, documentId: string) => {
  return api.post('/api/start-call', {
    phoneNumber,
    prospectName,
    documentId,
  });
};

/**
 * Hook version for React components
 */
export const useAuthenticatedAPI = () => {
  return {
    apiCall,
    api,
    startCall,
  };
};
