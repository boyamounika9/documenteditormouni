
export interface Document {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_public: boolean;
  // Computed properties for UI compatibility
  lastModified?: Date;
  isShared?: boolean;
  collaborators?: string[];
}
