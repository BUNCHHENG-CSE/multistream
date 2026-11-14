export type GridPreset = "1x1" | "1x2" | "2x2" | "1+3" | "3x3";

export interface SavedStreamItem {
  videoId: string;
  label: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SavedLayout {
  id: string;
  userId: string;
  title: string;
  gridPreset: GridPreset;
  streams: SavedStreamItem[];
  isPublic: boolean;
  createdAt: Date;
}
