export interface Lead {
  firstName: string;
  fullName: string;
  phoneNumbers: string[];
  callAttempts?: CallAttempt[];
}

export interface CallAttempt {
  phoneNumber: string;
  status: 'Voicemail' | 'Answered by Human' | 'Failed' | 'In Progress';
  timestamp: string;
}
