/**
 * Threat Chart Component
 * Displays security threat trends over time
 */

interface ThreatDataPoint {
    date: string;
    count: number;
}

interface ThreatChartProps {
    data: ThreatDataPoint[];
    title?: string;
    color?: string;
}

export function ThreatChart({
    data,
    title = "Threat Activity",
    color = "#EF4444",
}: ThreatChartProps) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="text-center text-gray-500 py-8">
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map((d) => d.count));
    const chartHeight = 200;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

            {/* Simple bar chart */}
            <div className="relative" style={{ height: chartHeight }}>
                <div className="absolute inset-0 flex items-end justify-between space-x-1">
                    {data.map((point, idx) => {
                        const heightPercent = maxValue > 0 ? (point.count / maxValue) * 100 : 0;

                        return (
                            <div
                                key={idx}
                                className="flex-1 flex flex-col items-center group relative"
                            >
                                <div
                                    className="w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                                    style={{
                                        height: `${heightPercent}%`,
                                        backgroundColor: color,
                                        minHeight: point.count > 0 ? "4px" : "0",
                                    }}
                                    title={`${point.date}: ${point.count} events`}
                                />

                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                    <div className="font-medium">{point.count} events</div>
                                    <div className="text-gray-300">{point.date}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{data[0]?.date}</span>
                {data.length > 2 && (
                    <span>{data[Math.floor(data.length / 2)]?.date}</span>
                )}
                <span>{data[data.length - 1]?.date}</span>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {data.reduce((sum, d) => sum + d.count, 0)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="text-lg font-semibold text-gray-900">
                        {Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length)}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Peak</p>
                    <p className="text-lg font-semibold text-gray-900">{maxValue}</p>
                </div>
            </div>
        </div>
    );
}
