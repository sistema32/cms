/**
 * API Client for LexSlider Admin
 */

const BASE_URL = '/api/plugins/lexslider';

export const api = {
    sliders: {
        list: async () => {
            const res = await fetch(`${BASE_URL}/sliders`);
            return await res.json();
        },
        get: async (id) => {
            const res = await fetch(`${BASE_URL}/sliders/${id}`);
            return await res.json();
        },
        create: async (data) => {
            const res = await fetch(`${BASE_URL}/sliders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${BASE_URL}/sliders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${BASE_URL}/sliders/${id}`, {
                method: 'DELETE'
            });
            return await res.json();
        },
        duplicate: async (id) => {
            const res = await fetch(`${BASE_URL}/sliders/${id}/duplicate`, {
                method: 'POST'
            });
            return await res.json();
        }
    },
    slides: {
        list: async (sliderId) => {
            const res = await fetch(`${BASE_URL}/sliders/${sliderId}/slides`);
            return await res.json();
        },
        create: async (sliderId, data) => {
            const res = await fetch(`${BASE_URL}/sliders/${sliderId}/slides`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${BASE_URL}/slides/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${BASE_URL}/slides/${id}`, {
                method: 'DELETE'
            });
            return await res.json();
        },
        reorder: async (ids) => {
            const res = await fetch(`${BASE_URL}/slides/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            return await res.json();
        }
    },
    layers: {
        list: async (slideId) => {
            const res = await fetch(`${BASE_URL}/slides/${slideId}/layers`);
            return await res.json();
        },
        get: async (id) => {
            const res = await fetch(`${BASE_URL}/layers/${id}`);
            return await res.json();
        },
        create: async (slideId, data) => {
            const res = await fetch(`${BASE_URL}/slides/${slideId}/layers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${BASE_URL}/layers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${BASE_URL}/layers/${id}`, {
                method: 'DELETE'
            });
            return await res.json();
        },
        duplicate: async (id) => {
            const res = await fetch(`${BASE_URL}/layers/${id}/duplicate`, {
                method: 'POST'
            });
            return await res.json();
        },
        reorder: async (id, order) => {
            const res = await fetch(`${BASE_URL}/layers/${id}/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order })
            });
            return await res.json();
        }
    }
};
