/**
 * Main App Component
 * Routes between Dashboard and EditorView
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { Dashboard } from '../components/Dashboard.js';
import { EditorView } from '../components/EditorView.js';

export function App() {
    const [view, setView] = useState('dashboard');
    const [sliderId, setSliderId] = useState(null);

    // Parse URL parameters
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const idParam = params.get('id');

        if (viewParam === 'edit' && idParam) {
            setView('edit');
            setSliderId(idParam);
        } else {
            setView('dashboard');
            setSliderId(null);
        }
    }, []);

    const handleBackToDashboard = () => {
        window.location.href = window.location.pathname;
    };

    if (view === 'edit' && sliderId) {
        return html`<${EditorView} sliderId=${sliderId} onBack=${handleBackToDashboard} />`;
    }

    return html`<${Dashboard} />`;
}
