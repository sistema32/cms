/**
 * Cloudflare CDN Plugin
 * Automatically uploads media to Cloudflare CDN and serves files from CDN
 */

import type { PluginAPI } from '../../src/lib/plugin-system/index.ts';

interface Media {
  id: number;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  metadata?: Record<string, any>;
}

export default class CloudflareCDNPlugin {
  private api: PluginAPI;
  private accountId: string = '';
  private apiToken: string = '';
  private cdnUrl: string = '';

  constructor(api: PluginAPI) {
    this.api = api;
  }

  /**
   * Called when plugin is activated
   */
  async onActivate(): Promise<void> {
    this.api.log('Activating Cloudflare CDN plugin...', 'info');

    // Load settings
    this.accountId = this.api.getSetting('accountId', '');
    this.apiToken = this.api.getSetting('apiToken', '');
    this.cdnUrl = this.api.getSetting('cdnUrl', '');

    // Validate configuration
    if (!this.accountId || !this.apiToken) {
      this.api.log(
        'Cloudflare CDN plugin activated but not configured. Please add your Account ID and API Token in settings.',
        'warn'
      );
      return;
    }

    // Register hooks
    this.api.addAction('media:afterUpload', this.uploadToCDN.bind(this), 5);
    this.api.addFilter('media:getUrl', this.getCDNUrl.bind(this), 5);
    this.api.addAction('media:beforeDelete', this.deleteFromCDN.bind(this), 5);

    this.api.log('Cloudflare CDN plugin activated successfully', 'info');
  }

  /**
   * Called when plugin is deactivated
   */
  async onDeactivate(): Promise<void> {
    this.api.log('Deactivating Cloudflare CDN plugin...', 'info');

    // Remove hooks
    this.api.removeAction('media:afterUpload', this.uploadToCDN);
    this.api.removeFilter('media:getUrl', this.getCDNUrl);
    this.api.removeAction('media:beforeDelete', this.deleteFromCDN);

    this.api.log('Cloudflare CDN plugin deactivated', 'info');
  }

  /**
   * Called when settings are updated
   */
  async onSettingsUpdate(settings: Record<string, any>): Promise<void> {
    this.api.log('Updating Cloudflare CDN settings...', 'info');

    this.accountId = settings.accountId || '';
    this.apiToken = settings.apiToken || '';
    this.cdnUrl = settings.cdnUrl || '';

    this.api.log('Settings updated successfully', 'info');
  }

  /**
   * Upload file to Cloudflare CDN after upload
   */
  private async uploadToCDN(media: Media): Promise<void> {
    // Skip if not configured
    if (!this.accountId || !this.apiToken) {
      return;
    }

    try {
      this.api.log(`Uploading ${media.filename} to Cloudflare CDN...`, 'info');

      // In a real implementation, you would:
      // 1. Read the file from media.path
      // 2. Upload to Cloudflare Images or R2
      // 3. Get the CDN URL back
      // 4. Store it in media metadata

      // Simulated CDN upload (replace with actual Cloudflare API call)
      const cdnUrl = await this.uploadToCloudflare(media);

      // Save CDN URL to media metadata
      await this.api.query(
        'UPDATE media SET metadata = json_set(COALESCE(metadata, "{}"), "$.cdnUrl", ?) WHERE id = ?',
        [cdnUrl, media.id]
      );

      this.api.log(`Successfully uploaded to CDN: ${cdnUrl}`, 'info');
    } catch (error) {
      this.api.log(`CDN upload failed: ${(error as Error).message}`, 'error');
      // Don't throw - allow media to still be saved locally
    }
  }

  /**
   * Get CDN URL for serving media
   */
  private getCDNUrl(url: string, media: Media): string {
    // If media has CDN URL in metadata, return it
    const cdnUrl = media.metadata?.cdnUrl;

    if (cdnUrl) {
      return cdnUrl;
    }

    // Otherwise return original URL
    return url;
  }

  /**
   * Delete file from CDN before local deletion
   */
  private async deleteFromCDN(media: Media): Promise<void> {
    const cdnUrl = media.metadata?.cdnUrl;

    if (!cdnUrl) {
      return; // Not uploaded to CDN
    }

    try {
      this.api.log(`Deleting ${media.filename} from Cloudflare CDN...`, 'info');

      // In a real implementation, call Cloudflare API to delete
      await this.deleteFromCloudflare(cdnUrl);

      this.api.log(`Successfully deleted from CDN`, 'info');
    } catch (error) {
      this.api.log(`CDN deletion failed: ${(error as Error).message}`, 'error');
      // Don't throw - allow local deletion to proceed
    }
  }

  /**
   * Upload to Cloudflare (mock implementation)
   * In production, replace with actual Cloudflare API calls
   */
  private async uploadToCloudflare(media: Media): Promise<string> {
    // This is a mock implementation
    // In production, you would:

    // For Cloudflare Images:
    // POST https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1

    // For Cloudflare R2:
    // Use S3-compatible API to upload to R2 bucket

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock CDN URL
    return `${this.cdnUrl}/${media.filename}`;
  }

  /**
   * Delete from Cloudflare (mock implementation)
   */
  private async deleteFromCloudflare(cdnUrl: string): Promise<void> {
    // This is a mock implementation
    // In production, call Cloudflare API to delete the image/file

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
