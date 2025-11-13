/**
 * Auto-Moderation Plugin
 * Sistema inteligente de moderación automática para comentarios
 * Similar a Akismet de WordPress
 */

import { LocalSpamDetector } from './detector.ts';
import { AkismetService, createAkismetService } from './services/akismet.ts';
import type { AutoModerationConfig } from './config.ts';
import { defaultAutoModerationConfig, mergeConfig, validateConfig } from './config.ts';
import type { CommentData, SpamAnalysisResult } from './detector.ts';

export interface ModerationDecision {
  action: 'approve' | 'spam' | 'moderate';
  analysis: SpamAnalysisResult;
  appliedStrategy: string;
  timestamp: Date;
}

/**
 * Plugin de Moderación Automática
 */
export class AutoModerationPlugin {
  private config: AutoModerationConfig;
  private localDetector: LocalSpamDetector;
  private akismetService: AkismetService | null = null;
  private stats: {
    totalChecked: number;
    spamDetected: number;
    hamDetected: number;
    falsePositives: number;
    falseNegatives: number;
  } = {
    totalChecked: 0,
    spamDetected: 0,
    hamDetected: 0,
    falsePositives: 0,
    falseNegatives: 0,
  };

  constructor(userConfig?: Partial<AutoModerationConfig>) {
    // Merge con configuración por defecto
    this.config = mergeConfig(userConfig || {});

    // Validar configuración
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`);
    }

    // Inicializar detector local
    this.localDetector = new LocalSpamDetector(this.config.localDetector);

    // Inicializar Akismet si está configurado
    if (this.config.services.akismet) {
      this.akismetService = createAkismetService(this.config.services.akismet);
    }

    this.log('info', 'Auto-Moderation Plugin initialized', {
      strategy: this.config.strategy,
      hasAkismet: !!this.akismetService,
    });
  }

  /**
   * Verifica un comentario y retorna la decisión de moderación
   */
  async checkComment(comment: CommentData): Promise<ModerationDecision> {
    if (!this.config.enabled) {
      return {
        action: 'moderate',
        analysis: {
          isSpam: false,
          score: 0,
          confidence: 0,
          reasons: ['Plugin deshabilitado'],
          detectionMethod: 'disabled',
        },
        appliedStrategy: 'disabled',
        timestamp: new Date(),
      };
    }

    this.stats.totalChecked++;

    let analysis: SpamAnalysisResult;
    let appliedStrategy = this.config.strategy;

    try {
      switch (this.config.strategy) {
        case 'local-only':
          analysis = await this.localDetector.analyze(comment);
          break;

        case 'service-only':
          analysis = await this.checkWithService(comment);
          break;

        case 'hybrid':
          analysis = await this.checkHybrid(comment);
          break;

        default:
          throw new Error(`Strategy desconocida: ${this.config.strategy}`);
      }

      // Actualizar estadísticas
      if (analysis.isSpam) {
        this.stats.spamDetected++;
      } else {
        this.stats.hamDetected++;
      }

      // Determinar acción basada en el score
      const action = this.determineAction(analysis);

      // Log si está habilitado
      if (this.config.logging.saveDetectionLogs) {
        this.log('info', 'Comment checked', {
          action,
          score: analysis.score,
          confidence: analysis.confidence,
          reasons: analysis.reasons,
        });
      }

      return {
        action,
        analysis,
        appliedStrategy,
        timestamp: new Date(),
      };
    } catch (error) {
      this.log('error', 'Error checking comment', error);

      // En caso de error, enviar a moderación manual por seguridad
      return {
        action: 'moderate',
        analysis: {
          isSpam: false,
          score: 0,
          confidence: 0,
          reasons: [`Error: ${(error as Error).message}`],
          detectionMethod: 'error',
        },
        appliedStrategy: 'error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verifica con servicio externo (Akismet)
   */
  private async checkWithService(comment: CommentData): Promise<SpamAnalysisResult> {
    if (!this.akismetService) {
      throw new Error('No hay servicio externo configurado');
    }

    return await this.akismetService.checkComment(comment);
  }

  /**
   * Verifica en modo híbrido (local + servicio)
   */
  private async checkHybrid(comment: CommentData): Promise<SpamAnalysisResult> {
    // Ejecutar ambos detectores en paralelo
    const [localResult, serviceResult] = await Promise.all([
      this.localDetector.analyze(comment),
      this.checkWithService(comment),
    ]);

    // Si ambos coinciden, usar ese resultado con mayor confianza
    if (localResult.isSpam === serviceResult.isSpam) {
      const maxConfidence = Math.max(localResult.confidence, serviceResult.confidence);
      return {
        ...localResult,
        confidence: maxConfidence,
        reasons: [...localResult.reasons, ...serviceResult.reasons],
        detectionMethod: 'hybrid-consensus',
      };
    }

    // Si no coinciden, usar el de mayor confianza
    if (this.config.hybrid.useHighestConfidence) {
      const result = localResult.confidence > serviceResult.confidence
        ? localResult
        : serviceResult;

      return {
        ...result,
        detectionMethod: 'hybrid-highest-confidence',
        reasons: [
          ...result.reasons,
          `Otro detector: ${result === localResult ? serviceResult.detectionMethod : localResult.detectionMethod}`,
        ],
      };
    }

    // Usar promedio ponderado
    const { localWeight, serviceWeight } = this.config.hybrid;
    const weightedScore = (localResult.score * localWeight) + (serviceResult.score * serviceWeight);
    const weightedConfidence = (localResult.confidence * localWeight) + (serviceResult.confidence * serviceWeight);

    return {
      isSpam: weightedScore >= this.config.localDetector.threshold,
      score: Math.round(weightedScore),
      confidence: Math.round(weightedConfidence),
      reasons: [
        ...localResult.reasons.map(r => `[Local] ${r}`),
        ...serviceResult.reasons.map(r => `[Service] ${r}`),
      ],
      detectionMethod: 'hybrid-weighted',
    };
  }

  /**
   * Determina la acción basada en el análisis
   */
  private determineAction(analysis: SpamAnalysisResult): 'approve' | 'spam' | 'moderate' {
    const { score } = analysis;
    const { autoApprove, autoApproveThreshold, autoMarkSpam, autoMarkSpamThreshold } = this.config.actions;

    // Auto-aprobar si el score es muy bajo
    if (autoApprove && score <= autoApproveThreshold) {
      return 'approve';
    }

    // Auto-marcar como spam si el score es muy alto
    if (autoMarkSpam && score >= autoMarkSpamThreshold) {
      return 'spam';
    }

    // En el rango medio, enviar a moderación
    return 'moderate';
  }

  /**
   * Reporta un falso positivo (comentario legítimo marcado como spam)
   */
  async reportFalsePositive(comment: CommentData): Promise<void> {
    this.stats.falsePositives++;

    if (this.config.learning.enabled && this.config.learning.sendFeedback) {
      if (this.akismetService) {
        await this.akismetService.submitHam(comment);
        this.log('info', 'False positive reported to Akismet', { comment });
      }
    }

    // TODO: Actualizar modelo local basado en falso positivo
  }

  /**
   * Reporta un falso negativo (spam no detectado)
   */
  async reportFalseNegative(comment: CommentData): Promise<void> {
    this.stats.falseNegatives++;

    if (this.config.learning.enabled && this.config.learning.sendFeedback) {
      if (this.akismetService) {
        await this.akismetService.submitSpam(comment);
        this.log('info', 'False negative reported to Akismet', { comment });
      }

      // Actualizar blacklist local
      if (this.config.learning.updateBlacklist && comment.authorEmail) {
        const domain = comment.authorEmail.split('@')[1];
        if (domain && !this.config.localDetector.blacklist.domains.includes(domain)) {
          this.config.localDetector.blacklist.domains.push(domain);
          this.log('info', 'Domain added to blacklist', { domain });
        }
      }
    }
  }

  /**
   * Obtiene estadísticas del plugin
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Resetea estadísticas
   */
  resetStats(): void {
    this.stats = {
      totalChecked: 0,
      spamDetected: 0,
      hamDetected: 0,
      falsePositives: 0,
      falseNegatives: 0,
    };
  }

  /**
   * Actualiza configuración
   */
  updateConfig(newConfig: Partial<AutoModerationConfig>): void {
    const merged = mergeConfig(newConfig);
    const validation = validateConfig(merged);

    if (!validation.valid) {
      throw new Error(`Configuración inválida: ${validation.errors.join(', ')}`);
    }

    this.config = merged;

    // Actualizar detector local
    this.localDetector.updateConfig(this.config.localDetector);

    // Recrear Akismet si cambió la configuración
    if (this.config.services.akismet) {
      this.akismetService = createAkismetService(this.config.services.akismet);
    } else {
      this.akismetService = null;
    }

    this.log('info', 'Configuration updated', { config: this.config });
  }

  /**
   * Obtiene configuración actual
   */
  getConfig(): AutoModerationConfig {
    return { ...this.config };
  }

  /**
   * Verifica si Akismet está configurado y funcional
   */
  async verifyAkismetKey(): Promise<boolean> {
    if (!this.akismetService) {
      return false;
    }

    return await this.akismetService.verifyKey();
  }

  /**
   * Logger interno
   */
  private log(level: 'info' | 'error', message: string, data?: unknown): void {
    if (!this.config.logging.enabled) return;

    const logLevel = this.config.logging.level;
    if (logLevel === 'none') return;
    if (logLevel === 'errors' && level !== 'error') return;

    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    if (level === 'error') {
      console.error('[AutoModeration]', logData);
    } else {
      console.log('[AutoModeration]', logData);
    }
  }
}

/**
 * Instancia global del plugin (singleton)
 */
let pluginInstance: AutoModerationPlugin | null = null;

/**
 * Inicializa el plugin globalmente
 */
export function initAutoModeration(config?: Partial<AutoModerationConfig>): AutoModerationPlugin {
  if (pluginInstance) {
    pluginInstance.updateConfig(config || {});
  } else {
    pluginInstance = new AutoModerationPlugin(config);
  }

  return pluginInstance;
}

/**
 * Obtiene la instancia del plugin
 */
export function getAutoModeration(): AutoModerationPlugin | null {
  return pluginInstance;
}

// Exportar tipos y configuración por defecto
export { defaultAutoModerationConfig };
export type { AutoModerationConfig, CommentData, SpamAnalysisResult, ModerationDecision };
