/**
 * Security Metric Card Component
 * Displays a single security metric with icon and trend
 */

interface SecurityMetricCardProps {
    title: string;
    value: number | string;
    icon: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: "blue" | "green" | "red" | "yellow" | "purple";
}

export function SecurityMetricCard({
    title,
    value,
    icon,
    trend,
    color = "blue",
}: SecurityMetricCardProps) {
    const colorClasses = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        red: "bg-red-500",
        yellow: "bg-yellow-500",
        purple: "bg-purple-500",
    };

    const bgColorClasses = {
        blue: "bg-blue-50",
        green: "bg-green-50",
        red: "bg-red-50",
        yellow: "bg-yellow-50",
        purple: "bg-purple-50",
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <div className="flex items-center mt-2">
                            <span
                                className={`text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"
                                    }`}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-gray-500 ml-2">vs last week</span>
                        </div>
                    )}
                </div>
                <div
                    className={`${bgColorClasses[color]} ${colorClasses[color]} bg-opacity-10 p-4 rounded-lg`}
                >
                    <span className={`text-2xl ${colorClasses[color]}`}>{icon}</span>
                </div>
            </div>
        </div>
    );
}
