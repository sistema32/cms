# Cloudflare CDN Plugin

Automatically upload and serve media files from Cloudflare CDN to improve site performance.

## Features

- ✅ Automatic upload to Cloudflare CDN after media upload
- ✅ Serve all media from CDN automatically
- ✅ Delete from CDN when media is deleted
- ✅ Supports Cloudflare Images and R2 storage
- ✅ Falls back to local storage if CDN fails

## Installation

1. Install the plugin:
```bash
deno task plugin:install cdn-cloudflare
```

2. Activate the plugin:
```bash
deno task plugin:activate cdn-cloudflare
```

Or via Admin Panel:
- Navigate to **Admin → Plugins**
- Find "Cloudflare CDN Integration"
- Click **Install** and then **Activate**

## Configuration

### Required Settings

1. **Account ID**: Your Cloudflare Account ID
   - Find it in: Cloudflare Dashboard → Account Home

2. **API Token**: Your Cloudflare API Token
   - Create at: Cloudflare Dashboard → My Profile → API Tokens
   - Required permissions:
     - Account.Cloudflare Images: Edit
     - Or Account.R2 Storage: Edit (if using R2)

3. **CDN URL**: Your CDN URL
   - For Cloudflare Images: `https://imagedelivery.net/{account_hash}`
   - For R2: Your R2 public bucket URL

### Example Configuration

```json
{
  "accountId": "a1b2c3d4e5f6g7h8i9j0",
  "apiToken": "your-api-token-here",
  "cdnUrl": "https://imagedelivery.net/abc123"
}
```

## How It Works

### Upload Flow

1. User uploads a file to LexCMS
2. File is saved locally
3. Plugin automatically uploads to Cloudflare CDN
4. CDN URL is stored in media metadata
5. All subsequent requests serve from CDN

### URL Transformation

**Before:**
```
https://yoursite.com/uploads/image.jpg
```

**After:**
```
https://imagedelivery.net/abc123/image.jpg
```

## Hooks Used

This plugin implements the following hooks:

- `media:afterUpload` (action) - Upload to CDN after local upload
- `media:getUrl` (filter) - Return CDN URL instead of local URL
- `media:beforeDelete` (action) - Delete from CDN before local deletion

## Permissions Required

- `media:read` - Read media file information
- `media:write` - Update media metadata with CDN URL
- `settings:read` - Read plugin settings
- `network:external` - Make API calls to Cloudflare
- `database:write` - Update media table

## Development

### Testing Locally

```typescript
// In your test environment
import { pluginManager } from './src/lib/plugin-system/index.ts';

// Install and configure
await pluginManager.install('cdn-cloudflare');
await pluginManager.updateSettings('cdn-cloudflare', {
  accountId: 'test-account',
  apiToken: 'test-token',
  cdnUrl: 'https://test-cdn.example.com'
});
await pluginManager.activate('cdn-cloudflare');
```

### Implementing Real Cloudflare API

Replace the mock methods in `index.ts` with actual Cloudflare API calls:

**For Cloudflare Images:**
```typescript
private async uploadToCloudflare(media: Media): Promise<string> {
  const formData = new FormData();
  const file = await Deno.readFile(media.path);
  formData.append('file', new Blob([file]), media.filename);

  const response = await this.api.fetch(
    `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: formData,
    }
  );

  const data = await response.json();
  return data.result.variants[0]; // CDN URL
}
```

## Troubleshooting

### Plugin not uploading to CDN

- Check that Account ID and API Token are correct
- Verify API Token has proper permissions
- Check plugin logs: Look for error messages in console

### Files still serving from local URL

- Ensure plugin is activated
- Check media metadata has `cdnUrl` field
- Verify CDN URL is accessible

### CDN upload fails

- Plugin will still save media locally as fallback
- Check Cloudflare account quotas
- Verify network connectivity to Cloudflare API

## Support

For issues and feature requests:
- GitHub: https://github.com/lexcms/plugin-cdn-cloudflare
- Docs: https://docs.lexcms.com/plugins/cdn-cloudflare

## License

MIT License - See LICENSE file for details
