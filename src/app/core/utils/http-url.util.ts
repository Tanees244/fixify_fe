/** True for direct S3 object URLs (presigned PUT/GET). Not EC2/API hosts. */
export function isDirectS3Url(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('.s3.') || host.startsWith('s3.') || host.endsWith('.s3.amazonaws.com');
  } catch {
    return false;
  }
}
