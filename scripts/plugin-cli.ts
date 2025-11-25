#!/usr/bin/env -S deno run --allow-all

/**
 * Plugin CLI Tool
 * Command-line interface for plugin management
 */

import { parse } from '@std/flags';
import { pluginIntegrity } from '../src/lib/plugin-system/PluginIntegrity.ts';
import { pluginRateLimiter } from '../src/lib/plugin-system/PluginRateLimiter.ts';
import { pluginAuditor } from '../src/lib/plugin-system/PluginAuditor.ts';
import { join } from '@std/path';

const PLUGINS_DIR = join(Deno.cwd(), 'plugins');

/**
 * CLI Commands
 */
const commands = {
    /**
     * Generate and sign plugin checksums
     */
    async sign(pluginName: string) {
        console.log(`🔒 Generating checksums for plugin: ${pluginName}`);

        const pluginPath = join(PLUGINS_DIR, pluginName);

        try {
            await pluginIntegrity.generateAndSave(pluginPath);
            console.log(`✅ Checksums generated and saved to ${pluginName}/integrity.json`);
        } catch (error) {
            console.error(`❌ Error:`, (error as Error).message);
            Deno.exit(1);
        }
    },

    /**
     * Verify plugin integrity
     */
    async verify(pluginName: string) {
        console.log(`🔍 Verifying integrity of plugin: ${pluginName}`);

        const pluginPath = join(PLUGINS_DIR, pluginName);

        try {
            const result = await pluginIntegrity.verifyFromPath(pluginPath);
            console.log(pluginIntegrity.formatResult(result));

            if (!result.valid) {
                Deno.exit(1);
            }
        } catch (error) {
            console.error(`❌ Error:`, (error as Error).message);
            Deno.exit(1);
        }
    },

    /**
     * View audit logs for a plugin
     */
    async audit(pluginName: string, options?: { limit?: number; action?: string }) {
        console.log(`📋 Audit logs for plugin: ${pluginName}\n`);

        try {
            const logs = await pluginAuditor.query({
                pluginName,
                action: options?.action,
                limit: options?.limit || 50,
            });

            if (logs.length === 0) {
                console.log('No audit logs found');
                return;
            }

            for (const log of logs) {
                const date = new Date(log.timestamp!);
                const severityIcon = {
                    info: 'ℹ️',
                    warning: '⚠️',
                    error: '❌',
                    critical: '🔴',
                }[log.severity];

                console.log(`${severityIcon} ${date.toISOString()}`);
                console.log(`   Action: ${log.action}`);
                if (log.details) {
                    console.log(`   Details: ${log.details}`);
                }
                console.log('');
            }

            console.log(`\nTotal logs: ${logs.length}`);
        } catch (error) {
            console.error(`❌ Error:`, (error as Error).message);
            Deno.exit(1);
        }
    },

    /**
     * View rate limit stats for a plugin
     */
    async limits(pluginName: string) {
        console.log(`📊 Rate limit stats for plugin: ${pluginName}\n`);

        const stats = pluginRateLimiter.getPluginStats(pluginName);

        if (stats.length === 0) {
            console.log('No rate limit data found');
            return;
        }

        for (const stat of stats) {
            const blockRate = stat.totalRequests > 0
                ? ((stat.blockedRequests / stat.totalRequests) * 100).toFixed(2)
                : '0';

            console.log(`Operation: ${stat.operation}`);
            console.log(`  Total Requests: ${stat.totalRequests}`);
            console.log(`  Blocked: ${stat.blockedRequests} (${blockRate}%)`);
            console.log('');
        }
    },

    /**
     * Reset rate limits for a plugin
     */
    resetLimits(pluginName: string) {
        console.log(`🔄 Resetting rate limits for plugin: ${pluginName}`);

        pluginRateLimiter.resetPluginLimits(pluginName);
        pluginRateLimiter.resetPluginStats(pluginName);

        console.log(`✅ Rate limits reset`);
    },

    /**
     * Show audit statistics
     */
    async auditStats(options?: { pluginName?: string }) {
        console.log(`📊 Audit Statistics\n`);

        try {
            const stats = await pluginAuditor.getStats();

            console.log(`Total Logs: ${stats.total}\n`);

            if (Object.keys(stats.byPlugin).length > 0) {
                console.log('By Plugin:');
                for (const [plugin, count] of Object.entries(stats.byPlugin)) {
                    console.log(`  ${plugin}: ${count}`);
                }
                console.log('');
            }

            if (Object.keys(stats.bySeverity).length > 0) {
                console.log('By Severity:');
                for (const [severity, count] of Object.entries(stats.bySeverity)) {
                    console.log(`  ${severity}: ${count}`);
                }
                console.log('');
            }

            if (Object.keys(stats.byAction).length > 0) {
                console.log('Top Actions:');
                const topActions = Object.entries(stats.byAction)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 10);

                for (const [action, count] of topActions) {
                    console.log(`  ${action}: ${count}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error:`, (error as Error).message);
            Deno.exit(1);
        }
    },

    /**
     * Cleanup old audit logs
     */
    async cleanupAudit(days: number = 90) {
        console.log(`🧹 Cleaning up audit logs older than ${days} days...`);

        try {
            const deleted = await pluginAuditor.cleanup(days);
            console.log(`✅ Deleted ${deleted} old audit log entries`);
        } catch (error) {
            console.error(`❌ Error:`, (error as Error).message);
            Deno.exit(1);
        }
    },

    /**
     * Show help
     */
    help() {
        console.log(`
Plugin CLI Tool

Usage:
  deno task plugin <command> [options]

Commands:
  sign <plugin-name>              Generate checksums for a plugin
  verify <plugin-name>            Verify plugin integrity
  audit <plugin-name>             View audit logs for a plugin
    --limit <number>              Limit number of logs (default: 50)
    --action <action>             Filter by action type
  limits <plugin-name>            Show rate limit stats for a plugin
  reset-limits <plugin-name>      Reset rate limits for a plugin
  audit-stats                     Show overall audit statistics
  cleanup <days>                  Cleanup audit logs older than N days
  help                            Show this help message

Examples:
  deno task plugin sign hello-world
  deno task plugin verify hello-world
  deno task plugin audit hello-world --limit 100
  deno task plugin limits hello-world
  deno task plugin audit-stats
  deno task plugin cleanup 90
    `);
    },
};

/**
 * Main CLI entry point
 */
async function main() {
    const args = parse(Deno.args);
    const [command, ...rest] = args._;

    if (!command) {
        commands.help();
        Deno.exit(1);
    }

    const commandName = String(command);

    switch (commandName) {
        case 'sign':
            if (!rest[0]) {
                console.error('❌ Error: Plugin name required');
                Deno.exit(1);
            }
            await commands.sign(String(rest[0]));
            break;

        case 'verify':
            if (!rest[0]) {
                console.error('❌ Error: Plugin name required');
                Deno.exit(1);
            }
            await commands.verify(String(rest[0]));
            break;

        case 'audit':
            if (!rest[0]) {
                console.error('❌ Error: Plugin name required');
                Deno.exit(1);
            }
            await commands.audit(String(rest[0]), {
                limit: args.limit ? parseInt(args.limit) : undefined,
                action: args.action ? String(args.action) : undefined,
            });
            break;

        case 'limits':
            if (!rest[0]) {
                console.error('❌ Error: Plugin name required');
                Deno.exit(1);
            }
            await commands.limits(String(rest[0]));
            break;

        case 'reset-limits':
            if (!rest[0]) {
                console.error('❌ Error: Plugin name required');
                Deno.exit(1);
            }
            commands.resetLimits(String(rest[0]));
            break;

        case 'audit-stats':
            await commands.auditStats();
            break;

        case 'cleanup':
            const days = rest[0] ? parseInt(String(rest[0])) : 90;
            await commands.cleanupAudit(days);
            break;

        case 'help':
            commands.help();
            break;

        default:
            console.error(`❌ Unknown command: ${commandName}`);
            commands.help();
            Deno.exit(1);
    }
}

// Run CLI
if (import.meta.main) {
    main();
}
