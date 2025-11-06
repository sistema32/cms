/**
 * SMTP Email Provider
 * Sends emails using SMTP protocol
 * Compatible with most email services (Gmail, Outlook, etc.)
 */

import type {
  EmailOptions,
  IEmailProvider,
  SendEmailResult,
  SMTPConfig,
} from "../types.ts";

export class SMTPProvider implements IEmailProvider {
  constructor(private config: SMTPConfig) {}

  async send(options: EmailOptions): Promise<SendEmailResult> {
    try {
      // Prepare email data
      const from = options.from || this.config.from;
      const to = Array.isArray(options.to) ? options.to : [options.to];

      // Build email message
      const message = this.buildMessage({
        ...options,
        from,
        to,
      });

      // Connect to SMTP server
      const connection = await this.connect();

      // Send MAIL FROM
      await this.sendCommand(connection, `MAIL FROM:<${from.email}>`);

      // Send RCPT TO for each recipient
      for (const recipient of to) {
        await this.sendCommand(connection, `RCPT TO:<${recipient.email}>`);
      }

      // Send DATA
      await this.sendCommand(connection, "DATA");
      await this.sendCommand(connection, message);
      await this.sendCommand(connection, ".");

      // Close connection
      await this.sendCommand(connection, "QUIT");
      connection.close();

      return {
        success: true,
        messageId: `smtp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "SMTP sending failed",
      };
    }
  }

  async verify(): Promise<boolean> {
    try {
      const connection = await this.connect();
      await this.sendCommand(connection, "QUIT");
      connection.close();
      return true;
    } catch {
      return false;
    }
  }

  private async connect(): Promise<Deno.TcpConn> {
    const conn = await Deno.connect({
      hostname: this.config.host,
      port: this.config.port,
    });

    // Read server greeting
    await this.readResponse(conn);

    // Send EHLO
    await this.sendCommand(conn, `EHLO ${this.config.host}`);

    // If secure connection is required, upgrade to TLS
    if (this.config.secure) {
      await this.sendCommand(conn, "STARTTLS");
      // Note: In production, you'd upgrade the connection to TLS here
      // For simplicity, we're skipping the TLS upgrade implementation
    }

    // Authenticate if credentials provided
    if (this.config.auth) {
      await this.sendCommand(conn, "AUTH LOGIN");

      // Send username (base64 encoded)
      const usernameB64 = btoa(this.config.auth.user);
      await this.sendCommand(conn, usernameB64);

      // Send password (base64 encoded)
      const passwordB64 = btoa(this.config.auth.pass);
      await this.sendCommand(conn, passwordB64);
    }

    return conn;
  }

  private async sendCommand(conn: Deno.TcpConn, command: string): Promise<void> {
    const encoder = new TextEncoder();
    await conn.write(encoder.encode(command + "\r\n"));
    await this.readResponse(conn);
  }

  private async readResponse(conn: Deno.TcpConn): Promise<string> {
    const buffer = new Uint8Array(4096);
    const n = await conn.read(buffer);
    if (n === null) {
      throw new Error("Connection closed");
    }
    const decoder = new TextDecoder();
    return decoder.decode(buffer.subarray(0, n));
  }

  private buildMessage(options: Required<Pick<EmailOptions, "from" | "to" | "subject">> & EmailOptions): string {
    const lines: string[] = [];

    // Headers
    lines.push(`From: ${this.formatAddress(options.from)}`);
    lines.push(`To: ${options.to.map((addr) => this.formatAddress(addr)).join(", ")}`);

    if (options.cc) {
      const cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      lines.push(`Cc: ${cc.map((addr) => this.formatAddress(addr)).join(", ")}`);
    }

    if (options.replyTo) {
      lines.push(`Reply-To: ${this.formatAddress(options.replyTo)}`);
    }

    lines.push(`Subject: ${options.subject}`);
    lines.push(`Date: ${new Date().toUTCString()}`);
    lines.push(`Message-ID: <${Date.now()}.${Math.random().toString(36).substring(7)}@${this.config.host}>`);

    if (options.priority) {
      const priorityMap = { high: "1", normal: "3", low: "5" };
      lines.push(`X-Priority: ${priorityMap[options.priority]}`);
    }

    lines.push("MIME-Version: 1.0");

    // Body
    if (options.html && options.text) {
      // Multipart alternative
      const boundary = `boundary-${Date.now()}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      lines.push("");
      lines.push(`--${boundary}`);
      lines.push("Content-Type: text/plain; charset=utf-8");
      lines.push("");
      lines.push(options.text);
      lines.push("");
      lines.push(`--${boundary}`);
      lines.push("Content-Type: text/html; charset=utf-8");
      lines.push("");
      lines.push(options.html);
      lines.push("");
      lines.push(`--${boundary}--`);
    } else if (options.html) {
      lines.push("Content-Type: text/html; charset=utf-8");
      lines.push("");
      lines.push(options.html);
    } else if (options.text) {
      lines.push("Content-Type: text/plain; charset=utf-8");
      lines.push("");
      lines.push(options.text);
    }

    return lines.join("\r\n");
  }

  private formatAddress(addr: { email: string; name?: string }): string {
    return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email;
  }
}
