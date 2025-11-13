/**
 * Auto-Moderation Plugin Initialization
 * Configura e inicializa el plugin de moderación automática
 */

import { initAutoModeration } from './index.ts';
import type { AutoModerationConfig } from './config.ts';

/**
 * Configuración del plugin desde variables de entorno
 */
function getConfigFromEnv(): Partial<AutoModerationConfig> {
  const config: Partial<AutoModerationConfig> = {
    enabled: Deno.env.get('AUTO_MODERATION_ENABLED') !== 'false',
    strategy: (Deno.env.get('AUTO_MODERATION_STRATEGY') as any) || 'local-only',
  };

  // Configurar Akismet si hay API key
  const akismetKey = Deno.env.get('AKISMET_API_KEY');
  const akismetSite = Deno.env.get('AKISMET_SITE_URL');

  if (akismetKey && akismetSite) {
    config.services = {
      akismet: {
        apiKey: akismetKey,
        siteUrl: akismetSite,
      },
    };

    // Si hay Akismet configurado y no se especificó estrategia, usar híbrida
    if (!Deno.env.get('AUTO_MODERATION_STRATEGY')) {
      config.strategy = 'hybrid';
    }
  }

  // Configurar umbrales
  if (Deno.env.get('AUTO_MODERATION_SPAM_THRESHOLD')) {
    config.localDetector = {
      threshold: parseInt(Deno.env.get('AUTO_MODERATION_SPAM_THRESHOLD')!),
    };
  }

  if (Deno.env.get('AUTO_MODERATION_AUTO_APPROVE') === 'true') {
    config.actions = {
      ...(config.actions || {}),
      autoApprove: true,
      autoApproveThreshold: parseInt(Deno.env.get('AUTO_MODERATION_APPROVE_THRESHOLD') || '20'),
    };
  }

  if (Deno.env.get('AUTO_MODERATION_AUTO_SPAM') === 'true') {
    config.actions = {
      ...(config.actions || {}),
      autoMarkSpam: true,
      autoMarkSpamThreshold: parseInt(Deno.env.get('AUTO_MODERATION_SPAM_MARK_THRESHOLD') || '80'),
    };
  }

  return config;
}

/**
 * Inicializa el plugin con configuración desde env o personalizada
 */
export function setupAutoModeration(customConfig?: Partial<AutoModerationConfig>) {
  try {
    const envConfig = getConfigFromEnv();
    const finalConfig = { ...envConfig, ...customConfig };

    const plugin = initAutoModeration(finalConfig);

    console.log('[AutoModeration] Plugin initialized successfully', {
      enabled: finalConfig.enabled,
      strategy: finalConfig.strategy,
      hasAkismet: !!finalConfig.services?.akismet,
    });

    return plugin;
  } catch (error) {
    console.error('[AutoModeration] Failed to initialize plugin:', error);
    throw error;
  }
}

/**
 * Variables de entorno disponibles:
 *
 * AUTO_MODERATION_ENABLED=true|false
 *   - Habilita/deshabilita el plugin (default: true)
 *
 * AUTO_MODERATION_STRATEGY=local-only|service-only|hybrid
 *   - Estrategia de detección (default: local-only, o hybrid si hay Akismet)
 *
 * AKISMET_API_KEY=tu-api-key
 *   - API key de Akismet
 *
 * AKISMET_SITE_URL=https://tu-sitio.com
 *   - URL del sitio para Akismet
 *
 * AUTO_MODERATION_SPAM_THRESHOLD=70
 *   - Umbral de score para considerar spam (0-100, default: 70)
 *
 * AUTO_MODERATION_AUTO_APPROVE=true|false
 *   - Auto-aprobar comentarios con bajo score (default: false)
 *
 * AUTO_MODERATION_APPROVE_THRESHOLD=20
 *   - Score máximo para auto-aprobar (default: 20)
 *
 * AUTO_MODERATION_AUTO_SPAM=true|false
 *   - Auto-marcar como spam comentarios con alto score (default: false)
 *
 * AUTO_MODERATION_SPAM_MARK_THRESHOLD=80
 *   - Score mínimo para auto-marcar spam (default: 80)
 */
