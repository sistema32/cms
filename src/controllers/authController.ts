import { Context } from "hono";
import * as authService from "@/services/auth/authService.ts";
import { loginSchema, registerSchema } from "@/utils/validation.ts";
import { auditLogger, extractAuditContext } from "@/lib/audit/index.ts";
import { webhookManager } from "@/lib/webhooks/index.ts";
import { doAction } from "@/lib/hooks/index.ts";
import { emailManager, notificationService } from "@/lib/email/index.ts";
import { env } from "@/config/env.ts";
import { AppError } from "@/platform/errors.ts";
import { createLogger } from "@/platform/logger.ts";

const log = createLogger("authController");

/**
 * POST /api/auth/register
 */
export async function register(c: Context) {
  try {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AppError("invalid_json", "Invalid JSON payload", 400);
      }
      throw error;
    }
    const data = registerSchema.parse(body);

    const result = await authService.register(data);

    // Log registration
    const context = extractAuditContext(c);
    await auditLogger.info("register", "user", {
      ...context,
      userId: result.user.id,
      userEmail: result.user.email,
      entityId: result.user.id,
      description: `User registered: ${result.user.email}`,
    });

    // Dispatch webhook event
    try {
      await webhookManager.dispatch("user.created", {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roleId: result.user.role?.id,
        createdAt: result.user.createdAt,
      });

      // Trigger user:register hook
      await doAction("user:register", result.user);
      await doAction("cms_user:register", result.user);
    } catch (error) {
      console.warn("Failed to dispatch user.created webhook or hook:", error);
    }

    // Send welcome email
    try {
      await emailManager.queueWithTemplate(
        "welcome",
        { email: result.user.email, name: result.user.name || undefined },
        {
          name: result.user.name || result.user.email,
          email: result.user.email,
          site_name: "LexCMS",
          login_url: `${env.BASE_URL}/login`,
        },
        "normal",
      );
    } catch (error) {
      console.warn("Failed to send welcome email:", error);
    }

    // Create welcome notification
    try {
      await notificationService.create({
        userId: result.user.id,
        type: "user.welcome",
        title: "Welcome to LexCMS!",
        message: "Your account has been successfully created. Start exploring and creating amazing content!",
        icon: "🎉",
        link: "/dashboard",
        actionLabel: "Go to Dashboard",
        actionUrl: `${env.BASE_URL}/dashboard`,
        priority: "normal",
        sendEmail: false, // Already sent welcome email above
      });
    } catch (error) {
      console.warn("Failed to create welcome notification:", error);
    }

    return c.json(
      {
        success: true,
        data: result,
        message: "Usuario registrado exitosamente",
      },
      201,
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AppError("invalid_json", "Invalid JSON payload", 400);
    }
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : "Error al registrar usuario";
    throw new AppError("register_failed", message, 400);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(c: Context) {
  try {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AppError("invalid_json", "Invalid JSON payload", 400);
      }
      throw error;
    }
    const data = loginSchema.parse(body);

    // Obtener IP y User-Agent para logs de seguridad
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
    const userAgent = c.req.header("user-agent");

    const result = await authService.login(data, ip, userAgent);

    // Log successful login
    if (!result.requires2FA && result.user) {
      const context = extractAuditContext(c);
      await auditLogger.info("login", "user", {
        ...context,
        userId: result.user.id,
        userEmail: result.user.email,
        entityId: result.user.id,
        description: `User logged in: ${result.user.email}`,
      });

      // Dispatch webhook event
      try {
        await webhookManager.dispatch("user.login", {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          loginAt: new Date().toISOString(),
          ipAddress: ip,
        });

        // Trigger user:login hook
        await doAction("user:login", result.user);
        await doAction("cms_user:login", result.user);
      } catch (error) {
        console.warn("Failed to dispatch user.login webhook or hook:", error);
      }
    }

    return c.json({
      success: true,
      data: result,
      message: result.requires2FA
        ? "Autenticación parcial. Se requiere código 2FA"
        : "Login exitoso",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AppError("invalid_json", "Invalid JSON payload", 400);
    }

    // Log failed login attempt
    const context = extractAuditContext(c);
    try {
      const body = await c.req.json();
      await auditLogger.warning("login", "user", {
        ...context,
        userEmail: body.email,
        description: `Failed login attempt for: ${body.email}`,
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch {
      // Ignore if we can't parse body again
    }

    const message = error instanceof Error
      ? error.message
      : "Error al iniciar sesión";
    // Para no filtrar detalles, usar código genérico y status 401
    throw new AppError("login_failed", message, 401);
  }
}

/**
 * GET /api/auth/me
 */
export async function me(c: Context) {
  const user = c.get("user");

  return c.json({
    success: true,
    data: user,
  });
}
