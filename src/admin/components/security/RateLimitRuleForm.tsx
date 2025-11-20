/**
 * Rate Limit Rule Form Component
 * Form for creating/editing rate limit rules
 */

import { useState } from "react";

interface RateLimitRule {
    name: string;
    path: string;
    method?: string;
    maxRequests: number;
    windowSeconds: number;
    enabled: boolean;
}

interface RateLimitRuleFormProps {
    initialData?: Partial<RateLimitRule>;
    onSubmit: (data: RateLimitRule) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function RateLimitRuleForm({
    initialData,
    onSubmit,
    onCancel,
    loading = false,
}: RateLimitRuleFormProps) {
    const [formData, setFormData] = useState<RateLimitRule>({
        name: initialData?.name || "",
        path: initialData?.path || "",
        method: initialData?.method || "",
        maxRequests: initialData?.maxRequests || 100,
        windowSeconds: initialData?.windowSeconds || 60,
        enabled: initialData?.enabled ?? true,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof RateLimitRule, string>>>({});

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof RateLimitRule, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.path.trim()) {
            newErrors.path = "Path is required";
        } else if (!formData.path.startsWith("/")) {
            newErrors.path = "Path must start with /";
        }

        if (formData.maxRequests < 1) {
            newErrors.maxRequests = "Must be at least 1";
        }

        if (formData.windowSeconds < 1) {
            newErrors.windowSeconds = "Must be at least 1 second";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-300" : "border-gray-300"
                        }`}
                    placeholder="API Rate Limit"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Path */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Path <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.path}
                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.path ? "border-red-300" : "border-gray-300"
                        }`}
                    placeholder="/api/auth/login"
                />
                {errors.path && <p className="mt-1 text-sm text-red-600">{errors.path}</p>}
            </div>

            {/* Method */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    HTTP Method (Optional)
                </label>
                <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                </select>
            </div>

            {/* Max Requests */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Requests <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    min="1"
                    value={formData.maxRequests}
                    onChange={(e) =>
                        setFormData({ ...formData, maxRequests: parseInt(e.target.value) || 0 })
                    }
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.maxRequests ? "border-red-300" : "border-gray-300"
                        }`}
                />
                {errors.maxRequests && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxRequests}</p>
                )}
            </div>

            {/* Window Seconds */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Window (seconds) <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    min="1"
                    value={formData.windowSeconds}
                    onChange={(e) =>
                        setFormData({ ...formData, windowSeconds: parseInt(e.target.value) || 0 })
                    }
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.windowSeconds ? "border-red-300" : "border-gray-300"
                        }`}
                />
                {errors.windowSeconds && (
                    <p className="mt-1 text-sm text-red-600">{errors.windowSeconds}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    {formData.maxRequests} requests per {formData.windowSeconds} seconds
                </p>
            </div>

            {/* Enabled */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                    Enable this rule
                </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save Rule"}
                </button>
            </div>
        </form>
    );
}
