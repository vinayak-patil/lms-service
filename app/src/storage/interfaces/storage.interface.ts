export interface PresignedUrlResponse {
  url: string;
  key: string;
  fields: Record<string, string>;
  expiresIn: number;
}

export interface IStorageService {
  getPresignedUrl(
    type: string,
    mimeType: string,
    fileName?: string,
  ): Promise<PresignedUrlResponse>;
} 