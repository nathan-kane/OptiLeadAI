export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  industry?: string;
  jobTitle?: string;
  websiteEngagement?: string; // Could be a summary or link to more details
  score: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'Contacted' | 'Qualified' | 'Nurturing' | 'Converted' | 'Rejected' | 'Disqualified';
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
  leadsQualified: { qualified: number; unqualified: number };
  conversionRate: Array<{ stage: string; count: number; rate?: number }>; // e.g. New -> Qualified -> Converted
  emailCampaignPerformance: Array<{ campaignName: string; openRate: number; ctr: number }>;
}
