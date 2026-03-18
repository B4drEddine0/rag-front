export interface Resource {
  id: string;
  title: string;
  type: 'official' | 'non-official';
  description: string;
  uploadedBy: string;
  date: string;
  classId?: string;
}
