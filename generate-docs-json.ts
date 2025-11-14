#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Script to generate comprehensive documentation JSON
 * Reads all markdown files and organizes them by category
 */

interface Document {
  title: string;
  file: string;
  summary: string;
  content: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  documents: Document[];
}

interface DocumentationStructure {
  metadata: {
    generatedAt: string;
    totalFiles: number;
    categories: number;
  };
  categories: Category[];
}

// Helper to extract title from markdown content
function extractTitle(content: string, filename: string): string {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].replace(/[🎉✅📋🚀💻🎨🔧🔐⚡📚🌐🗃️🤝📄🙏📞🗺️]/g, '').trim();
  }

  // Fallback to filename without extension
  return filename.replace(/\.md$/, '').replace(/-/g, ' ').replace(/_/g, ' ');
}

// Helper to create summary from content
function createSummary(content: string): string {
  // Try to find a description or first paragraph
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, headers, and markdown elements
    if (!line || line.startsWith('#') || line.startsWith('```') ||
        line.startsWith('---') || line.startsWith('|')) {
      continue;
    }

    // Remove markdown formatting
    const cleaned = line
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[🎉✅📋🚀💻🎨🔧🔐⚡📚🌐🗃️🤝📄🙏📞🗺️❤️⚠️✨🔥🎯📝🛡️☁️🔀🤖📊⚙️👋🎣]/g, '')
      .trim();

    if (cleaned.length > 20) {
      // Truncate to approximately 2 lines (150 chars)
      return cleaned.length > 150
        ? cleaned.substring(0, 147) + '...'
        : cleaned;
    }
  }

  return 'Documentación del sistema';
}

// Read file content
async function readFile(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return '';
  }
}

// Main function
async function generateDocumentation() {
  const docs: DocumentationStructure = {
    metadata: {
      generatedAt: new Date().toISOString().split('T')[0],
      totalFiles: 0,
      categories: 15
    },
    categories: []
  };

  // Category 1: Introducción y Guías de Inicio
  const cat1Files = [
    'README.md',
    'START.md',
    'test + docs/GETTING_STARTED.md'
  ];

  const cat1Docs: Document[] = [];
  for (const file of cat1Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat1Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 1,
    name: 'Introducción y Guías de Inicio',
    description: 'Documentación inicial y guías de inicio rápido',
    documents: cat1Docs
  });

  // Category 2: Arquitectura y Sistemas
  const cat2Files = [
    'ADMIN_PANEL_ARCHITECTURE.md',
    'THEME_SYSTEM_README.md',
    'docs/THEME_SYSTEM_ANALYSIS.md',
    'PLUGIN_SYSTEM.md',
    'docs/RBAC_SYSTEM.md',
    'test + docs/CMS_IMPLEMENTATION.md',
    'ADMIN_PANELS_FEATURE.md',
    'test + docs/COMMENTS_SYSTEM.md',
    'test + docs/CATEGORY_SYSTEM_IMPLEMENTATION.md',
    'test + docs/MENU_SYSTEM_IMPLEMENTATION.md',
    'test + docs/MEDIA_SYSTEM.md',
    'test + docs/SEO_AI_SYSTEM.md',
    'docs/ADMIN_NOTIFICATIONS_SYSTEM.md'
  ];

  const cat2Docs: Document[] = [];
  for (const file of cat2Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat2Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 2,
    name: 'Arquitectura y Sistemas',
    description: 'Documentación de la arquitectura y sistemas principales del CMS',
    documents: cat2Docs
  });

  // Category 3: Guías de Desarrollo
  const cat3Files = [
    'docs/THEME_DEVELOPMENT_GUIDE.md',
    'docs/THEME_CUSTOMIZER_GUIDE.md',
    'docs/CHILD_THEMES_GUIDE.md',
    'docs/WIDGETS_GUIDE.md',
    'PLUGINS_GUIDE.md',
    'docs/I18N_GUIDE.md',
    'src/themes/sdk/HOOKS_GUIDE.md',
    'src/themes/sdk/README.md',
    'docs/HOMEPAGE_CONFIGURATION.md',
    'docs/HOT_RELOAD_AND_PREVIEW.md'
  ];

  const cat3Docs: Document[] = [];
  for (const file of cat3Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat3Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 3,
    name: 'Guías de Desarrollo',
    description: 'Guías para desarrolladores de themes, plugins y extensiones',
    documents: cat3Docs
  });

  // Category 4: Implementación y Features
  const cat4Files = [
    'test + docs/CMS_PLAN.md',
    'test + docs/COMMENTS_CONTROL.md',
    'PROGRESO_IMPLEMENTACION.md',
    'docs/IMPLEMENTATION_SUMMARY.md',
    'test + docs/RESUMEN_IMPLEMENTACION.md',
    'docs/REMAINING_FEATURES_BLUEPRINT.md'
  ];

  const cat4Docs: Document[] = [];
  for (const file of cat4Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat4Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 4,
    name: 'Implementación y Features',
    description: 'Estado de implementación y roadmap de funcionalidades',
    documents: cat4Docs
  });

  // Category 5: Seguridad
  const cat5Files = [
    'test + docs/SECURITY_REVIEW.md',
    'test + docs/SECURITY_FEATURES.md',
    'test + docs/SECURITY_FIXES_REPORT.md',
    'test + docs/SECURITY_TEST_REPORT.md'
  ];

  const cat5Docs: Document[] = [];
  for (const file of cat5Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat5Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 5,
    name: 'Seguridad',
    description: 'Documentación de seguridad, auditorías y mejoras',
    documents: cat5Docs
  });

  // Category 6: Rendimiento
  const cat6Files = [
    'test + docs/PERFORMANCE_AUDIT.md',
    'test + docs/PERFORMANCE_OPTIMIZATIONS.md',
    'test + docs/PERFORMANCE_REPORT.md'
  ];

  const cat6Docs: Document[] = [];
  for (const file of cat6Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat6Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 6,
    name: 'Rendimiento',
    description: 'Auditorías de rendimiento y optimizaciones',
    documents: cat6Docs
  });

  // Category 7: Análisis y Auditorías
  const cat7Files = [
    'ANALISIS_Y_MEJORAS_SUGERIDAS.md',
    'CODE_ANALYSIS_DETAILED.md',
    'CODE_ISSUES_QUICK_REFERENCE.md',
    'HARDCODED_VALUES_AUDIT.md',
    'test + docs/REDUNDANCY_AUDIT.md',
    'SEO-AUDIT-REPORT.md',
    'REVISION_CODIGO_HALLAZGOS.md',
    'docs/XOYA_DESIGN_ANALYSIS.md'
  ];

  const cat7Docs: Document[] = [];
  for (const file of cat7Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat7Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 7,
    name: 'Análisis y Auditorías',
    description: 'Análisis de código, auditorías y revisiones técnicas',
    documents: cat7Docs
  });

  // Category 8: Mejoras y Propuestas
  const cat8Files = [
    'GAPS_BACKEND_FRONTEND.md',
    'PROPUESTAS_MEJORAS.md',
    'MEJORAS_SISTEMA_CONTENIDO.md',
    'PLUGIN_SYSTEM_IMPROVEMENTS.md'
  ];

  const cat8Docs: Document[] = [];
  for (const file of cat8Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat8Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 8,
    name: 'Mejoras y Propuestas',
    description: 'Propuestas de mejora y planes de desarrollo futuro',
    documents: cat8Docs
  });

  // Category 9: Testing y Depuración
  const cat9Files = [
    'test + docs/TEST_RESULTS.md',
    'docs/TEST_NOTIFICATIONS.md',
    'COMMENTS_FIXES_SUMMARY.md',
    'COMMENTS_SYSTEM_REVIEW.md',
    'CORPORATE_THEME_DEBUG.md',
    'FIX_GUIDE_DETAILED.md',
    'QUICK_FIX_GUIDE.md',
    'FIX_CREATEHASH_ERROR.md'
  ];

  const cat9Docs: Document[] = [];
  for (const file of cat9Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat9Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 9,
    name: 'Testing y Depuración',
    description: 'Resultados de tests, guías de debugging y correcciones',
    documents: cat9Docs
  });

  // Category 10: Migraciones y Configuración
  const cat10Files = [
    'RBAC_SETUP.md',
    'RBAC_INSTALLATION_COMPLETE.md',
    'test + docs/RBAC_GUIDE.md',
    'MIGRATION_INSTRUCTIONS.md',
    'CRYPTO_MIGRATION_GUIDE.md',
    'docs/DAISYUI.md',
    'docs/DAISYUI_COMPATIBILITY.md',
    'test + docs/TAILWIND.md',
    'THEMES.md'
  ];

  const cat10Docs: Document[] = [];
  for (const file of cat10Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat10Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 10,
    name: 'Migraciones y Configuración',
    description: 'Guías de migración, configuración y setup del sistema',
    documents: cat10Docs
  });

  // Category 11: Changelog y Progreso
  const cat11Files = [
    'CHANGELOG_ADMIN_PANELS.md'
  ];

  const cat11Docs: Document[] = [];
  for (const file of cat11Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat11Docs.push({
        title: extractTitle(content, file),
        summary: createSummary(content),
        file: file,
        content: content
      });
    }
  }

  docs.categories.push({
    id: 11,
    name: 'Changelog y Progreso',
    description: 'Historial de cambios y progreso del desarrollo',
    documents: cat11Docs
  });

  // Category 12: Diseño
  const cat12Files = [
    'docs/design-system.md',
    'docs/ADMIN_REDESIGN_PLAN.md',
    'docs/README-REDESIGN.md',
    'docs/COMPARISON.md'
  ];

  const cat12Docs: Document[] = [];
  for (const file of cat12Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat12Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 12,
    name: 'Diseño',
    description: 'Sistema de diseño, guías visuales y planes de rediseño',
    documents: cat12Docs
  });

  // Category 13: Plugins
  const cat13Files = [
    'PLUGIN_AUTO_MODERATION_SUMMARY.md',
    'plugins/analytics-dashboard/README.md',
    'plugins/cdn-cloudflare/README.md',
    'plugins/hello-world/README.md',
    'plugins/auto-moderation/README.md',
    'plugins/auto-moderation/EXAMPLES.md'
  ];

  const cat13Docs: Document[] = [];
  for (const file of cat13Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat13Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 13,
    name: 'Plugins',
    description: 'Documentación de plugins del sistema',
    documents: cat13Docs
  });

  // Category 14: Base de Datos
  const cat14Files = [
    'src/db/README.md'
  ];

  const cat14Docs: Document[] = [];
  for (const file of cat14Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat14Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 14,
    name: 'Base de Datos',
    description: 'Documentación del módulo de base de datos',
    documents: cat14Docs
  });

  // Category 15: Otros
  const cat15Files = [
    'src/lib/comments/README.md',
    'src/lib/system-updates/examples/README.md'
  ];

  const cat15Docs: Document[] = [];
  for (const file of cat15Files) {
    const content = await readFile(`/home/user/cms/${file}`);
    if (content) {
      cat15Docs.push({
        title: extractTitle(content, file),
        file: file,
        summary: createSummary(content),
        content: content
      });
    }
  }

  docs.categories.push({
    id: 15,
    name: 'Otros',
    description: 'Documentación adicional y ejemplos',
    documents: cat15Docs
  });

  // Calculate total files
  docs.metadata.totalFiles = docs.categories.reduce(
    (total, cat) => total + cat.documents.length,
    0
  );

  // Write JSON file
  const json = JSON.stringify(docs, null, 2);
  await Deno.writeTextFile('/home/user/cms/documentacion-unificada.json', json);

  console.log(`✅ Documentation JSON generated successfully!`);
  console.log(`📊 Total files: ${docs.metadata.totalFiles}`);
  console.log(`📁 Categories: ${docs.metadata.categories}`);
  console.log(`📄 Output: documentacion-unificada.json`);
}

// Run
if (import.meta.main) {
  await generateDocumentation();
}
