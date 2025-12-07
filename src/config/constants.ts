/**
 * Global Constants
 */

export const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    AUDIO: 'audio',
} as const;

export const STORAGE_PROVIDERS = {
    LOCAL: 'local',
    S3: 's3',
} as const;

export const DEFAULT_PATHS = {
    UPLOADS: 'uploads',
    BACKUPS: 'backups',
    TEMP: 'temp',
} as const;

export const MIME_TYPES = {
    WEBP: 'image/webp',
    WEBM_VIDEO: 'video/webm',
    WEBM_AUDIO: 'audio/webm',
    PDF: 'application/pdf',
} as const;
