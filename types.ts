export interface Squad {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Project {
  id: string;
  squadId: string;
  name: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export type IntegrationType = 'ga4' | 'google-ads' | 'meta-ads';

export interface Integration {
  id: string;
  projectId: string;
  type: IntegrationType;
  status: 'connected' | 'disconnected';
  connectedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}