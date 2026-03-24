export interface ResourceDto {
  id: number;
  title: string;
  originalFilename: string | null;
  fileType: string | null;
  fileUrl: string | null;
  uploadedById: number;
  classRoomId: number | null;
  official: boolean;
  uploadedAt: string;
}

export interface ResourceDetailsDto {
  id: number;
  title: string;
  originalFilename: string | null;
  fileType: string | null;
  fileUrl: string | null;
  uploadedById: number | null;
  classRoomId: number | null;
  uploadedAt: string;
  fileAvailable: boolean;
  fileReadUrl: string | null;
  official: boolean;
}
export type ResourceDTO = ResourceDto;
export type ResourceDetailsDTO = ResourceDetailsDto;
