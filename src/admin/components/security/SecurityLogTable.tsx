/**
 * Security Log Table Component
 * Displays security events in a sortable, filterable table
 */

import { SecurityAlertBadge } from "./SecurityAlertBadge.tsx";

interface SecurityEvent {
    id: number;
    type: string;
    ip: string;
    severity: "critical" | "high" | "medium" | "low";
    path?: string;
    method?: string;
    blocked: boolean;
    createdAt: Date;
}

interface SecurityLogTableProps {
    events: SecurityEvent[];
    loading?: boolean;
    onRowClick?: (event: SecurityEvent) => void;
}

export function SecurityLogTable({
    events,
    loading = false,
    onRowClick,
}: SecurityLogTableProps) {
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getEventTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            rate_limit_exceeded: "Rate Limit",
            sql_injection: "SQL Injection",
            xss_attempt: "XSS Attempt",
            path_traversal: "Path Traversal",
            suspicious_activity: "Suspicious",
            blocked_ip: "Blocked IP",
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading events...</span>
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center text-gray-500">
                    <p className="text-lg font-medium">No security events found</p>
                    <p className="text-sm mt-1">
                        Try adjusting your filters or date range
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                IP Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Path
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Severity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {events.map((event) => (
                            <tr
                                key={event.id}
                                onClick={() => onRowClick?.(event)}
                                className={`${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                                    } transition-colors`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(event.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium text-gray-900">
                                        {getEventTypeLabel(event.type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                        {event.ip}
                                    </code>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {event.path && (
                                        <span>
                                            <span className="font-medium text-gray-700">
                                                {event.method}
                                            </span>{" "}
                                            {event.path}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <SecurityAlertBadge severity={event.severity} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {event.blocked ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Blocked
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Allowed
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
