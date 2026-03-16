import { useState, useCallback, useEffect } from 'react';

/**
 * Robust API hook for industrial applications.
 * Handles loading, error, and provides a 'request' function for manual calls.
 */
export function useApi(url, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (overrides = {}) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(url, { ...options, ...overrides });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Request failed with status ${res.status}`);
            }
            const jsonData = await res.json();
            setData(jsonData);
            return jsonData;
        } catch (err) {
            console.error(`[API Error] ${url}:`, err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url, JSON.stringify(options)]);

    // Auto-fetch if method is GET and no manual trigger specified
    useEffect(() => {
        if (options.method === 'GET' || !options.method) {
            if (!options.manual) {
                request();
            }
        }
    }, [request, options.manual]);

    return { data, loading, error, request, setData };
}
