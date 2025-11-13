/**
 * Auto-Moderation Plugin - Spam Detector
 * Sistema de detección de spam con múltiples estrategias
 */

export interface CommentData {
  authorName?: string | null;
  authorEmail?: string | null;
  authorWebsite?: string | null;
  body: string;
  ipAddress?: string;
  userAgent?: string;
  authorId?: number | null;
}

export interface SpamAnalysisResult {
  isSpam: boolean;
  score: number; // 0-100, donde 100 = definitivamente spam
  confidence: number; // 0-100, qué tan seguro está el detector
  reasons: string[]; // Razones por las que se clasificó como spam
  detectionMethod: string; // Qué método detectó el spam
}

export interface DetectorConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  autoModerate: boolean; // Si es true, marca como spam automáticamente
  threshold: number; // Score mínimo para considerar spam (0-100)
  whitelist: {
    ips: string[];
    emails: string[];
    domains: string[];
  };
  blacklist: {
    ips: string[];
    emails: string[];
    domains: string[];
    keywords: string[];
  };
}

/**
 * Detector de Spam Local (sin API externa)
 */
export class LocalSpamDetector {
  private config: DetectorConfig;

  constructor(config: DetectorConfig) {
    this.config = config;
  }

  /**
   * Analiza un comentario y retorna el resultado
   */
  async analyze(comment: CommentData): Promise<SpamAnalysisResult> {
    const reasons: string[] = [];
    let score = 0;
    let detectionMethod = 'local';

    // 1. Verificar whitelist primero
    if (this.isWhitelisted(comment)) {
      return {
        isSpam: false,
        score: 0,
        confidence: 100,
        reasons: ['En whitelist'],
        detectionMethod: 'whitelist',
      };
    }

    // 2. Verificar blacklist
    if (this.isBlacklisted(comment)) {
      return {
        isSpam: true,
        score: 100,
        confidence: 100,
        reasons: ['En blacklist'],
        detectionMethod: 'blacklist',
      };
    }

    // 3. Análisis de contenido
    const contentScore = this.analyzeContent(comment.body, reasons);
    score += contentScore;

    // 4. Análisis de autor
    const authorScore = this.analyzeAuthor(comment, reasons);
    score += authorScore;

    // 5. Análisis de patrones de spam
    const patternScore = this.analyzePatterns(comment, reasons);
    score += patternScore;

    // 6. Análisis de enlaces
    const linkScore = this.analyzeLinks(comment.body, reasons);
    score += linkScore;

    // 7. Análisis de caracteres sospechosos
    const charScore = this.analyzeSuspiciousChars(comment.body, reasons);
    score += charScore;

    // Normalizar score (0-100)
    score = Math.min(100, Math.max(0, score));

    // Calcular confianza basada en número de razones
    const confidence = Math.min(100, reasons.length * 20);

    // Determinar si es spam basado en threshold
    const isSpam = score >= this.config.threshold;

    return {
      isSpam,
      score,
      confidence,
      reasons,
      detectionMethod,
    };
  }

  /**
   * Verifica si el comentario está en whitelist
   */
  private isWhitelisted(comment: CommentData): boolean {
    // Verificar IP
    if (comment.ipAddress && this.config.whitelist.ips.includes(comment.ipAddress)) {
      return true;
    }

    // Verificar email
    if (comment.authorEmail && this.config.whitelist.emails.includes(comment.authorEmail)) {
      return true;
    }

    // Verificar dominio del email
    if (comment.authorEmail) {
      const domain = comment.authorEmail.split('@')[1];
      if (domain && this.config.whitelist.domains.includes(domain)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si el comentario está en blacklist
   */
  private isBlacklisted(comment: CommentData): boolean {
    // Verificar IP
    if (comment.ipAddress && this.config.blacklist.ips.includes(comment.ipAddress)) {
      return true;
    }

    // Verificar email
    if (comment.authorEmail && this.config.blacklist.emails.includes(comment.authorEmail)) {
      return true;
    }

    // Verificar dominio del email
    if (comment.authorEmail) {
      const domain = comment.authorEmail.split('@')[1];
      if (domain && this.config.blacklist.domains.includes(domain)) {
        return true;
      }
    }

    // Verificar keywords en el contenido
    const bodyLower = comment.body.toLowerCase();
    for (const keyword of this.config.blacklist.keywords) {
      if (bodyLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Analiza el contenido del comentario
   */
  private analyzeContent(body: string, reasons: string[]): number {
    let score = 0;

    // Comentario muy corto (posible spam)
    if (body.length < 10) {
      reasons.push('Comentario muy corto (<10 caracteres)');
      score += 30;
    }

    // Comentario extremadamente largo (posible spam)
    if (body.length > 5000) {
      reasons.push('Comentario extremadamente largo (>5000 caracteres)');
      score += 20;
    }

    // Muchas mayúsculas (GRITANDO)
    const upperCaseRatio = (body.match(/[A-Z]/g) || []).length / body.length;
    if (upperCaseRatio > 0.5 && body.length > 20) {
      reasons.push('Demasiadas mayúsculas (posible spam)');
      score += 25;
    }

    // Muchos signos de exclamación/interrogación
    const exclamationCount = (body.match(/[!?]/g) || []).length;
    if (exclamationCount > 5) {
      reasons.push(`Demasiados signos de exclamación/interrogación (${exclamationCount})`);
      score += 15;
    }

    return score;
  }

  /**
   * Analiza información del autor
   */
  private analyzeAuthor(comment: CommentData, reasons: string[]): number {
    let score = 0;

    // Email temporal/desechable
    const tempEmailDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com',
      'mailinator.com', 'throwaway.email', 'temp-mail.org',
    ];

    if (comment.authorEmail) {
      const domain = comment.authorEmail.split('@')[1];
      if (domain && tempEmailDomains.includes(domain.toLowerCase())) {
        reasons.push('Email temporal/desechable detectado');
        score += 40;
      }

      // Email sospechoso (muchos números o caracteres aleatorios)
      const emailPart = comment.authorEmail.split('@')[0];
      const numberRatio = (emailPart.match(/\d/g) || []).length / emailPart.length;
      if (numberRatio > 0.7) {
        reasons.push('Email con demasiados números (posible generado)');
        score += 20;
      }
    }

    // Nombre sospechoso
    if (comment.authorName) {
      const name = comment.authorName.toLowerCase();

      // Nombres muy cortos
      if (name.length < 2) {
        reasons.push('Nombre muy corto');
        score += 10;
      }

      // Nombres con muchos números
      const nameNumberRatio = (name.match(/\d/g) || []).length / name.length;
      if (nameNumberRatio > 0.5) {
        reasons.push('Nombre con demasiados números');
        score += 15;
      }

      // Nombres comunes de spam
      const spamNames = ['admin', 'test', 'user', 'guest', 'viagra', 'casino', 'poker'];
      if (spamNames.some(spam => name.includes(spam))) {
        reasons.push('Nombre sospechoso común en spam');
        score += 25;
      }
    }

    return score;
  }

  /**
   * Analiza patrones comunes de spam
   */
  private analyzePatterns(comment: CommentData, reasons: string[]): number {
    let score = 0;
    const bodyLower = comment.body.toLowerCase();

    // Patrones de spam comunes
    const spamPatterns = [
      { pattern: /\b(buy|purchase|order)\s+(now|today|here)\b/gi, score: 30, name: 'Call to action de compra' },
      { pattern: /\b(click|visit|check)\s+(here|now|this|link)\b/gi, score: 25, name: 'Call to action de click' },
      { pattern: /\b(earn|make)\s+(\$|money|cash)\b/gi, score: 35, name: 'Promesa de dinero' },
      { pattern: /\b(work\s+from\s+home|make\s+money\s+online)\b/gi, score: 35, name: 'Trabajo desde casa' },
      { pattern: /\b(free|gratis)\s+(trial|shipping|download)\b/gi, score: 20, name: 'Oferta gratis' },
      { pattern: /\b(viagra|cialis|pharmacy|pills)\b/gi, score: 50, name: 'Medicamentos' },
      { pattern: /\b(casino|poker|gambling|bet)\b/gi, score: 40, name: 'Juegos de azar' },
      { pattern: /\b(weight\s+loss|lose\s+weight|diet\s+pills)\b/gi, score: 30, name: 'Pérdida de peso' },
      { pattern: /\b(limited\s+time|act\s+now|expires\s+soon)\b/gi, score: 25, name: 'Urgencia artificial' },
      { pattern: /\b100%\s+(free|guaranteed|real|legit)\b/gi, score: 25, name: 'Garantías exageradas' },
    ];

    for (const { pattern, score: patternScore, name } of spamPatterns) {
      if (pattern.test(bodyLower)) {
        reasons.push(`Patrón de spam detectado: ${name}`);
        score += patternScore;
      }
    }

    return score;
  }

  /**
   * Analiza enlaces en el contenido
   */
  private analyzeLinks(body: string, reasons: string[]): number {
    let score = 0;

    // Detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = body.match(urlRegex) || [];

    // Muchos enlaces
    if (urls.length > 3) {
      reasons.push(`Demasiados enlaces (${urls.length})`);
      score += urls.length * 10;
    }

    // Enlaces acortados (sospechosos)
    const shortenerDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'];
    const shortLinks = urls.filter(url =>
      shortenerDomains.some(domain => url.includes(domain))
    );

    if (shortLinks.length > 0) {
      reasons.push(`Enlaces acortados detectados (${shortLinks.length})`);
      score += shortLinks.length * 15;
    }

    // Dominios sospechosos
    const suspiciousTLDs = ['.xyz', '.top', '.info', '.biz', '.click', '.pw'];
    const suspiciousUrls = urls.filter(url =>
      suspiciousTLDs.some(tld => url.includes(tld))
    );

    if (suspiciousUrls.length > 0) {
      reasons.push(`Dominios sospechosos detectados (${suspiciousUrls.length})`);
      score += suspiciousUrls.length * 20;
    }

    return score;
  }

  /**
   * Analiza caracteres sospechosos
   */
  private analyzeSuspiciousChars(body: string, reasons: string[]): number {
    let score = 0;

    // Muchos emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
    const emojiCount = (body.match(emojiRegex) || []).length;

    if (emojiCount > 10) {
      reasons.push(`Demasiados emojis (${emojiCount})`);
      score += 15;
    }

    // Caracteres no ASCII excesivos (posible unicode spam)
    const nonAsciiRatio = (body.match(/[^\x00-\x7F]/g) || []).length / body.length;
    if (nonAsciiRatio > 0.5 && body.length > 20) {
      reasons.push('Demasiados caracteres no-ASCII');
      score += 20;
    }

    // Muchos caracteres repetidos (aaaaaaa)
    const repeatedCharsRegex = /(.)\1{5,}/g;
    if (repeatedCharsRegex.test(body)) {
      reasons.push('Caracteres repetidos excesivamente');
      score += 15;
    }

    return score;
  }

  /**
   * Actualiza la configuración del detector
   */
  updateConfig(config: Partial<DetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): DetectorConfig {
    return { ...this.config };
  }
}

/**
 * Configuración por defecto
 */
export const defaultConfig: DetectorConfig = {
  enabled: true,
  sensitivity: 'medium',
  autoModerate: true,
  threshold: 60, // Score >= 60 se considera spam
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
      'viagra', 'cialis', 'pharmacy', 'casino', 'poker',
      'buy now', 'click here', 'make money', 'work from home',
    ],
  },
};
