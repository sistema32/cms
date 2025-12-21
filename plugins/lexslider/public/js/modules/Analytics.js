/**
 * Analytics.js - Slider analytics and tracking
 * Tracks slide views, clicks, engagement, and A/B testing
 */

// Analytics data storage
const analyticsData = {
    slides: new Map(),
    clicks: [],
    sessions: [],
    abTests: new Map()
};

// Session tracking
let sessionId = null;
let sessionStart = null;

/**
 * Initialize analytics for a slider
 */
export function initAnalytics(sliderId, options = {}) {
    sessionId = generateSessionId();
    sessionStart = Date.now();

    trackEvent('session_start', { sliderId });

    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
        trackEvent('session_end', {
            sliderId,
            duration: Date.now() - sessionStart
        });
        flushAnalytics();
    });

    return sessionId;
}

/**
 * Track slide view
 */
export function trackSlideView(sliderId, slideIndex, slideId) {
    const key = `${sliderId}_${slideId}`;
    const current = analyticsData.slides.get(key) || { views: 0, totalTime: 0, lastView: null };

    current.views++;
    current.lastView = Date.now();

    analyticsData.slides.set(key, current);

    trackEvent('slide_view', {
        sliderId,
        slideIndex,
        slideId,
        timestamp: Date.now()
    });
}

/**
 * Track slide time
 */
export function trackSlideTime(sliderId, slideId, duration) {
    const key = `${sliderId}_${slideId}`;
    const current = analyticsData.slides.get(key) || { views: 0, totalTime: 0, lastView: null };

    current.totalTime += duration;
    analyticsData.slides.set(key, current);
}

/**
 * Track layer click
 */
export function trackClick(sliderId, slideId, layerId, layerType, action) {
    const clickData = {
        sliderId,
        slideId,
        layerId,
        layerType,
        action,
        timestamp: Date.now(),
        sessionId
    };

    analyticsData.clicks.push(clickData);

    trackEvent('layer_click', clickData);
}

/**
 * Track custom event
 */
export function trackEvent(eventName, data = {}) {
    const event = {
        event: eventName,
        ...data,
        sessionId,
        timestamp: Date.now()
    };

    // Store locally
    const events = getStoredEvents();
    events.push(event);

    // Keep only last 1000 events
    if (events.length > 1000) {
        events.splice(0, events.length - 1000);
    }

    localStorage.setItem('lexslider_analytics', JSON.stringify(events));

    // Send to server if endpoint configured
    sendToServer(event);
}

/**
 * Get stored events
 */
function getStoredEvents() {
    try {
        return JSON.parse(localStorage.getItem('lexslider_analytics') || '[]');
    } catch {
        return [];
    }
}

/**
 * Send analytics to server
 */
async function sendToServer(event) {
    const endpoint = window.LEXSLIDER_ANALYTICS_ENDPOINT;
    if (!endpoint) return;

    try {
        await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
        });
    } catch (err) {
        console.warn('[Analytics] Failed to send:', err);
    }
}

/**
 * Flush all pending analytics (on page unload)
 */
function flushAnalytics() {
    const endpoint = window.LEXSLIDER_ANALYTICS_ENDPOINT;
    if (!endpoint) return;

    const events = getStoredEvents();
    if (events.length === 0) return;

    // Use sendBeacon for reliable delivery on page unload
    if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, JSON.stringify({ events, flush: true }));
    }
}

/**
 * Generate session ID
 */
function generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== A/B TESTING ====================

/**
 * Create A/B test
 */
export function createABTest(testId, variants) {
    const test = {
        id: testId,
        variants,
        assignments: new Map(),
        results: variants.reduce((acc, v) => {
            acc[v] = { views: 0, clicks: 0, conversions: 0 };
            return acc;
        }, {})
    };

    analyticsData.abTests.set(testId, test);
    return test;
}

/**
 * Get variant for user
 */
export function getVariant(testId, userId = null) {
    const test = analyticsData.abTests.get(testId);
    if (!test) return null;

    const uid = userId || sessionId;

    // Check if already assigned
    if (test.assignments.has(uid)) {
        return test.assignments.get(uid);
    }

    // Assign randomly
    const variant = test.variants[Math.floor(Math.random() * test.variants.length)];
    test.assignments.set(uid, variant);

    trackEvent('ab_assignment', { testId, variant, userId: uid });

    return variant;
}

/**
 * Track A/B conversion
 */
export function trackConversion(testId, variant, type = 'click') {
    const test = analyticsData.abTests.get(testId);
    if (!test || !test.results[variant]) return;

    if (type === 'view') {
        test.results[variant].views++;
    } else if (type === 'click') {
        test.results[variant].clicks++;
    } else if (type === 'conversion') {
        test.results[variant].conversions++;
    }

    trackEvent('ab_conversion', { testId, variant, type });
}

/**
 * Get A/B test results
 */
export function getABResults(testId) {
    const test = analyticsData.abTests.get(testId);
    if (!test) return null;

    return Object.entries(test.results).map(([variant, data]) => ({
        variant,
        ...data,
        ctr: data.views > 0 ? (data.clicks / data.views * 100).toFixed(2) : 0,
        conversionRate: data.clicks > 0 ? (data.conversions / data.clicks * 100).toFixed(2) : 0
    }));
}

// ==================== REPORTING ====================

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(sliderId) {
    const events = getStoredEvents().filter(e => e.sliderId === sliderId);

    const slideViews = events.filter(e => e.event === 'slide_view').length;
    const uniqueSlides = new Set(events.filter(e => e.event === 'slide_view').map(e => e.slideId)).size;
    const clicks = events.filter(e => e.event === 'layer_click').length;
    const sessions = new Set(events.map(e => e.sessionId)).size;

    const slideStats = {};
    events.filter(e => e.event === 'slide_view').forEach(e => {
        if (!slideStats[e.slideId]) {
            slideStats[e.slideId] = { views: 0, index: e.slideIndex };
        }
        slideStats[e.slideId].views++;
    });

    return {
        totalViews: slideViews,
        uniqueSlides,
        totalClicks: clicks,
        totalSessions: sessions,
        ctr: slideViews > 0 ? (clicks / slideViews * 100).toFixed(2) : 0,
        slideStats: Object.entries(slideStats).map(([id, data]) => ({
            slideId: id,
            ...data
        })).sort((a, b) => b.views - a.views)
    };
}

/**
 * Generate analytics dashboard HTML
 */
export function generateAnalyticsDashboardHTML(summary) {
    return `
        <div class="analytics-dashboard">
            <div class="analytics-stats">
                <div class="stat-card">
                    <span class="stat-value">${summary.totalViews}</span>
                    <span class="stat-label">Total Views</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${summary.totalClicks}</span>
                    <span class="stat-label">Total Clicks</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${summary.ctr}%</span>
                    <span class="stat-label">CTR</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${summary.totalSessions}</span>
                    <span class="stat-label">Sessions</span>
                </div>
            </div>
            <div class="analytics-chart">
                <h4>Slide Performance</h4>
                <div class="slide-bars">
                    ${summary.slideStats.map(s => `
                        <div class="slide-bar">
                            <span class="slide-label">Slide ${s.index + 1}</span>
                            <div class="bar" style="width: ${(s.views / summary.totalViews * 100)}%"></div>
                            <span class="bar-value">${s.views}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate analytics CSS
 */
export function generateAnalyticsCSS() {
    return `
        .analytics-dashboard {
            padding: 20px;
        }
        
        .analytics-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .stat-card {
            background: #1a1a1a;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: #8470ff;
        }
        
        .stat-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .analytics-chart h4 {
            margin-bottom: 15px;
            font-size: 14px;
            color: #aaa;
        }
        
        .slide-bars {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .slide-bar {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .slide-label {
            width: 70px;
            font-size: 12px;
            color: #888;
        }
        
        .bar {
            height: 20px;
            background: linear-gradient(90deg, #8470ff, #a890ff);
            border-radius: 4px;
            min-width: 4px;
            transition: width 0.3s ease;
        }
        
        .bar-value {
            font-size: 12px;
            color: #aaa;
        }
    `;
}

export default {
    initAnalytics,
    trackSlideView,
    trackSlideTime,
    trackClick,
    trackEvent,
    createABTest,
    getVariant,
    trackConversion,
    getABResults,
    getAnalyticsSummary,
    generateAnalyticsDashboardHTML,
    generateAnalyticsCSS
};
