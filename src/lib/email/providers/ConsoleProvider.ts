/**
 * Console Email Provider
 * Logs emails to console instead of sending them
 * Useful for development and testing
 */

import type { EmailOptions, IEmailProvider, SendEmailResult } from "../types.ts";

export class ConsoleProvider implements IEmailProvider {
  async send(options: EmailOptions): Promise<SendEmailResult> {
    try {
      console.log("\n📧 ========== EMAIL (Console Provider) ==========");
      console.log("From:", options.from || "Default sender");
      console.log("To:", Array.isArray(options.to) ? options.to : [options.to]);
      if (options.cc) console.log("CC:", Array.isArray(options.cc) ? options.cc : [options.cc]);
      if (options.bcc) console.log("BCC:", Array.isArray(options.bcc) ? options.bcc : [options.bcc]);
      console.log("Subject:", options.subject);
      if (options.text) {
        console.log("\n--- Text ---");
        console.log(options.text);
      }
      if (options.html) {
        console.log("\n--- HTML ---");
        console.log(options.html);
      }
      if (options.attachments && options.attachments.length > 0) {
        console.log("\n--- Attachments ---");
        options.attachments.forEach((att, i) => {
          console.log(`${i + 1}. ${att.filename} (${att.contentType})`);
        });
      }
      console.log("================================================\n");

      return {
        success: true,
        messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async verify(): Promise<boolean> {
    return true; // Console provider is always available
  }
}
