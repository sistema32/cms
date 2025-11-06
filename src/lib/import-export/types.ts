/**
 * Import/Export System Types
 * Content import from WordPress, export to multiple formats
 */

/**
 * Export format
 */
export type ExportFormat = "json" | "csv" | "xml" | "wordpress";

/**
 * Import source
 */
export type ImportSource = "wordpress" | "json" | "csv";

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeContent?: boolean;
  includeCategories?: boolean;
  includeTags?: boolean;
  includeUsers?: boolean;
  includeMedia?: boolean;
  includeComments?: boolean;
  filters?: {
    status?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    authorId?: number;
    categoryId?: number;
  };
}

/**
 * Import options
 */
export interface ImportOptions {
  source: ImportSource;
  createUsers?: boolean;
  createCategories?: boolean;
  createTags?: boolean;
  downloadMedia?: boolean;
  overwriteExisting?: boolean;
  defaultAuthorId?: number;
  defaultStatus?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  format: ExportFormat;
  filename: string;
  path: string;
  size: number;
  itemCount: {
    content?: number;
    categories?: number;
    tags?: number;
    users?: number;
    media?: number;
    comments?: number;
  };
  createdAt: Date;
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  itemsProcessed: number;
  itemsImported: number;
  itemsSkipped: number;
  itemsFailed: number;
  errors: string[];
  warnings: string[];
  created: {
    content?: number;
    categories?: number;
    tags?: number;
    users?: number;
    media?: number;
  };
}

/**
 * WordPress post from XML
 */
export interface WordPressPost {
  title: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  description?: string;
  content?: string;
  excerpt?: string;
  postId?: string;
  postDate?: string;
  postDateGmt?: string;
  postName?: string;
  status?: string;
  postType?: string;
  categories?: string[];
  tags?: string[];
  meta?: Record<string, any>;
}

/**
 * Import progress
 */
export interface ImportProgress {
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  failed: number;
  currentItem?: string;
  percentage: number;
}
