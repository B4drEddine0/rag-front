export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingStep {
  icon: string;
  title: string;
  description: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: 'fact_check',
    title: 'Smart Attendance Tracking',
    description: 'Track daily attendance by class with quick summaries and trend-ready snapshots.'
  },
  {
    icon: 'description',
    title: 'AI Q&A from Official Documents',
    description: 'Ask policy and process questions using a retrieval-augmented workflow over trusted files.'
  },
  {
    icon: 'verified',
    title: 'Citation-Based Responses',
    description: 'Answers include citations to help staff verify content before acting.'
  },
  {
    icon: 'admin_panel_settings',
    title: 'Role-Based Access',
    description: 'Tailor workflows for administrators, teachers, and students with permission boundaries.'
  },
  {
    icon: 'inventory_2',
    title: 'Resource Management',
    description: 'Organize academic resources and school records in one guided workspace.'
  },
  {
    icon: 'insights',
    title: 'Operational Insights',
    description: 'Use attendance and document intelligence to support informed school decisions.'
  }
];

export const LANDING_STEPS: LandingStep[] = [
  {
    icon: 'upload_file',
    title: 'Upload Official Documents',
    description: 'Upload school policies and circulars to build the assistant knowledge base.'
  },
  {
    icon: 'how_to_reg',
    title: 'Take Attendance',
    description: 'Capture class attendance records in a consistent, trackable workflow.'
  },
  {
    icon: 'support_agent',
    title: 'Ask the Assistant',
    description: 'Ask operational questions and receive guided answers with source citations.'
  }
];
