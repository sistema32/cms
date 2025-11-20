/**
 * IP Address Input Component
 * Input field with IP address validation
 */

import { useState } from "react";

interface IPAddressInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    label?: string;
    required?: boolean;
}

export function IPAddressInput({
    value,
    onChange,
    placeholder = "192.168.1.1",
    error,
    label,
    required = false,
}: IPAddressInputProps) {
    const [touched, setTouched] = useState(false);

    const validateIP = (ip: string): boolean => {
        const ipRegex =
            /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    };

    const isValid = !value || validateIP(value);
    const showError = touched && !isValid;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder={placeholder}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${showError || error
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
            />
            {(showError || error) && (
                <p className="mt-1 text-sm text-red-600">
                    {error || "Please enter a valid IP address"}
                </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
                Example: 192.168.1.1 or 10.0.0.1
            </p>
        </div>
    );
}
