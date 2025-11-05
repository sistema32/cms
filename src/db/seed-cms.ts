import { db } from "../config/db.ts";
import { contentTypes, categories, categorySeo, tags } from "./schema.ts";
import { eq } from "drizzle-orm";

async function seedCMS() {
  console.log("🌱 Seeding CMS data...");

  // 1. Crear tipos de contenido predeterminados
  console.log("Creating content types...");

  // Verificar si ya existen
  const existingPost = await db.query.contentTypes.findFirst({
    where: eq(contentTypes.slug, "post"),
  });

  if (!existingPost) {
    const [postType] = await db.insert(contentTypes).values({
      name: "Post",
      slug: "post",
      description: "Entradas de blog estándar",
      icon: "📝",
      isPublic: true,
      hasCategories: true,
      hasTags: true,
      hasComments: true,
    }).returning();
    console.log("✓ Content type 'Post' created");

    const [pageType] = await db.insert(contentTypes).values({
      name: "Page",
      slug: "page",
      description: "Páginas estáticas del sitio",
      icon: "📄",
      isPublic: true,
      hasCategories: false,
      hasTags: false,
      hasComments: false,
    }).returning();
    console.log("✓ Content type 'Page' created");

    // 2. Crear categorías para posts
    console.log("\nCreating categories...");
    const [techCategory, designCategory, businessCategory] = await db.insert(categories).values([
      {
        name: "Tecnología",
        slug: "tecnologia",
        description: "Artículos sobre tecnología y desarrollo",
        contentTypeId: postType.id,
        color: "#3b82f6",
        icon: "💻",
        order: 1,
      },
      {
        name: "Diseño",
        slug: "diseno",
        description: "Artículos sobre diseño y UX/UI",
        contentTypeId: postType.id,
        color: "#8b5cf6",
        icon: "🎨",
        order: 2,
      },
      {
        name: "Negocios",
        slug: "negocios",
        description: "Artículos sobre negocios y emprendimiento",
        contentTypeId: postType.id,
        color: "#10b981",
        icon: "💼",
        order: 3,
      },
    ]).returning();
    console.log("✓ Categories created");

    // 2.1 Crear subcategorías
    console.log("\nCreating subcategories...");
    await db.insert(categories).values([
      {
        name: "Desarrollo Web",
        slug: "desarrollo-web",
        description: "Desarrollo de aplicaciones web",
        parentId: techCategory.id,
        contentTypeId: postType.id,
        color: "#06b6d4",
        icon: "🌐",
        order: 1,
      },
      {
        name: "Inteligencia Artificial",
        slug: "inteligencia-artificial",
        description: "IA y Machine Learning",
        parentId: techCategory.id,
        contentTypeId: postType.id,
        color: "#f59e0b",
        icon: "🤖",
        order: 2,
      },
      {
        name: "UI Design",
        slug: "ui-design",
        description: "Diseño de interfaces de usuario",
        parentId: designCategory.id,
        contentTypeId: postType.id,
        color: "#ec4899",
        icon: "🎨",
        order: 1,
      },
      {
        name: "Marketing Digital",
        slug: "marketing-digital",
        description: "Estrategias de marketing online",
        parentId: businessCategory.id,
        contentTypeId: postType.id,
        color: "#14b8a6",
        icon: "📊",
        order: 1,
      },
    ]);
    console.log("✓ Subcategories created");

    // 2.2 Crear SEO para categorías principales
    console.log("\nCreating category SEO...");
    await db.insert(categorySeo).values([
      {
        categoryId: techCategory.id,
        metaTitle: "Tecnología - Blog de Desarrollo",
        metaDescription: "Artículos y tutoriales sobre tecnología, programación y desarrollo de software. Aprende las últimas tendencias tech.",
        canonicalUrl: "https://example.com/categories/tecnologia",
        ogTitle: "Categoría Tecnología",
        ogDescription: "Los mejores artículos sobre tecnología y desarrollo",
        ogType: "website",
        twitterCard: "summary_large_image",
        twitterTitle: "Tecnología - Blog",
        twitterDescription: "Artículos sobre tecnología y desarrollo",
        focusKeyword: "tecnología",
        noIndex: false,
        noFollow: false,
        schemaJson: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Tecnología",
          "description": "Artículos sobre tecnología y desarrollo"
        }),
      },
      {
        categoryId: designCategory.id,
        metaTitle: "Diseño UX/UI - Blog Creativo",
        metaDescription: "Explora artículos sobre diseño de interfaces, experiencia de usuario y las mejores prácticas de diseño web.",
        canonicalUrl: "https://example.com/categories/diseno",
        ogTitle: "Categoría Diseño",
        ogDescription: "Artículos sobre diseño UX/UI y creatividad",
        ogType: "website",
        twitterCard: "summary_large_image",
        twitterTitle: "Diseño - Blog",
        twitterDescription: "Todo sobre diseño y UX/UI",
        focusKeyword: "diseño",
        noIndex: false,
        noFollow: false,
        schemaJson: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Diseño",
          "description": "Artículos sobre diseño y UX/UI"
        }),
      },
      {
        categoryId: businessCategory.id,
        metaTitle: "Negocios y Emprendimiento - Guías Prácticas",
        metaDescription: "Aprende sobre negocios, emprendimiento y estrategias para hacer crecer tu empresa con nuestros artículos especializados.",
        canonicalUrl: "https://example.com/categories/negocios",
        ogTitle: "Categoría Negocios",
        ogDescription: "Guías de negocios y emprendimiento",
        ogType: "website",
        twitterCard: "summary_large_image",
        twitterTitle: "Negocios - Blog",
        twitterDescription: "Estrategias de negocios y emprendimiento",
        focusKeyword: "negocios",
        noIndex: false,
        noFollow: false,
        schemaJson: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Negocios",
          "description": "Artículos sobre negocios y emprendimiento"
        }),
      },
    ]);
    console.log("✓ Category SEO created");

    // 3. Crear tags predeterminados
    console.log("\nCreating tags...");
    await db.insert(tags).values([
      {
        name: "JavaScript",
        slug: "javascript",
        description: "Todo sobre JavaScript",
        color: "#f7df1e",
      },
      {
        name: "TypeScript",
        slug: "typescript",
        description: "TypeScript y tipos",
        color: "#3178c6",
      },
      {
        name: "Deno",
        slug: "deno",
        description: "Runtime de Deno",
        color: "#000000",
      },
      {
        name: "API",
        slug: "api",
        description: "Desarrollo de APIs",
        color: "#ef4444",
      },
      {
        name: "Tutorial",
        slug: "tutorial",
        description: "Tutoriales paso a paso",
        color: "#06b6d4",
      },
    ]);
    console.log("✓ Tags created");

    console.log("\n✅ CMS seed completed successfully!");
  } else {
    console.log("⚠️  CMS data already seeded, skipping...");
  }
}

// Ejecutar el seed
if (import.meta.main) {
  await seedCMS();
  Deno.exit(0);
}
