/**
 * Auto-Moderation Plugin - Configuration
 * Configuración central del plugin de moderación automática
 */

import type { DetectorConfig } from './detector.ts';
import type { AkismetConfig } from './services/akismet.ts';

export interface AutoModerationConfig {
  // General
  enabled: boolean;
  version: string;

  // Local Detector
  localDetector: DetectorConfig;

  // External Services
  services: {
    akismet?: AkismetConfig;
    // Futuro: otros servicios como Google Perspective API, etc.
  };

  // Estrategia de detección
  strategy: 'local-only' | 'service-only' | 'hybrid';

  // En modo hybrid, cómo combinar resultados
  hybrid: {
    // Si ambos detectores coinciden, usar ese resultado
    // Si no, usar el que tenga mayor confianza
    useHighestConfidence: boolean;
    // Peso de cada detector (0-1)
    localWeight: number;
    serviceWeight: number;
  };

  // Acciones automáticas
  actions: {
    // Auto-aprobar si score < threshold
    autoApprove: boolean;
    autoApproveThreshold: number; // Score <= X se auto-aprueba

    // Auto-marcar como spam si score > threshold
    autoMarkSpam: boolean;
    autoMarkSpamThreshold: number; // Score >= X se marca spam

    // Enviar a moderación si está en el rango medio
    sendToModeration: boolean;
  };

  // Learning (aprendizaje)
  learning: {
    enabled: boolean;
    // Enviar feedback a servicios externos cuando admin modera
    sendFeedback: boolean;
    // Actualizar blacklist local basado en patrones detectados
    updateBlacklist: boolean;
  };

  // Estadísticas
  stats: {
    enabled: boolean;
    // Guardar estadísticas de detección
    trackDetections: boolean;
    trackFalsePositives: boolean;
    trackFalseNegatives: boolean;
  };

  // Logging
  logging: {
    enabled: boolean;
    level: 'none' | 'errors' | 'all';
    // Guardar logs de detecciones para debugging
    saveDetectionLogs: boolean;
  };
}

/**
 * Configuración por defecto del plugin
 */
export const defaultAutoModerationConfig: AutoModerationConfig = {
  enabled: true,
  version: '1.0.0',

  localDetector: {
    enabled: true,
    sensitivity: 'medium',
    autoModerate: true,
    threshold: 60,
    whitelist: {
      ips: [],
      emails: [],
      domains: [],
    },
    blacklist: {
      ips: [],
      emails: [],
      domains: [],
      keywords: [
        // Medicamentos
        'viagra', 'cialis', 'levitra', 'pharmacy', 'pills', 'meds',
        // Juegos de azar
        'casino', 'poker', 'gambling', 'bet', 'lottery',
        // Finanzas sospechosas
        'forex', 'binary options', 'cryptocurrency scam',
        // Productos sospechosos
        'replica', 'fake', 'counterfeit',
        // Spam común
        'buy now', 'click here', 'limited time', 'act now',
        'make money', 'work from home', 'earn cash',
      ],
    },
  },

  services: {
    // Akismet deshabilitado por defecto (requiere API key)
    akismet: undefined,
  },

  strategy: 'local-only', // Cambiar a 'hybrid' si se configura Akismet

  hybrid: {
    useHighestConfidence: true,
    localWeight: 0.4,
    serviceWeight: 0.6,
  },

  actions: {
    autoApprove: false, // Por seguridad, requerir moderación manual
    autoApproveThreshold: 20,

    autoMarkSpam: true,
    autoMarkSpamThreshold: 80, // Solo marcar spam si está muy seguro

    sendToModeration: true, // Scores entre 20-80 van a moderación
  },

  learning: {
    enabled: true,
    sendFeedback: true,
    updateBlacklist: true,
  },

  stats: {
    enabled: true,
    trackDetections: true,
    trackFalsePositives: true,
    trackFalseNegatives: true,
  },

  logging: {
    enabled: true,
    level: 'errors',
    saveDetectionLogs: false, // Solo en producción si es necesario
  },
};

/**
 * Validar configuración
 */
export function validateConfig(config: Partial<AutoModerationConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar strategy
  if (config.strategy) {
    const validStrategies = ['local-only', 'service-only', 'hybrid'];
    if (!validStrategies.includes(config.strategy)) {
      errors.push(`Strategy inválida: ${config.strategy}`);
    }

    // Si es service-only o hybrid, debe haber al menos un servicio configurado
    if ((config.strategy === 'service-only' || config.strategy === 'hybrid')) {
      if (!config.services?.akismet?.apiKey) {
        errors.push('Strategy requiere servicio externo pero no hay API key configurada');
      }
    }
  }

  // Validar thresholds
  if (config.actions) {
    const { autoApproveThreshold, autoMarkSpamThreshold } = config.actions;

    if (autoApproveThreshold !== undefined && (autoApproveThreshold < 0 || autoApproveThreshold > 100)) {
      errors.push('autoApproveThreshold debe estar entre 0-100');
    }

    if (autoMarkSpamThreshold !== undefined && (autoMarkSpamThreshold < 0 || autoMarkSpamThreshold > 100)) {
      errors.push('autoMarkSpamThreshold debe estar entre 0-100');
    }

    if (autoApproveThreshold !== undefined && autoMarkSpamThreshold !== undefined) {
      if (autoApproveThreshold >= autoMarkSpamThreshold) {
        errors.push('autoApproveThreshold debe ser menor que autoMarkSpamThreshold');
      }
    }
  }

  // Validar weights en hybrid
  if (config.hybrid) {
    const { localWeight, serviceWeight } = config.hybrid;

    if (localWeight !== undefined && (localWeight < 0 || localWeight > 1)) {
      errors.push('localWeight debe estar entre 0-1');
    }

    if (serviceWeight !== undefined && (serviceWeight < 0 || serviceWeight > 1)) {
      errors.push('serviceWeight debe estar entre 0-1');
    }

    if (localWeight !== undefined && serviceWeight !== undefined) {
      const sum = localWeight + serviceWeight;
      if (Math.abs(sum - 1) > 0.01) {
        errors.push('localWeight + serviceWeight debe sumar 1');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge configuración con defaults
 */
export function mergeConfig(
  userConfig: Partial<AutoModerationConfig>,
): AutoModerationConfig {
  return {
    ...defaultAutoModerationConfig,
    ...userConfig,
    localDetector: {
      ...defaultAutoModerationConfig.localDetector,
      ...userConfig.localDetector,
    },
    services: {
      ...defaultAutoModerationConfig.services,
      ...userConfig.services,
    },
    strategy: userConfig.strategy || defaultAutoModerationConfig.strategy,
    hybrid: {
      ...defaultAutoModerationConfig.hybrid,
      ...userConfig.hybrid,
    },
    actions: {
      ...defaultAutoModerationConfig.actions,
      ...userConfig.actions,
    },
    learning: {
      ...defaultAutoModerationConfig.learning,
      ...userConfig.learning,
    },
    stats: {
      ...defaultAutoModerationConfig.stats,
      ...userConfig.stats,
    },
    logging: {
      ...defaultAutoModerationConfig.logging,
      ...userConfig.logging,
    },
  };
}
