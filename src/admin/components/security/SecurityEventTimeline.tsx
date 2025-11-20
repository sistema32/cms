/**
 * Security Event Timeline Component
 * Displays recent security events in a timeline format
 */

import { SecurityAlertBadge } from "./SecurityAlertBadge.tsx";

interface TimelineEvent {
    id: number;
    type: string;
    ip: string;
    severity: "critical" | "high" | "medium" | "low";
    details?: string;
    blocked: boolean;
    createdAt: Date;
}

interface SecurityEventTimelineProps {
    events: TimelineEvent[];
    maxItems?: number;
}

export function SecurityEventTimeline({
    events,
    maxItems = 10,
}: SecurityEventTimelineProps) {
    const displayEvents = events.slice(0, maxItems);

    const getRelativeTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return "Just now";
    };

    const getEventIcon = (type: string, blocked: boolean) => {
        if (blocked) return "🛡️";

        const icons: Record<string, string> = {
            rate_limit_exceeded: "⚡",
            sql_injection: "💉",
            xss_attempt: "🔓",
            path_traversal: "📁",
            suspicious_activity: "👁️",
            blocked_ip: "🚫",
        };
        return icons[type] || "⚠️";
    };

    if (displayEvents.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center text-gray-500">
                    <p className="text-sm">No recent security events</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
            </h3>
            <div className="flow-root">
                <ul className="-mb-8">
                    {displayEvents.map((event, idx) => (
                        <li key={event.id}>
                            <div className="relative pb-8">
                                {idx !== displayEvents.length - 1 && (
                                    <span
                                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                                        aria-hidden="true"
                                    />
                                )}
                                <div className="relative flex items-start space-x-3">
                                    <div className="relative">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                            <span className="text-xl">
                                                {getEventIcon(event.type, event.blocked)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {event.type.replace(/_/g, " ").toUpperCase()}
                                                </p>
                                                <SecurityAlertBadge severity={event.severity} />
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {getRelativeTime(event.createdAt)}
                                            </p>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600">
                                            <p>
                                                IP:{" "}
                                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                                    {event.ip}
                                                </code>
                                            </p>
                                            {event.details && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {event.details}
                                                </p>
                                            )}
                                        </div>
                                        {event.blocked && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    ✓ Blocked
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
