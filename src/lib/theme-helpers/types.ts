/**
 * Theme Helpers - Type Definitions
 * Shared interfaces and types for theme helper functions
 */

// ============= SITE TYPES =============

export interface SiteData {
    name: string;
    description: string;
    url: string;
    logo: string | null;
    language: string;
    timezone: string;
}

// ============= MENU TYPES =============

export interface MenuItem {
    id: number;
    label: string;
    url: string;
    title?: string;
    icon?: string;
    cssClass?: string;
    target?: string;
    children?: MenuItem[];
}

// ============= CONTENT TYPES =============

export interface PostData {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    body?: string | null;
    featureImage?: string;
    status?: string;
    featured?: boolean;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    author: {
        id: number;
        name: string;
        email: string;
    };
    categories: Array<{ id: number; name: string; slug: string }>;
    tags: Array<{ id: number; name: string; slug: string }>;
}

// ============= TAXONOMY TYPES =============

export interface CategoryData {
    id: number;
    name: string;
    slug: string;
    description?: string;
    count?: number;
}

export interface TagData {
    id: number;
    name: string;
    slug: string;
    count?: number;
}

// ============= PAGINATION TYPES =============

export interface PaginationData {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: number | null;
    prevPage: number | null;
}

// ============= CSS TYPES =============

export interface BodyClassContext {
    isHome?: boolean;
    isPost?: boolean;
    isPage?: boolean;
    isCategory?: boolean;
    isTag?: boolean;
    isAuthor?: boolean;
    isSearch?: boolean;
    isError?: boolean;
    slug?: string;
}

export interface PostClassData {
    id: number;
    status: string;
    slug: string;
    featured?: boolean;
}
