# LexCMS - File Tree Global

Struttura completa del progetto CMS organizzata per categorie funzionali.

## 📁 Root Level

```
/home/jano/lexcms/cms/
├── deno.json                          # Configurazione Deno
├── deno.lock                          # Lock file dipendenze
├── package.json                       # Dipendenze Node.js
├── package-lock.json
├── tailwind.config.js                 # Configurazione Tailwind CSS
├── drizzle.config.ts                  # Configurazione Drizzle ORM
├── import_map.json                    # Import map Deno
├── .env                               # Variabili ambiente
├── .env.example
├── .env.plugin.example
└── .gitignore
```

## 📚 Documentazione

```
├── README.md                          # Documentazione principale
├── ROADMAP.md                         # Roadmap progetto
├── SECURITY-AUDIT-REPORT.md           # Report audit sicurezza
├── SECURITY_ANALYSIS.md               # Analisi sicurezza
├── documentacion-completa.json        # Documentazione JSON
├── documentacion-unificada.html       # Documentazione HTML
└── docs/                              # Documentazione dettagliata
    ├── HOOKS.md
    ├── PLUGIN_SYSTEM_ARCHITECTURE.md
    ├── PLUGIN_DATABASE_MIGRATIONS.md
    ├── PLUGIN_SECURITY.md
    ├── PLUGIN_SYSTEM_GAPS.md
    ├── PLUGIN_SYSTEM_GAPS_V2.md
    ├── PLUGIN_SYSTEM_REFACTOR_PLAN.md
    ├── PLUGIN_SYSTEM_REWRITE.md
    ├── PLUGIN_SYSTEM_REWRITE_TODO.md
    ├── PROPOSAL_SECURE_DB_API.md
    ├── SECURE_DB_API_PLAN.md
    ├── DATABASE_COMMANDS.md
    ├── CMS_DB_ACCESS_COMPARISON.md
    ├── LEXCMS_CORE_DOCUMENTATION.md
    ├── PLUGIN_RUNTIME_VALIDATION.md
    ├── hooks-core.md
    ├── hooks-refactor-todo.md
    ├── examples/
    │   ├── plugin-example.ts
    │   └── theme-example.tsx
    ├── mockups/
    │   ├── admin-plugin-ui.png
    │   ├── plugin-manager.png
    │   ├── settings-page.png
    │   └── theme-selector.png
    └── test + docs/
        ├── test-cases.md
        ├── api-docs.md
        └── troubleshooting.md
```

## 🔧 Scripts

```
├── scripts/                           # Script di utility
│   ├── plugin-cli.ts                  # CLI gestione plugin
│   ├── plugin-create.ts               # Creazione plugin
│   ├── plugin-migrate.ts              # Migrazione plugin
│   ├── create-superadmin.ts           # Creazione superadmin
│   ├── create_user.ts                 # Creazione utenti
│   ├── check_user.ts                  # Verifica utenti
│   ├── build-admin-css.ts             # Build CSS admin
│   ├── build-css.ts                   # Build CSS generale
│   ├── generate-docs-json.ts          # Generazione docs JSON
│   ├── migrate-lexslider.ts           # Migrazione lexslider
│   ├── register-lexslider.ts          # Registrazione lexslider
│   ├── reset-lexslider.ts             # Reset lexslider
│   ├── apply-security-migration.ts    # Migrazione sicurezza
│   ├── test-theme-assets.ts           # Test assets temi
│   ├── translate-schema.ts            # Traduzione schema
│   ├── verify-plugin-system.ts        # Verifica sistema plugin
│   ├── fix-createhash-imports.ts      # Fix import createHash
│   ├── check-createhash-usage.sh      # Check uso createHash
│   ├── check-imports.sh               # Verifica import
│   ├── fix-template-strings.py        # Fix template strings
│   ├── run_seed.py                    # Seed database (Python)
│   ├── setup_db.py                    # Setup database (Python)
│   ├── verify_rbac.py                 # Verifica RBAC (Python)
│   └── cms.code-workspace             # Workspace VSCode
└── test scripts (root)/               # Script di test nella root
    ├── activate_slider.ts
    ├── check_migrations.ts
    ├── diagnose-lexslider.ts
    ├── force_create_tables.ts
    ├── list_plugins.ts
    ├── run-lexslider-migration.ts
    ├── run_slider_migrations.ts
    ├── test-lexslider.ts
    ├── test-plugin-lifecycle.ts
    ├── test-plugin-system.ts
    └── test-plugin-worker.ts
```

## 🗄️ Database

```
src/db/
├── index.ts                           # Export principale DB
├── schema.ts                          # Schema principale
├── setup.ts                           # Setup database
├── migrate.ts                         # Migrazioni
├── migrate-rbac.ts                    # Migrazioni RBAC
├── seed.ts                            # Seed generale
├── seed-cms.ts                        # Seed CMS
├── seed-menus.ts                      # Seed menù
├── seed-rbac.ts                       # Seed RBAC
├── verify.ts                          # Verifica DB
├── verify-data.ts                     # Verifica dati
├── generate-migrations.ts             # Generazione migrazioni
├── README.md                          # Documentazione DB
├── schema/                            # Schema multi-database
│   ├── index.ts
│   ├── settings.ts
│   ├── sqlite/
│   │   ├── index.ts
│   │   └── forms.ts
│   ├── mysql/
│   │   └── index.ts
│   └── postgresql/
│       └── index.ts
├── migrations/                        # Migrazioni Drizzle
│   ├── 0000_moaning_metal_master.sql
│   ├── custom/
│   │   └── index.ts
│   └── meta/
│       ├── _journal.json
│       └── 0000_snapshot.json
├── seeds/                             # Seed dati
│   ├── defaultSettings.ts
│   ├── rbac.ts
│   ├── plugins.ts
│   ├── security-permissions.ts
│   ├── testContent.ts
│   └── testComments.ts
└── config/
    └── database-type.ts
```

## 🎯 Core Application

```
src/
├── main.ts                            # Entry point principale
├── app.ts                             # Configurazione app Hono
├── types/                             # Type definitions
│   └── hono.d.ts
└── polyfills/                         # Polyfills per compatibilità
```

## 🎨 Themes

```
src/themes/
├── sdk/                               # SDK per sviluppo temi
├── default/                           # Tema default
│   ├── theme.json
│   ├── README.md
│   ├── templates/
│   │   ├── index.tsx
│   │   ├── Layout.tsx
│   │   ├── home.tsx
│   │   ├── blog.tsx
│   │   ├── post.tsx
│   │   ├── page.tsx
│   │   ├── category.tsx
│   │   ├── tag.tsx
│   │   ├── search.tsx
│   │   ├── 404.tsx
│   │   └── pages/
│   │       ├── page-inicio.tsx
│   │       └── page-contacto.tsx
│   ├── partials/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PostCard.tsx
│   │   └── Pagination.tsx
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css
│   │   │   └── tailwind.css
│   │   └── js/
│   │       └── main.js
│   ├── locales/
│   │   ├── en.json
│   │   ├── es.json
│   │   └── ar.json
│   └── helpers/
│       └── index.ts
├── legal-premium/                     # Tema legal premium
│   ├── theme.json
│   ├── README.md
│   ├── templates/
│   │   ├── Layout.tsx
│   │   ├── home.tsx
│   │   ├── blog.tsx
│   │   ├── post.tsx
│   │   ├── page.tsx
│   │   ├── category.tsx
│   │   ├── tag.tsx
│   │   ├── search.tsx
│   │   └── 404.tsx
│   ├── partials/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Hero.tsx
│   ├── assets/
│   │   ├── css/
│   │   │   └── theme.css
│   │   └── js/
│   │       └── theme.js
│   └── helpers/
│       └── index.ts
├── corporate/                         # Tema corporate
│   ├── theme.json
│   ├── templates/
│   ├── partials/
│   ├── assets/
│   └── helpers/
├── magazine/                          # Tema magazine
│   ├── theme.json
│   ├── templates/
│   ├── partials/
│   ├── assets/
│   └── helpers/
├── minimalist/                        # Tema minimalist
│   ├── theme.json
│   ├── templates/
│   ├── partials/
│   ├── assets/
│   └── helpers/
└── base/                              # Tema base
    ├── theme.json
    ├── templates/
    ├── partials/
    ├── assets/
    └── helpers/
```

## 🧩 Plugins

```
plugins/
├── core-system/                       # Plugin sistema core
│   ├── index.ts
│   ├── manifest.json
│   └── README.md
├── hello-world/                       # Plugin esempio
│   ├── index.ts
│   ├── manifest.json
│   └── README.md
└── lexslider/                         # Plugin slider
    ├── index.ts
    ├── manifest.json
    ├── README.md
    ├── package.json
    ├── config.ts
    ├── migrations/
    │   └── 001_schema.up.sql
    ├── routes/
    │   └── sliders.ts
    └── views/
        └── admin.tsx
```

## 🛣️ Routes

```
src/routes/
├── index.ts                           # Router principale
├── admin.ts                           # Route admin
├── api.ts                             # API routes
├── auth.ts                            # Autenticazione
├── blog.ts                            # Blog routes
├── categories.ts                      # Categorie
├── comments.ts                        # Commenti
├── forms.ts                           # Form
├── media.ts                           # Media/upload
├── menus.ts                           # Menù
├── pages.ts                           # Pagine
├── plugins.ts                         # Plugin routes
├── posts.ts                           # Post
├── rbac.ts                            # RBAC routes
├── settings.ts                        # Impostazioni
├── tags.ts                            # Tag
├── themes.ts                          # Temi
├── users.ts                           # Utenti
├── widgets.ts                         # Widget
└── [altri file route...]
```

## 🎮 Controllers

```
src/controllers/
├── authController.ts                  # Controller autenticazione
├── blogController.ts                  # Controller blog
├── categoryController.ts              # Controller categorie
├── commentController.ts               # Controller commenti
├── formController.ts                  # Controller form
├── mediaController.ts                 # Controller media
├── menuController.ts                  # Controller menù
├── pageController.ts                  # Controller pagine
├── pluginController.ts                # Controller plugin
├── postController.ts                  # Controller post
├── rbacController.ts                  # Controller RBAC
├── settingsController.ts              # Controller settings
├── tagController.ts                   # Controller tag
├── themeController.ts                 # Controller temi
├── userController.ts                  # Controller utenti
├── widgetController.ts                # Controller widget
└── [altri controller...]
```

## 🔌 Services

```
src/services/
├── auth/                              # Servizi autenticazione
│   ├── authService.ts
│   ├── jwtService.ts
│   ├── passwordService.ts
│   └── sessionService.ts
├── cache/                             # Servizi cache
│   ├── cacheService.ts
│   └── redisCache.ts
├── email/                             # Servizi email
│   ├── emailService.ts
│   └── templates/
├── media/                             # Servizi media
│   ├── imageService.ts
│   ├── uploadService.ts
│   └── storageService.ts
├── plugin/                            # Servizi plugin
│   ├── pluginRegistry.ts
│   ├── pluginLoader.ts
│   ├── pluginWorker.ts
│   ├── pluginMigrations.ts
│   ├── pluginPermissions.ts
│   └── pluginValidator.ts
├── theme/                             # Servizi temi
│   ├── themeService.ts
│   ├── themeRenderer.ts
│   └── themeValidator.ts
├── seo/                               # Servizi SEO
│   ├── seoService.ts
│   ├── metaTagsService.ts
│   └── sitemapService.ts
├── rbac/                              # Servizi RBAC
│   ├── permissionService.ts
│   ├── roleService.ts
│   └── accessControl.ts
└── [altri servizi...]
```

## 🛡️ Middleware

```
src/middleware/
├── auth.ts                            # Middleware autenticazione
├── cors.ts                            # CORS
├── errorHandler.ts                    # Gestione errori
├── logger.ts                          # Logging
├── rate-limiter.ts                    # Rate limiting
├── rbac.ts                            # RBAC middleware
├── validation.ts                      # Validazione
├── cache.ts                           # Cache
├── security.ts                        # Sicurezza
└── [altri middleware...]
```

## 🧰 Utilities

```
src/utils/
├── crypto.ts                          # Utility crittografia
├── date.ts                            # Utility date
├── filesystem.ts                      # Utility filesystem
├── hash.ts                            # Utility hash
├── logger.ts                          # Logger
├── sanitize.ts                        # Sanitizzazione
├── validation.ts                      # Validazione
├── slug.ts                            # Generazione slug
├── pagination.ts                      # Paginazione
└── [altre utility...]
```

## 📦 Library

```
src/lib/
├── cache/                             # Libreria cache
├── crypto/                            # Libreria crittografia
├── db/                                # Libreria database
├── email/                             # Libreria email
├── forms/                             # Libreria form
├── http/                              # Libreria HTTP
├── logger/                            # Libreria logger
├── media/                             # Libreria media
├── security/                          # Libreria sicurezza
├── validation/                        # Libreria validazione
└── [altre librerie...]
```

## 👨‍💼 Admin Panel

```
src/admin/
├── index.tsx                          # Entry point admin
├── App.tsx                            # App admin principale
├── routes/                            # Route admin
├── components/                        # Componenti admin
│   ├── Dashboard/
│   ├── Forms/
│   ├── Tables/
│   ├── Modals/
│   ├── Layout/
│   ├── Navigation/
│   └── UI/
├── pages/                             # Pagine admin
│   ├── Dashboard.tsx
│   ├── Posts/
│   ├── Pages/
│   ├── Media/
│   ├── Users/
│   ├── Settings/
│   ├── Plugins/
│   ├── Themes/
│   └── [altre pagine...]
├── hooks/                             # React hooks
├── services/                          # Servizi admin
├── utils/                             # Utility admin
└── styles/                            # Stili admin
```

## 🧩 Widgets

```
src/widgets/
├── registry.ts                        # Registro widget
├── types.ts                           # Type definitions
├── RecentPostsWidget.tsx              # Widget post recenti
├── CategoriesWidget.tsx               # Widget categorie
├── TagsWidget.tsx                     # Widget tag
├── SearchWidget.tsx                   # Widget ricerca
└── CustomHtmlWidget.tsx               # Widget HTML custom
```

## 🔧 Components

```
src/components/
└── shared/                            # Componenti condivisi
    ├── Button.tsx
    ├── Input.tsx
    ├── Modal.tsx
    └── [altri componenti...]
```

## 📝 Config

```
src/config/
├── app.ts                             # Configurazione app
├── database.ts                        # Configurazione database
├── email.ts                           # Configurazione email
└── cache.ts                           # Configurazione cache
```

## 🧪 Tests

```
tests/
├── unit/                              # Test unitari
├── integration/                       # Test integrazione
├── e2e/                              # Test end-to-end
└── fixtures/                          # Fixture test
```

## 🌐 Public & Static

```
├── public/                            # File pubblici
│   └── uploads/                       # Upload utenti
├── static/                            # File statici
│   └── assets/                        # Asset statici
└── uploads/                           # Directory upload (root)
```

## 💾 Data & Backups

```
├── data/                              # Dati applicazione
└── backups/                           # Backup database
    ├── lexcms-full-2025-11-12T22-23-08-971Z.tar.gz
    ├── lexcms-full-2025-11-13T01-59-47-239Z.tar.gz
    ├── lexcms-full-2025-11-17T16-41-27-982Z.tar.gz
    └── [altri backup...]
```

## 🔨 Development

```
src/dev/
├── dev-server.ts                      # Development server
├── hot-reload.ts                      # Hot reload
└── [altri tool dev...]
```

## 📱 CLI

```
src/cli/
├── index.ts                           # CLI principale
├── commands/                          # Comandi CLI
└── utils/                             # Utility CLI
```

## 📊 Statistiche Progetto

- **Temi disponibili**: 6 (default, legal-premium, corporate, magazine, minimalist, base)
- **Plugin**: 3 (core-system, hello-world, lexslider)
- **Database supportati**: SQLite, MySQL, PostgreSQL
- **Lingue supportate**: EN, ES, AR
- **Framework**: Hono.js + Deno
- **ORM**: Drizzle
- **UI Admin**: React + TypeScript
- **Styling**: Tailwind CSS

## 🔑 Note Importanti

1. **Database**: Il sistema supporta multi-database tramite Drizzle ORM
2. **Plugin System**: Sistema completo con worker isolati, migrazioni e permissions
3. **Theme System**: Sistema di temi modulare con template, partials e assets
4. **RBAC**: Sistema completo di Role-Based Access Control
5. **Admin Panel**: Pannello amministrativo React-based
6. **Security**: Multiple layer di sicurezza con audit logging
