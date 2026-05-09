export interface TargetData {
  domains: string[];
  usernames: string[];
  emails: string[];
  names: string[];
  phones: string[];
  crypto: string[];
  other: string[];
}

export interface IntelTarget {
  id: string;
  username: string;
  status: 'UNINVESTIGATED' | 'REPORT READY' | 'DEEP DIVE';
  source: string;
  timestamp: string;
  eventId?: string;
}

export interface AffiliateCode {
  code: string;
  url: string;
}

export interface UserProfile {
  id: string;
  encoded: string;
  decoded: string;
}

export interface ContextualInfo {
  industry: string;
  relationships: string;
}

export interface FinancialRecord {
  id: string;
  name: string;
  amount: string;
  timestamp?: string;
}

export interface Entity {
  id: string;
  label: string;
  type: 'domain' | 'user' | 'ip' | 'email' | 'phone' | 'crypto' | 'other';
  data?: any;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface BreachResult {
  target: string;
  source: string;
  found: boolean;
  details: string[];
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExploitResult {
  id: string;
  url: string;
  vector: string;
  payload: string;
  success: boolean;
  evidence: string;
  timestamp: string;
}

export interface OffensiveState {
  targetUrl: string;
  isScanning: boolean;
  results: ExploitResult[];
  logs: string[];
}

export interface Endpoint {
  path: string;
  description: string;
}

export interface ThreatIntelAlert {
  id: string;
  timestamp: string;
  actor: string;
  indicator: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  relatedTargets?: string[];
}

export interface SSHKey {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  associatedTargets: string[];
  createdAt: string;
}

export interface InvestigationState {
  targets: TargetData;
  intelTargets: IntelTarget[];
  affiliates: AffiliateCode[];
  profiles: UserProfile[];
  endpoints: Endpoint[];
  financialRecords: FinancialRecord[];
  breachHistory: BreachResult[];
  context: ContextualInfo;
  notes: string;
  tasks: Task[];
  entities: Entity[];
  relationships: Relationship[];
  offensive: OffensiveState;
  threatIntel: ThreatIntelAlert[];
  sshKeys: SSHKey[];
}

export type OSINTCategory = 
  | 'infrastructure' 
  | 'social' 
  | 'darkweb' 
  | 'financial' 
  | 'graph' 
  | 'geospatial' 
  | 'archival' 
  | 'ai'
  | 'runehall'
  | 'monitoring'
  | 'tasks'
  | 'reporting'
  | 'offensive'
  | 'threatintel';
