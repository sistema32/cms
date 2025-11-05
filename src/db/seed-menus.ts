import { db } from "../config/db.ts";
import { menus, menuItems } from "./schema.ts";

/**
 * ============================================
 * SEED MENUS
 * ============================================
 * Script para crear menús de ejemplo con jerarquía completa
 */

console.log("🌱 Seeding menus...\n");

try {
  // ============= 1. CREAR MENÚS =============
  console.log("1️⃣  Creando menús...");

  // Menú Principal (Header)
  const [mainMenu] = await db
    .insert(menus)
    .values({
      name: "Menú Principal",
      slug: "main-menu",
      description: "Menú principal del sitio web (header)",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  // Menú Footer
  const [footerMenu] = await db
    .insert(menus)
    .values({
      name: "Menú Footer",
      slug: "footer-menu",
      description: "Menú del pie de página",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  // Menú Sidebar
  const [sidebarMenu] = await db
    .insert(menus)
    .values({
      name: "Menú Sidebar",
      slug: "sidebar-menu",
      description: "Menú lateral para blogs",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  // Menú Mobile
  const [mobileMenu] = await db
    .insert(menus)
    .values({
      name: "Menú Mobile",
      slug: "mobile-menu",
      description: "Menú optimizado para móviles",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  console.log(`   ✓ ${mainMenu ? 1 : 0} menús creados\n`);

  // ============= 2. CREAR ITEMS DEL MENÚ PRINCIPAL =============
  if (mainMenu) {
    console.log("2️⃣  Creando items del Menú Principal...");

    // Nivel 1: Inicio (URL manual)
    const [homeItem] = await db
      .insert(menuItems)
      .values({
        menuId: mainMenu.id,
        label: "Inicio",
        title: "Página de inicio",
        url: "/",
        icon: "🏠",
        target: "_self",
        order: 1,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning();

    // Nivel 1: Nosotros (contenido - asumiendo que existe content con ID 1)
    const [aboutItem] = await db
      .insert(menuItems)
      .values({
        menuId: mainMenu.id,
        label: "Nosotros",
        title: "Acerca de nosotros",
        contentId: 1,
        icon: "👥",
        target: "_self",
        order: 2,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning();

    // Nivel 1: Blog (categoría - asumiendo que existe category con ID 1)
    const [blogItem] = await db
      .insert(menuItems)
      .values({
        menuId: mainMenu.id,
        label: "Blog",
        title: "Nuestro blog",
        categoryId: 1,
        icon: "📝",
        target: "_self",
        order: 3,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning();

    // Nivel 2 (Hijo de Blog): Tecnología
    if (blogItem) {
      await db
        .insert(menuItems)
        .values({
          menuId: mainMenu.id,
          parentId: blogItem.id,
          label: "Tecnología",
          title: "Artículos de tecnología",
          categoryId: 1, // Categoría Tecnología
          icon: "💻",
          target: "_self",
          order: 1,
          isVisible: true,
        })
        .onConflictDoNothing();

      // Nivel 2: Diseño
      await db
        .insert(menuItems)
        .values({
          menuId: mainMenu.id,
          parentId: blogItem.id,
          label: "Diseño",
          title: "Artículos de diseño",
          categoryId: 2, // Categoría Diseño
          icon: "🎨",
          target: "_self",
          order: 2,
          isVisible: true,
        })
        .onConflictDoNothing();

      // Nivel 2: Negocios
      await db
        .insert(menuItems)
        .values({
          menuId: mainMenu.id,
          parentId: blogItem.id,
          label: "Negocios",
          title: "Artículos de negocios",
          categoryId: 3, // Categoría Negocios
          icon: "💼",
          target: "_self",
          order: 3,
          isVisible: true,
        })
        .onConflictDoNothing();
    }

    // Nivel 1: Servicios
    const [servicesItem] = await db
      .insert(menuItems)
      .values({
        menuId: mainMenu.id,
        label: "Servicios",
        title: "Nuestros servicios",
        url: "/servicios",
        icon: "⚙️",
        target: "_self",
        order: 4,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning();

    // Nivel 2 (Hijos de Servicios)
    if (servicesItem) {
      await db
        .insert(menuItems)
        .values({
          menuId: mainMenu.id,
          parentId: servicesItem.id,
          label: "Desarrollo Web",
          title: "Desarrollo web profesional",
          url: "/servicios/desarrollo-web",
          icon: "🌐",
          target: "_self",
          order: 1,
          isVisible: true,
        })
        .onConflictDoNothing();

      await db
        .insert(menuItems)
        .values({
          menuId: mainMenu.id,
          parentId: servicesItem.id,
          label: "Diseño UX/UI",
          title: "Diseño de experiencia de usuario",
          url: "/servicios/diseno-ux-ui",
          icon: "🎯",
          target: "_self",
          order: 2,
          isVisible: true,
        })
        .onConflictDoNothing();

      await db
        .insert(menuItems)
        .values({
          menuId: mainMenu.id,
          parentId: servicesItem.id,
          label: "Consultoría",
          title: "Consultoría tecnológica",
          url: "/servicios/consultoria",
          icon: "💡",
          target: "_self",
          order: 3,
          isVisible: true,
        })
        .onConflictDoNothing();
    }

    // Nivel 1: Contacto
    await db
      .insert(menuItems)
      .values({
        menuId: mainMenu.id,
        label: "Contacto",
        title: "Contáctanos",
        url: "/contacto",
        icon: "📧",
        target: "_self",
        order: 5,
        isVisible: true,
      })
      .onConflictDoNothing();

    console.log("   ✓ Items del menú principal creados\n");
  }

  // ============= 3. CREAR ITEMS DEL MENÚ FOOTER =============
  if (footerMenu) {
    console.log("3️⃣  Creando items del Menú Footer...");

    // Columna 1: Empresa
    const [companyColumn] = await db
      .insert(menuItems)
      .values({
        menuId: footerMenu.id,
        label: "Empresa",
        title: "Sobre nuestra empresa",
        url: "#",
        cssClass: "footer-column",
        order: 1,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning();

    if (companyColumn) {
      await db
        .insert(menuItems)
        .values([
          {
            menuId: footerMenu.id,
            parentId: companyColumn.id,
            label: "Quiénes somos",
            url: "/about",
            order: 1,
            isVisible: true,
          },
          {
            menuId: footerMenu.id,
            parentId: companyColumn.id,
            label: "Equipo",
            url: "/team",
            order: 2,
            isVisible: true,
          },
          {
            menuId: footerMenu.id,
            parentId: companyColumn.id,
            label: "Carreras",
            url: "/careers",
            order: 3,
            isVisible: true,
          },
        ])
        .onConflictDoNothing();
    }

    // Columna 2: Legal
    const [legalColumn] = await db
      .insert(menuItems)
      .values({
        menuId: footerMenu.id,
        label: "Legal",
        title: "Información legal",
        url: "#",
        cssClass: "footer-column",
        order: 2,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning();

    if (legalColumn) {
      await db
        .insert(menuItems)
        .values([
          {
            menuId: footerMenu.id,
            parentId: legalColumn.id,
            label: "Privacidad",
            url: "/privacy",
            order: 1,
            isVisible: true,
          },
          {
            menuId: footerMenu.id,
            parentId: legalColumn.id,
            label: "Términos",
            url: "/terms",
            order: 2,
            isVisible: true,
          },
          {
            menuId: footerMenu.id,
            parentId: legalColumn.id,
            label: "Cookies",
            url: "/cookies",
            order: 3,
            isVisible: true,
          },
        ])
        .onConflictDoNothing();
    }

    // Columna 3: Social (con requiredPermission - solo visible si está autenticado)
    await db
      .insert(menuItems)
      .values([
        {
          menuId: footerMenu.id,
          label: "Twitter",
          url: "https://twitter.com/ejemplo",
          icon: "🐦",
          target: "_blank",
          cssClass: "social-link",
          order: 3,
          isVisible: true,
        },
        {
          menuId: footerMenu.id,
          label: "LinkedIn",
          url: "https://linkedin.com/company/ejemplo",
          icon: "💼",
          target: "_blank",
          cssClass: "social-link",
          order: 4,
          isVisible: true,
        },
      ])
      .onConflictDoNothing();

    console.log("   ✓ Items del menú footer creados\n");
  }

  // ============= 4. CREAR ITEMS DEL MENÚ SIDEBAR =============
  if (sidebarMenu) {
    console.log("4️⃣  Creando items del Menú Sidebar...");

    await db
      .insert(menuItems)
      .values([
        {
          menuId: sidebarMenu.id,
          label: "Categorías",
          title: "Ver todas las categorías",
          url: "/categorias",
          icon: "📂",
          order: 1,
          isVisible: true,
        },
        {
          menuId: sidebarMenu.id,
          label: "Tags",
          title: "Ver todos los tags",
          tagId: 1,
          icon: "🏷️",
          order: 2,
          isVisible: true,
        },
        {
          menuId: sidebarMenu.id,
          label: "Archivo",
          title: "Archivo del blog",
          url: "/archivo",
          icon: "📅",
          order: 3,
          isVisible: true,
        },
      ])
      .onConflictDoNothing();

    console.log("   ✓ Items del menú sidebar creados\n");
  }

  // ============= 5. CREAR ITEMS DEL MENÚ MOBILE =============
  if (mobileMenu) {
    console.log("5️⃣  Creando items del Menú Mobile...");

    // Menú mobile simplificado (sin jerarquía profunda)
    await db
      .insert(menuItems)
      .values([
        {
          menuId: mobileMenu.id,
          label: "Inicio",
          url: "/",
          icon: "🏠",
          order: 1,
          isVisible: true,
        },
        {
          menuId: mobileMenu.id,
          label: "Blog",
          categoryId: 1,
          icon: "📝",
          order: 2,
          isVisible: true,
        },
        {
          menuId: mobileMenu.id,
          label: "Servicios",
          url: "/servicios",
          icon: "⚙️",
          order: 3,
          isVisible: true,
        },
        {
          menuId: mobileMenu.id,
          label: "Contacto",
          url: "/contacto",
          icon: "📧",
          order: 4,
          isVisible: true,
        },
      ])
      .onConflictDoNothing();

    console.log("   ✓ Items del menú mobile creados\n");
  }

  console.log("✅ Seed de menús completado exitosamente!");
  console.log("\n📋 Resumen:");
  console.log("   - 4 menús creados (main-menu, footer-menu, sidebar-menu, mobile-menu)");
  console.log("   - Menú principal con jerarquía de 2 niveles");
  console.log("   - Menú footer con columnas organizadas");
  console.log("   - Menú sidebar con enlaces útiles");
  console.log("   - Menú mobile simplificado");
  console.log("\n🔗 Tipos de enlaces usados:");
  console.log("   - URLs manuales");
  console.log("   - Enlaces a contenido (contentId)");
  console.log("   - Enlaces a categorías (categoryId)");
  console.log("   - Enlaces a tags (tagId)");
} catch (error) {
  console.error("❌ Error en seed de menús:", error);
  Deno.exit(1);
}

Deno.exit(0);
