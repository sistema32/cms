/**
 * Security Alert Badge Component
 * Displays severity level with appropriate styling
 */

interface SecurityAlertBadgeProps {
    severity: "critical" | "high" | "medium" | "low";
    className?: string;
}

export function SecurityAlertBadge({
    severity,
    className = "",
}: SecurityAlertBadgeProps) {
    const severityConfig = {
        critical: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-200",
            label: "Critical",
        },
        high: {
            bg: "bg-orange-100",
            text: "text-orange-800",
            border: "border-orange-200",
            label: "High",
        },
        medium: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-200",
            label: "Medium",
        },
        low: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-200",
            label: "Low",
        },
    };

    const config = severityConfig[severity];

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
        >
            {config.label}
        </span>
    );
}
