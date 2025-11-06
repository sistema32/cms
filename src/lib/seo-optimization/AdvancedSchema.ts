/**
 * Advanced Schema Types - Phase 4
 * HowTo, Review, Recipe, Event, Product schemas
 */

export class AdvancedSchemaGenerator {
  private static instance: AdvancedSchemaGenerator;

  static getInstance(): AdvancedSchemaGenerator {
    if (!AdvancedSchemaGenerator.instance) {
      AdvancedSchemaGenerator.instance = new AdvancedSchemaGenerator();
    }
    return AdvancedSchemaGenerator.instance;
  }

  /**
   * Generate HowTo schema
   */
  generateHowTo(data: {
    name: string;
    description?: string;
    image?: string;
    totalTime?: string;
    steps: Array<{ name: string; text: string; image?: string }>;
  }): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: data.name,
      description: data.description,
      image: data.image,
      totalTime: data.totalTime,
      step: data.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
        image: step.image,
      })),
    };
  }

  /**
   * Generate Review schema
   */
  generateReview(data: {
    itemReviewed: { type: string; name: string };
    reviewRating: { ratingValue: number; bestRating?: number };
    author: { name: string };
    datePublished: string;
    reviewBody: string;
  }): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "Review",
      itemReviewed: {
        "@type": data.itemReviewed.type,
        name: data.itemReviewed.name,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: data.reviewRating.ratingValue,
        bestRating: data.reviewRating.bestRating || 5,
      },
      author: {
        "@type": "Person",
        name: data.author.name,
      },
      datePublished: data.datePublished,
      reviewBody: data.reviewBody,
    };
  }

  /**
   * Generate Recipe schema
   */
  generateRecipe(data: {
    name: string;
    description: string;
    image?: string;
    author: { name: string };
    prepTime?: string;
    cookTime?: string;
    totalTime?: string;
    recipeYield?: string;
    recipeIngredient?: string[];
    recipeInstructions?: Array<{ text: string }>;
    aggregateRating?: { ratingValue: number; reviewCount: number };
  }): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: data.name,
      description: data.description,
      image: data.image,
      author: {
        "@type": "Person",
        name: data.author.name,
      },
      prepTime: data.prepTime,
      cookTime: data.cookTime,
      totalTime: data.totalTime,
      recipeYield: data.recipeYield,
      recipeIngredient: data.recipeIngredient,
      recipeInstructions: data.recipeInstructions?.map((instruction) => ({
        "@type": "HowToStep",
        text: instruction.text,
      })),
      aggregateRating: data.aggregateRating
        ? {
            "@type": "AggregateRating",
            ratingValue: data.aggregateRating.ratingValue,
            reviewCount: data.aggregateRating.reviewCount,
          }
        : undefined,
    };
  }

  /**
   * Generate Event schema
   */
  generateEvent(data: {
    name: string;
    startDate: string;
    endDate?: string;
    location: { name: string; address?: string };
    description?: string;
    image?: string;
    offers?: { price: string; priceCurrency: string; url?: string };
  }): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: data.location.name,
        address: data.location.address
          ? {
              "@type": "PostalAddress",
              streetAddress: data.location.address,
            }
          : undefined,
      },
      description: data.description,
      image: data.image,
      offers: data.offers
        ? {
            "@type": "Offer",
            price: data.offers.price,
            priceCurrency: data.offers.priceCurrency,
            url: data.offers.url,
          }
        : undefined,
    };
  }

  /**
   * Generate Product schema
   */
  generateProduct(data: {
    name: string;
    description: string;
    image?: string;
    brand?: string;
    offers?: { price: string; priceCurrency: string; availability?: string };
    aggregateRating?: { ratingValue: number; reviewCount: number };
    review?: Array<{ author: string; datePublished: string; reviewBody: string; reviewRating: number }>;
  }): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: data.name,
      description: data.description,
      image: data.image,
      brand: data.brand
        ? {
            "@type": "Brand",
            name: data.brand,
          }
        : undefined,
      offers: data.offers
        ? {
            "@type": "Offer",
            price: data.offers.price,
            priceCurrency: data.offers.priceCurrency,
            availability: data.offers.availability || "https://schema.org/InStock",
          }
        : undefined,
      aggregateRating: data.aggregateRating
        ? {
            "@type": "AggregateRating",
            ratingValue: data.aggregateRating.ratingValue,
            reviewCount: data.aggregateRating.reviewCount,
          }
        : undefined,
      review: data.review?.map((rev) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: rev.author,
        },
        datePublished: rev.datePublished,
        reviewBody: rev.reviewBody,
        reviewRating: {
          "@type": "Rating",
          ratingValue: rev.reviewRating,
        },
      })),
    };
  }

  /**
   * Generate Sitelinks SearchBox schema
   */
  generateSitelinksSearchBox(searchUrl: string): Record<string, any> {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: searchUrl.split("/search")[0],
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${searchUrl}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
  }
}

export const advancedSchemaGenerator = AdvancedSchemaGenerator.getInstance();
