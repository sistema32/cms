import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { securityLogService } from "../../src/services/security/securityLogService.ts";
import { ipManagementService } from "../../src/services/security/ipManagementService.ts";
import { securitySettingsService } from "../../src/services/security/securitySettingsService.ts";
import { securityRulesService } from "../../src/services/security/securityRuleService.ts";
import { rateLimitConfigService } from "../../src/services/security/rateLimitConfigService.ts";

Deno.test("Security Services - IP Management", async (t) => {
    await t.step("should add IP to blacklist", async () => {
        const ip = "1.2.3.4";
        const result = await ipManagementService.addToBlacklist(ip, "Test block", 3600);
        assertExists(result);
        assertEquals(result.ip, ip);
        assertEquals(result.type, "blacklist");
    });

    await t.step("should check if IP is blacklisted", async () => {
        const ip = "1.2.3.4";
        const isBlocked = await ipManagementService.isBlacklisted(ip);
        assertEquals(isBlocked, true);
    });

    await t.step("should remove IP from blacklist", async () => {
        const ip = "1.2.3.4";
        await ipManagementService.removeFromBlacklist(ip);
        const isBlocked = await ipManagementService.isBlacklisted(ip);
        assertEquals(isBlocked, false);
    });
});

Deno.test("Security Services - Security Logs", async (t) => {
    await t.step("should log security event", async () => {
        const event = {
            type: "test_event",
            severity: "low",
            ip: "127.0.0.1",
            message: "Test log event",
            details: JSON.stringify({ test: true }),
        };

        const result = await securityLogService.logEvent(event);
        assertExists(result);
        assertEquals(result.type, event.type);
        assertEquals(result.ip, event.ip);
    });

    await t.step("should retrieve recent events", async () => {
        const events = await securityLogService.getRecentEvents(1);
        assertExists(events);
        assertEquals(events.length > 0, true);
        assertEquals(events[0].type, "test_event");
    });
});

Deno.test("Security Services - Settings", async (t) => {
    await t.step("should set and get setting", async () => {
        const key = "test.setting";
        const value = "test_value";

        await securitySettingsService.setSetting(key, value);
        const retrieved = await securitySettingsService.getValue(key);

        assertEquals(retrieved, value);
    });
});

Deno.test("Security Services - Rules", async (t) => {
    await t.step("should create security rule", async () => {
        const rule = {
            name: "Test Rule",
            type: "keyword",
            pattern: "test_attack",
            action: "block",
            severity: "high",
            enabled: true,
        };

        const result = await securityRulesService.createRule(rule);
        assertExists(result);
        assertEquals(result.name, rule.name);
    });
});

Deno.test("Security Services - Rate Limit Config", async (t) => {
    await t.step("should create rate limit rule", async () => {
        const rule = {
            name: "Test Rate Limit",
            path: "/api/test",
            method: "GET",
            maxRequests: 100,
            windowSeconds: 60,
            enabled: true,
        };

        const result = await rateLimitConfigService.createRule(rule);
        assertExists(result);
        assertEquals(result.path, rule.path);
    });
});
