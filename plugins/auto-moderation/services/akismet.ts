/**
 * Auto-Moderation Plugin - Akismet API Integration
 * Integración con el servicio Akismet de Automattic
 * Docs: https://akismet.com/developers/
 */

import type { CommentData, SpamAnalysisResult } from '../detector.ts';

export interface AkismetConfig {
  apiKey: string;
  blogUrl: string;
  isTest?: boolean; // Para testing
}

/**
 * Cliente de Akismet API
 */
export class AkismetService {
  private config: AkismetConfig;
  private baseUrl = 'https://{key}.rest.akismet.com/1.1/';

  constructor(config: AkismetConfig) {
    this.config = config;
  }

  /**
   * Verifica que la API key sea válida
   */
  async verifyKey(): Promise<boolean> {
    try {
      const url = 'https://rest.akismet.com/1.1/verify-key';
      const formData = new URLSearchParams();
      formData.append('key', this.config.apiKey);
      formData.append('blog', this.config.blogUrl);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = await response.text();
      return result === 'valid';
    } catch (error) {
      console.error('Akismet verify key error:', error);
      return false;
    }
  }

  /**
   * Verifica si un comentario es spam
   */
  async checkComment(comment: CommentData): Promise<SpamAnalysisResult> {
    try {
      const url = this.baseUrl.replace('{key}', this.config.apiKey) + 'comment-check';

      const formData = new URLSearchParams();
      formData.append('blog', this.config.blogUrl);
      formData.append('user_ip', comment.ipAddress || '');
      formData.append('user_agent', comment.userAgent || '');
      formData.append('comment_type', 'comment');
      formData.append('comment_author', comment.authorName || '');
      formData.append('comment_author_email', comment.authorEmail || '');
      formData.append('comment_author_url', comment.authorWebsite || '');
      formData.append('comment_content', comment.body);

      if (this.config.isTest) {
        formData.append('is_test', '1');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const isSpam = await response.text();
      const proTip = response.headers.get('x-akismet-pro-tip');
      const debugHelp = response.headers.get('x-akismet-debug-help');

      // Calcular score y confidence basado en la respuesta
      let score = 0;
      let confidence = 80;
      const reasons: string[] = [];

      if (isSpam === 'true') {
        score = 100;
        confidence = 90;
        reasons.push('Detectado como spam por Akismet');

        if (proTip === 'discard') {
          reasons.push('Recomendación: descartar inmediatamente');
          confidence = 100;
        }
      } else if (isSpam === 'false') {
        score = 0;
        confidence = 85;
        reasons.push('No es spam según Akismet');
      }

      if (debugHelp) {
        reasons.push(`Debug: ${debugHelp}`);
      }

      return {
        isSpam: isSpam === 'true',
        score,
        confidence,
        reasons,
        detectionMethod: 'akismet',
      };
    } catch (error) {
      console.error('Akismet check comment error:', error);

      // En caso de error, retornar resultado neutral
      return {
        isSpam: false,
        score: 0,
        confidence: 0,
        reasons: ['Error al conectar con Akismet: ' + (error as Error).message],
        detectionMethod: 'akismet-error',
      };
    }
  }

  /**
   * Reporta un falso positivo a Akismet (comentario marcado como spam pero es legítimo)
   */
  async submitHam(comment: CommentData): Promise<boolean> {
    try {
      const url = this.baseUrl.replace('{key}', this.config.apiKey) + 'submit-ham';

      const formData = new URLSearchParams();
      formData.append('blog', this.config.blogUrl);
      formData.append('user_ip', comment.ipAddress || '');
      formData.append('user_agent', comment.userAgent || '');
      formData.append('comment_type', 'comment');
      formData.append('comment_author', comment.authorName || '');
      formData.append('comment_author_email', comment.authorEmail || '');
      formData.append('comment_author_url', comment.authorWebsite || '');
      formData.append('comment_content', comment.body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      return response.ok;
    } catch (error) {
      console.error('Akismet submit ham error:', error);
      return false;
    }
  }

  /**
   * Reporta un falso negativo a Akismet (spam que no fue detectado)
   */
  async submitSpam(comment: CommentData): Promise<boolean> {
    try {
      const url = this.baseUrl.replace('{key}', this.config.apiKey) + 'submit-spam';

      const formData = new URLSearchParams();
      formData.append('blog', this.config.blogUrl);
      formData.append('user_ip', comment.ipAddress || '');
      formData.append('user_agent', comment.userAgent || '');
      formData.append('comment_type', 'comment');
      formData.append('comment_author', comment.authorName || '');
      formData.append('comment_author_email', comment.authorEmail || '');
      formData.append('comment_author_url', comment.authorWebsite || '');
      formData.append('comment_content', comment.body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      return response.ok;
    } catch (error) {
      console.error('Akismet submit spam error:', error);
      return false;
    }
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<AkismetConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): AkismetConfig {
    return { ...this.config };
  }
}

/**
 * Crea una instancia de AkismetService si hay configuración válida
 */
export function createAkismetService(config?: AkismetConfig): AkismetService | null {
  if (!config || !config.apiKey || !config.blogUrl) {
    return null;
  }

  return new AkismetService(config);
}
