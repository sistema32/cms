import { env } from "../config/env.ts";

/**
 * ============================================
 * OLLAMA CLIENT
 * ============================================
 * Cliente HTTP type-safe para comunicación con Ollama API
 */

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  system?: string;
  format?: "json"; // Para structured outputs
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  temperature?: number;
  format?: "json";
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
}

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaListResponse {
  models: OllamaModelInfo[];
}

/**
 * Cliente para Ollama API
 */
export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config?: {
    baseUrl?: string;
    model?: string;
    timeout?: number;
    maxRetries?: number;
  }) {
    this.baseUrl = config?.baseUrl || "http://localhost:11434";
    this.defaultModel = config?.model || "qwen2.5:3b";
    this.timeout = config?.timeout || 30000; // 30 segundos
    this.maxRetries = config?.maxRetries || 3;
  }

  /**
   * Realiza un request con retry logic y timeout
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = this.maxRetries,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && retries > 0) {
        // Retry en caso de error 5xx
        if (response.status >= 500) {
          console.warn(
            `Ollama request failed (${response.status}), retrying... (${retries} left)`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s
          return this.fetchWithRetry(url, options, retries - 1);
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        if (retries > 0) {
          console.warn(
            `Ollama request timeout, retrying... (${retries} left)`,
          );
          return this.fetchWithRetry(url, options, retries - 1);
        }
        throw new Error(
          `Ollama request timeout after ${this.timeout}ms (${this.maxRetries} retries)`,
        );
      }

      if (retries > 0) {
        console.warn(`Ollama connection error, retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }

      throw error;
    }
  }

  /**
   * Genera texto usando el endpoint /api/generate
   */
  async generate(
    request: Partial<OllamaGenerateRequest>,
  ): Promise<string> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          prompt: request.prompt,
          stream: false,
          temperature: request.temperature ?? 0.7,
          system: request.system,
          format: request.format,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama generate error: ${response.status} - ${errorText}`,
      );
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    return data.response.trim();
  }

  /**
   * Chat usando el endpoint /api/chat (preferido para conversaciones)
   */
  async chat(
    messages: OllamaChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      format?: "json";
    },
  ): Promise<string> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options?.model || this.defaultModel,
        messages,
        stream: false,
        temperature: options?.temperature ?? 0.7,
        format: options?.format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama chat error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    return data.message.content.trim();
  }

  /**
   * Verifica la salud del servidor Ollama
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 segundos máximo
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Lista los modelos disponibles
   */
  async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as OllamaListResponse;
      return data.models;
    } catch {
      return [];
    }
  }

  /**
   * Obtiene información sobre el modelo configurado
   */
  async getModelInfo(): Promise<OllamaModelInfo | null> {
    const models = await this.listModels();
    return models.find((m) => m.name === this.defaultModel) || null;
  }
}

// ========== INSTANCIA SINGLETON ==========

// Leer configuración del entorno
const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL") || "http://localhost:11434";
const OLLAMA_MODEL = Deno.env.get("OLLAMA_MODEL") || "qwen2.5:3b";
const OLLAMA_TIMEOUT = parseInt(Deno.env.get("OLLAMA_TIMEOUT") || "30000");

/**
 * Instancia global del cliente Ollama
 * Usar esta instancia en toda la aplicación
 */
export const ollamaClient = new OllamaClient({
  baseUrl: OLLAMA_BASE_URL,
  model: OLLAMA_MODEL,
  timeout: OLLAMA_TIMEOUT,
  maxRetries: 3,
});

/**
 * Verifica si Ollama está habilitado en el entorno
 */
export function isOllamaEnabled(): boolean {
  const enabled = Deno.env.get("OLLAMA_ENABLED");
  return enabled === "true";
}
