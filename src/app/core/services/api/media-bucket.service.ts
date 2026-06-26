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

  /** Uploads the raw file directly to S3 using the presigned PUT URL. */
  putToS3(presignedUrl: string, file: File): Observable<unknown> {
    return this.http.put(presignedUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
  }

  /**
   * Presigns + uploads a single file and returns the attachment metadata the
   * ticket APIs expect ({ key, fileName, contentType, size }).
   */
  async uploadFile(file: File, folderName = 'tickets'): Promise<ApiTicketAttachmentInput> {
    const presign = await firstValueFrom(
      this.presignUpload({
        fileName: file.name,
        folderName,
        contentType: file.type || 'application/octet-stream',
      })
    );
    await firstValueFrom(this.putToS3(presign.url, file));
    return {
      key: presign.key,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    };
  }
}
