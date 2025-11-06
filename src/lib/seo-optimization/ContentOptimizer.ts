/**
 * Content SEO Optimizer - Phase 2
 * Auto-optimization of titles, descriptions, keywords, readability
 */

export interface ContentAnalysis {
  titleLength: number;
  titleOptimal: boolean;
  descriptionLength: number;
  descriptionOptimal: boolean;
  keywordDensity: number;
  readabilityScore: number;
  headingStructure: {
    h1Count: number;
    h2Count: number;
    hasProperHierarchy: boolean;
  };
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  suggestions: string[];
}

export class ContentOptimizer {
  private static instance: ContentOptimizer;

  static getInstance(): ContentOptimizer {
    if (!ContentOptimizer.instance) {
      ContentOptimizer.instance = new ContentOptimizer();
    }
    return ContentOptimizer.instance;
  }

  /**
   * Analyze content for SEO
   */
  analyzeContent(title: string, description: string, body: string, keywords?: string[]): ContentAnalysis {
    const suggestions: string[] = [];
    const wordCount = body.split(/\s+/).length;

    // Title analysis
    const titleLength = title.length;
    const titleOptimal = titleLength >= 30 && titleLength <= 60;
    if (!titleOptimal) {
      suggestions.push(
        titleLength < 30
          ? "Title is too short. Aim for 30-60 characters."
          : "Title is too long. Keep it under 60 characters."
      );
    }

    // Description analysis
    const descriptionLength = description.length;
    const descriptionOptimal = descriptionLength >= 120 && descriptionLength <= 160;
    if (!descriptionOptimal) {
      suggestions.push(
        descriptionLength < 120
          ? "Meta description is too short. Aim for 120-160 characters."
          : "Meta description is too long. Keep it under 160 characters."
      );
    }

    // Keyword density
    let keywordDensity = 0;
    if (keywords && keywords.length > 0) {
      const mainKeyword = keywords[0].toLowerCase();
      const bodyLower = body.toLowerCase();
      const occurrences = (bodyLower.match(new RegExp(mainKeyword, "g")) || []).length;
      keywordDensity = (occurrences / wordCount) * 100;

      if (keywordDensity < 0.5 || keywordDensity > 3) {
        suggestions.push("Keyword density should be between 0.5% and 3%.");
      }
    }

    // Readability (simplified Flesch Reading Ease)
    const sentences = body.split(/[.!?]+/).length;
    const syllables = this.countSyllables(body);
    const readabilityScore = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);

    if (readabilityScore < 60) {
      suggestions.push("Content readability can be improved. Use shorter sentences and simpler words.");
    }

    // Heading structure
    const headingStructure = this.analyzeHeadings(body);
    if (!headingStructure.hasProperHierarchy) {
      suggestions.push("Improve heading hierarchy. Use H2-H6 tags properly.");
    }

    // Word count
    if (wordCount < 300) {
      suggestions.push("Content is too short. Aim for at least 300-500 words.");
    }

    // Internal/external links
    const internalLinks = (body.match(/href="\/[^"]*"/g) || []).length;
    const externalLinks = (body.match(/href="https?:\/\/[^"]*"/g) || []).length;

    if (internalLinks < 2) {
      suggestions.push("Add more internal links to improve site structure.");
    }

    return {
      titleLength,
      titleOptimal,
      descriptionLength,
      descriptionOptimal,
      keywordDensity,
      readabilityScore,
      headingStructure,
      internalLinks,
      externalLinks,
      wordCount,
      suggestions,
    };
  }

  /**
   * Generate SEO-optimized title
   */
  optimizeTitle(title: string, keyword?: string): string {
    let optimized = title.trim();

    // Add keyword at beginning if not present
    if (keyword && !optimized.toLowerCase().includes(keyword.toLowerCase())) {
      optimized = `${keyword} - ${optimized}`;
    }

    // Truncate if too long
    if (optimized.length > 60) {
      optimized = optimized.substring(0, 57) + "...";
    }

    // Ensure minimum length
    if (optimized.length < 30 && keyword) {
      optimized = `${optimized} | Complete Guide to ${keyword}`;
    }

    return optimized;
  }

  /**
   * Generate SEO-optimized description
   */
  optimizeDescription(body: string, keyword?: string): string {
    // Extract first paragraph
    const firstParagraph = body.split("\n\n")[0].replace(/<[^>]*>/g, "");

    let description = firstParagraph.substring(0, 160);

    // Add keyword if not present
    if (keyword && !description.toLowerCase().includes(keyword.toLowerCase())) {
      description = `${keyword}: ${description}`;
    }

    // Ensure it ends with complete sentence
    const lastPeriod = description.lastIndexOf(".");
    if (lastPeriod > 100) {
      description = description.substring(0, lastPeriod + 1);
    } else {
      description = description.trim() + "...";
    }

    return description;
  }

  /**
   * Extract and suggest internal links
   */
  suggestInternalLinks(body: string, allContent: Array<{ title: string; slug: string }>): Array<{ anchor: string; url: string }> {
    const suggestions: Array<{ anchor: string; url: string }> = [];
    const bodyLower = body.toLowerCase();

    for (const item of allContent) {
      const titleLower = item.title.toLowerCase();
      if (bodyLower.includes(titleLower) && !body.includes(item.slug)) {
        suggestions.push({
          anchor: item.title,
          url: `/${item.slug}`,
        });
      }
    }

    return suggestions.slice(0, 5); // Max 5 suggestions
  }

  /**
   * Count syllables (simplified)
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    return words.reduce((count, word) => {
      return count + Math.max(1, word.match(/[aeiouy]{1,2}/g)?.length || 1);
    }, 0);
  }

  /**
   * Analyze heading structure
   */
  private analyzeHeadings(html: string): { h1Count: number; h2Count: number; hasProperHierarchy: boolean } {
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;

    return {
      h1Count,
      h2Count,
      hasProperHierarchy: h1Count === 1 && h2Count >= 2,
    };
  }
}

export const contentOptimizer = ContentOptimizer.getInstance();
