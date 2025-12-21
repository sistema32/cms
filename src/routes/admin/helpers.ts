import type { NotificationItem } from "../../admin/components/ui/NotificationPanel.tsx";

export function parseSettingValueForAdmin(value: string | null): unknown {
    if (value === null || value === undefined) {
        return null;
    }
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

export function parseIds(value: unknown): number[] {
    if (value === undefined || value === null) {
        return [];
    }
    const values = Array.isArray(value) ? value : [value];
    return values
        .map((v) => parseInt(String(v), 10))
        .filter((num) => Number.isFinite(num));
}

export function parseStringField(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    const str = Array.isArray(value)
        ? String(value[value.length - 1])
        : String(value);
    const trimmed = str.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export function parseNullableField(value: unknown): string | null | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    const str = Array.isArray(value)
        ? String(value[value.length - 1])
        : String(value);
    const trimmed = str.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function parseBooleanField(value: unknown): boolean {
    if (value === undefined || value === null) {
        return false;
    }
    const values = Array.isArray(value) ? value : [value];
    const last = String(values[values.length - 1]).toLowerCase();
    return last === "true" || last === "1" || last === "on";
}

export function extractSeoPayload(body: Record<string, unknown>) {
    const seo = {
        metaTitle: parseStringField(body.seo_metaTitle),
        metaDescription: parseStringField(body.seo_metaDescription),
        canonicalUrl: parseStringField(body.seo_canonicalUrl),
        ogTitle: parseStringField(body.seo_ogTitle),
        ogDescription: parseStringField(body.seo_ogDescription),
        ogImage: parseStringField(body.seo_ogImage),
        ogType: parseStringField(body.seo_ogType),
        twitterCard: parseStringField(body.seo_twitterCard),
        twitterTitle: parseStringField(body.seo_twitterTitle),
        twitterDescription: parseStringField(body.seo_twitterDescription),
        twitterImage: parseStringField(body.seo_twitterImage),
        focusKeyword: parseStringField(body.seo_focusKeyword),
        schemaJson: parseStringField(body.seo_schemaJson),
        noIndex: parseBooleanField(body.seo_noIndex),
        noFollow: parseBooleanField(body.seo_noFollow),
    };

    // Remove undefined properties to avoid overwriting with null
    Object.keys(seo).forEach((key) => {
        const typedKey = key as keyof typeof seo;
        if (seo[typedKey] === undefined || seo[typedKey] === "") {
            delete seo[typedKey];
        }
    });

    return seo;
}

export type NormalizedNotification = NotificationItem & { createdAt: Date };

export function normalizeNotifications(items: any[] = []): NormalizedNotification[] {
    return items.map((item) => ({
        ...item,
        actionUrl: item.actionUrl ?? undefined,
        actionLabel: item.actionLabel ?? undefined,
        icon: item.icon ?? undefined,
        link: item.link ?? undefined,
        createdAt: item.createdAt instanceof Date
            ? item.createdAt
            : new Date(item.createdAt ?? Date.now()),
        readAt: item.readAt ?? undefined,
        expiresAt: item.expiresAt ?? undefined,
    }));
}
