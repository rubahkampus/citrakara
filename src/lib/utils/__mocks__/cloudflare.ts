// src/lib/utils/__mocks__/cloudflare.ts
export async function uploadFileToR2(
  file: Blob,
  path: string
): Promise<string> {
  // In tests, just return a mock URL
  return `https://mock-r2.cloudflare.com/${path}`;
}
