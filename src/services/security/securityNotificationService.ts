import { emailManager } from "../../lib/email/EmailManager.ts";
import { securitySettingsService } from "./securitySettingsService.ts";
import { env } from "../../config/env.ts";

export interface SecurityAlert {
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    ip?: string;
    details?: Record<string, any>;
}

class SecurityNotificationService {
    private static instance: SecurityNotificationService;
    private lastNotificationTime: Map<string, number> = new Map();
    private readonly THROTTLE_MS = 60000; // 1 minute throttle per IP/Type

    private constructor() { }

    static getInstance(): SecurityNotificationService {
        if (!SecurityNotificationService.instance) {
            SecurityNotificationService.instance = new SecurityNotificationService();
        }
        return SecurityNotificationService.instance;
    }

    /**
     * Send a security alert notification
     */
    async sendAlert(alert: SecurityAlert): Promise<void> {
        try {
            // 1. Check if notifications are enabled
            const enabled = await securitySettingsService.getValue("security.email_notifications", true);
            if (!enabled) return;

            // 2. Check severity threshold
            const threshold = await securitySettingsService.getValue("security.notification_threshold", "high");
            if (!this.meetsThreshold(alert.severity, threshold as string)) return;

            // 3. Check throttling
            const throttleKey = `${alert.type}:${alert.ip || 'global'}`;
            const now = Date.now();
            const lastTime = this.lastNotificationTime.get(throttleKey) || 0;

            if (now - lastTime < this.THROTTLE_MS) {
                return; // Throttled
            }

            this.lastNotificationTime.set(throttleKey, now);

            // 4. Send email
            const adminEmail = (env as any).ADMIN_EMAIL || "admin@example.com";

            await emailManager.queue({
                to: adminEmail,
                subject: `[Security Alert] ${alert.severity.toUpperCase()}: ${alert.type}`,
                html: this.generateEmailHtml(alert),
                text: this.generateEmailText(alert),
            }, "high");

            console.log(`📧 Security alert sent: ${alert.type} (${alert.severity})`);

        } catch (error) {
            console.error("Failed to send security alert:", error);
        }
    }

    private meetsThreshold(severity: string, threshold: string): boolean {
        const levels = ["low", "medium", "high", "critical"];
        const severityIndex = levels.indexOf(severity);
        const thresholdIndex = levels.indexOf(threshold);
        return severityIndex >= thresholdIndex;
    }

    private generateEmailHtml(alert: SecurityAlert): string {
        const color = this.getSeverityColor(alert.severity);

        return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background-color: ${color}; color: white; padding: 12px 20px; border-radius: 6px 6px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">Security Alert: ${alert.severity.toUpperCase()}</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h3 style="margin-top: 0; color: #111827;">${alert.type}</h3>
          <p style="color: #374151; font-size: 16px;">${alert.message}</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 5px 0;"><strong>IP Address:</strong> ${alert.ip || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            ${alert.details ? `<pre style="margin-top: 10px; overflow-x: auto;">${JSON.stringify(alert.details, null, 2)}</pre>` : ''}
          </div>
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${(env as any).APP_URL || 'http://localhost:8000'}/admincp/security/dashboard" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Security Dashboard
            </a>
          </div>
        </div>
      </div>
    `;
    }

    private generateEmailText(alert: SecurityAlert): string {
        return `
SECURITY ALERT: ${alert.severity.toUpperCase()}
Type: ${alert.type}
Message: ${alert.message}
IP: ${alert.ip || 'N/A'}
Time: ${new Date().toLocaleString()}

Details:
${alert.details ? JSON.stringify(alert.details, null, 2) : 'N/A'}

View Dashboard: ${(env as any).APP_URL || 'http://localhost:8000'}/admincp/security/dashboard
    `.trim();
    }

    private getSeverityColor(severity: string): string {
        switch (severity) {
            case "critical": return "#dc2626"; // Red
            case "high": return "#ea580c";     // Orange
            case "medium": return "#2563eb";   // Blue
            case "low": return "#16a34a";      // Green
            default: return "#6b7280";         // Gray
        }
    }
}

export const securityNotificationService = SecurityNotificationService.getInstance();
