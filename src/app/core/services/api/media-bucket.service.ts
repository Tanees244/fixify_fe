import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ApiTicketAttachmentInput,
  PresignUploadRequest,
  PresignUploadResponse,
} from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class MediaBucketService extends ApiBaseService {
  presignUpload(body: PresignUploadRequest): Observable<PresignUploadResponse> {
    return this.http.post<PresignUploadResponse>(this.url('/mediabucket/presign-upload'), body);
  }

  /**
   * PUT the raw file to S3 via the presigned URL.
   *
   * Uses native `fetch` (not HttpClient) so Angular interceptors never add
   * Authorization / Accept / Content-Type: application/json — which would
   * break the signature or trigger a CORS preflight S3 cannot answer.
   * Matches the working Postman request: PUT + Content-Type only.
   */
  async putToS3(presignedUrl: string, file: File): Promise<void> {
    const contentType = file.type || 'application/octet-stream';
    const res = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(detail || `S3 upload failed (${res.status})`);
    }
  }

  /**
   * Presigns + uploads a single file and returns the attachment metadata the
   * ticket APIs expect ({ key, fileName, contentType, size }).
   */
  async uploadFile(file: File, folderName = 'tickets'): Promise<ApiTicketAttachmentInput> {
    const contentType = file.type || 'application/octet-stream';
    const presign = await firstValueFrom(
      this.presignUpload({
        fileName: file.name,
        folderName,
        contentType,
      })
    );
    await this.putToS3(presign.url, file);
    return {
      key: presign.key,
      fileName: file.name,
      contentType,
      size: file.size,
    };
  }
}
