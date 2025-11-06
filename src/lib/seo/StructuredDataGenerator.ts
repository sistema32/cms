/**
 * Structured Data Generator
 * Generates Schema.org JSON-LD structured data
 */

import type {
  ArticleSchema,
  BreadcrumbSchema,
  OrganizationSchema,
} from "./types.ts";
import { env } from "../../config/env.ts";
import type { Content } from "../../db/schema.ts";

export class StructuredDataGenerator {
  private static instance: StructuredDataGenerator;

  private constructor() {}

  static getInstance(): StructuredDataGenerator {
    if (!StructuredDataGenerator.instance) {
      StructuredDataGenerator.instance = new StructuredDataGenerator();
    }
    return StructuredDataGenerator.instance;
  }

  /**
   * Generate article structured data
   */
  generateArticle(
    content: Content,
    author: { name: string; url?: string },
    publisher: { name: string; logo?: string }
  ): ArticleSchema {
    const schema: ArticleSchema = {
      "@context": "https://schema.org",
      "@type": this.getArticleType(content.contentTypeId),
      headline: content.title,
      description: content.excerpt || undefined,
      image: content.featuredImage || undefined,
      datePublished: content.publishedAt?.toISOString() || content.createdAt.toISOString(),
      dateModified: content.updatedAt?.toISOString(),
      author: {
        "@type": "Person",
        name: author.name,
        url: author.url,
      },
      publisher: {
        "@type": "Organization",
        name: publisher.name,
        logo: publisher.logo
          ? {
              "@type": "ImageObject",
              url: publisher.logo,
            }
          : undefined,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${env.BASE_URL}/${content.slug}`,
      },
    };

    // Add keywords if available
    if (content.metaKeywords) {
      schema.keywords = content.metaKeywords.split(",").map((k) => k.trim());
    }

    return schema;
  }

  /**
   * Get article type based on content type
   */
  private getArticleType(contentTypeId: number): "Article" | "NewsArticle" | "BlogPosting" {
    // This could be enhanced to check content type name/slug
    // For now, default to Article
    return "Article";
  }

  /**
   * Generate organization structured data
   */
  generateOrganization(options: {
    name: string;
    url: string;
    logo?: string;
    description?: string;
    socialProfiles?: string[];
    contactEmail?: string;
    contactPhone?: string;
  }): OrganizationSchema {
    const schema: OrganizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: options.name,
      url: options.url,
      logo: options.logo,
      description: options.description,
      sameAs: options.socialProfiles,
    };

    // Add contact point if provided
    if (options.contactEmail || options.contactPhone) {
      schema.contactPoint = [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: options.contactEmail,
          telephone: options.contactPhone,
        },
      ];
    }

    return schema;
  }

  /**
   * Generate breadcrumb structured data
   */
  generateBreadcrumb(items: { name: string; url?: string }[]): BreadcrumbSchema {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  /**
   * Generate website structured data
   */
  generateWebsite(options: {
    name: string;
    url: string;
    description?: string;
    searchUrl?: string;
  }): Record<string, any> {
    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: options.name,
      url: options.url,
      description: options.description,
    };

    // Add search action if search URL provided
    if (options.searchUrl) {
      schema.potentialAction = {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${options.searchUrl}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      };
    }

    return schema;
  }

  /**
   * Generate FAQ structured data
   */
  generateFAQ(
    faqs: { question: string; answer: string }[]
  ): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Convert schema object to JSON-LD script tag
   */
  toScriptTag(schema: Record<string, any>): string {
    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
  }

  /**
   * Generate multiple schemas combined
   */
  generateCombined(schemas: Record<string, any>[]): string {
    const combined = {
      "@context": "https://schema.org",
      "@graph": schemas,
    };
    return this.toScriptTag(combined);
  }
}

export const structuredDataGenerator = StructuredDataGenerator.getInstance();
