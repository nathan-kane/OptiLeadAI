export interface Lead {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  industry?: string;
  jobTitle?: string;
  websiteEngagement?: string; // Could be a summary or link to more details
  score: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Buyer' | 'Seller' | 'Renter' | 'Unknown'; // Lead type classification
  contactStatus: 'New' | 'Contacted' | 'Qualified' | 'Nurturing' | 'Converted' | 'Rejected' | 'Disqualified'; // Contact progression
  lastInteraction?: string; // Date or description
  interactionHistory?: Array<{ date: string; type: string; notes: string }>;
  rationale?: string; // From AI scoring
  dataValidationStatus?: 'Valid' | 'Invalid' | 'Unverified';
}

export interface ScoringRule {
  id: string;
  attribute: 'industry' | 'companySize' | 'jobTitle' | 'websiteEngagement' | 'custom';
  customAttributeName?: string; // if attribute is 'custom'
  condition: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'isPresent'; // Simplified
  value: string | number;
  weight: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML or markdown content
}

export interface DripCampaignStep {
  id: string;
  emailTemplateId: string;
  delayDays: number; // Delay after previous step or trigger
  order: number;
}

export interface DripCampaign {
  id:string;
  name: string;
  status: 'Active' | 'Paused' | 'Draft';
  triggerType: 'scoreThreshold' | 'formSubmission' | 'manualAdd';
  triggerValue?: string | number; // e.g., score > 80, or form ID
  steps: DripCampaignStep[];
  totalEmails: number; // Calculated from steps.length
  enrollmentCount: number;
  openRate?: number;
  clickThroughRate?: number;
}

export interface AnalyticsData {
  leadsGenerated: Array<{ date: string; count: number }>;
  leadsByPriority: {
    daily: Array<{ date: string; high: number; medium: number; low: number }>;
    weekly: Array<{ week: string; high: number; medium: number; low: number }>;
    monthly: Array<{ month: string; high: number; medium: number; low: number }>;
    yearly: Array<{ year: string; high: number; medium: number; low: number }>;
  };
  leadsQualified: { qualified: number; unqualified: number };
  conversionRate: {
    daily: Array<{ date: string; new: number; contacted: number; qualified: number; converted: number }>;
    weekly: Array<{ week: string; new: number; contacted: number; qualified: number; converted: number }>;
    monthly: Array<{ month: string; new: number; contacted: number; qualified: number; converted: number }>;
    yearly: Array<{ year: string; new: number; contacted: number; qualified: number; converted: number }>;
  };
  emailCampaignPerformance: Array<{ campaignName: string; openRate: number; ctr: number }>;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'Active' | 'Inactive' | 'Prospect' | 'Past Client';
  notes?: string;
  preferredContactMethod?: 'email' | 'phone' | 'text' | 'mail';
  dateOfBirth?: string;
  occupation?: string;
  company?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}
