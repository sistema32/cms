/**
 * SlideScheduler.js - Time-based slide visibility
 * Show/hide slides based on date and time
 */

// Schedule types
export const SCHEDULE_TYPES = {
    always: { label: 'Always Visible' },
    dateRange: { label: 'Date Range' },
    recurring: { label: 'Recurring Schedule' },
    countdown: { label: 'Before/After Date' }
};

// Days of week
export const DAYS_OF_WEEK = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
};

/**
 * Create schedule configuration
 */
export function createSchedule(config = {}) {
    return {
        id: config.id || `schedule_${Date.now()}`,
        type: config.type || 'always',
        enabled: config.enabled !== false,
        timezone: config.timezone || 'local',

        // Date range settings
        startDate: config.startDate || null,
        endDate: config.endDate || null,

        // Time range (daily)
        startTime: config.startTime || null,  // "09:00"
        endTime: config.endTime || null,      // "17:00"

        // Recurring schedule
        daysOfWeek: config.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],  // All days

        // Countdown settings
        countdownDate: config.countdownDate || null,
        showBefore: config.showBefore !== false,  // Show before countdown date
        showAfter: config.showAfter ?? true,      // Show after countdown date

        // Fallback behavior
        fallbackSlide: config.fallbackSlide || null  // Slide ID to show instead
    };
}

/**
 * Check if current time matches schedule
 */
export function isScheduleActive(schedule, now = new Date()) {
    if (!schedule || !schedule.enabled) return true;

    switch (schedule.type) {
        case 'always':
            return true;

        case 'dateRange':
            return checkDateRange(schedule, now);

        case 'recurring':
            return checkRecurring(schedule, now);

        case 'countdown':
            return checkCountdown(schedule, now);

        default:
            return true;
    }
}

/**
 * Check date range
 */
function checkDateRange(schedule, now) {
    const currentTime = now.getTime();

    // Check start date
    if (schedule.startDate) {
        const start = new Date(schedule.startDate).getTime();
        if (currentTime < start) return false;
    }

    // Check end date
    if (schedule.endDate) {
        const end = new Date(schedule.endDate).getTime();
        if (currentTime > end) return false;
    }

    // Check time range
    if (schedule.startTime && schedule.endTime) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            return false;
        }
    }

    return true;
}

/**
 * Check recurring schedule
 */
function checkRecurring(schedule, now) {
    // Check day of week
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        if (!schedule.daysOfWeek.includes(now.getDay())) {
            return false;
        }
    }

    // Check time range
    if (schedule.startTime && schedule.endTime) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            return false;
        }
    }

    return true;
}

/**
 * Check countdown-based visibility
 */
function checkCountdown(schedule, now) {
    if (!schedule.countdownDate) return true;

    const target = new Date(schedule.countdownDate).getTime();
    const current = now.getTime();

    if (current < target) {
        return schedule.showBefore;
    } else {
        return schedule.showAfter;
    }
}

/**
 * Filter slides based on schedules
 */
export function filterScheduledSlides(slides, schedules = {}, now = new Date()) {
    return slides.filter(slide => {
        const schedule = schedules[slide.id];
        if (!schedule) return true;  // No schedule = always visible
        return isScheduleActive(schedule, now);
    });
}

/**
 * Get next scheduled visibility change
 */
export function getNextChange(schedule, now = new Date()) {
    if (!schedule || !schedule.enabled) return null;

    const current = now.getTime();

    switch (schedule.type) {
        case 'dateRange':
            if (schedule.startDate) {
                const start = new Date(schedule.startDate).getTime();
                if (current < start) return new Date(start);
            }
            if (schedule.endDate) {
                const end = new Date(schedule.endDate).getTime();
                if (current < end) return new Date(end);
            }
            break;

        case 'countdown':
            if (schedule.countdownDate) {
                const target = new Date(schedule.countdownDate).getTime();
                if (current < target) return new Date(target);
            }
            break;
    }

    return null;
}

/**
 * Generate schedule editor HTML
 */
export function generateScheduleEditorHTML(schedule = {}) {
    const s = createSchedule(schedule);

    return `
        <div class="schedule-editor" data-schedule-id="${s.id}">
            <div class="schedule-toggle">
                <label class="toggle-switch">
                    <input type="checkbox" class="schedule-enabled" ${s.enabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
                <span>Enable Schedule</span>
            </div>
            
            <div class="schedule-type">
                <label>Schedule Type</label>
                <select class="schedule-type-select">
                    <option value="always" ${s.type === 'always' ? 'selected' : ''}>Always Visible</option>
                    <option value="dateRange" ${s.type === 'dateRange' ? 'selected' : ''}>Date Range</option>
                    <option value="recurring" ${s.type === 'recurring' ? 'selected' : ''}>Recurring</option>
                    <option value="countdown" ${s.type === 'countdown' ? 'selected' : ''}>Before/After Date</option>
                </select>
            </div>
            
            <div class="schedule-dates" style="display: ${s.type === 'dateRange' ? 'block' : 'none'};">
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="datetime-local" class="schedule-start-date" value="${s.startDate || ''}">
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="datetime-local" class="schedule-end-date" value="${s.endDate || ''}">
                    </div>
                </div>
            </div>
            
            <div class="schedule-time">
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Time</label>
                        <input type="time" class="schedule-start-time" value="${s.startTime || ''}">
                    </div>
                    <div class="form-group">
                        <label>End Time</label>
                        <input type="time" class="schedule-end-time" value="${s.endTime || ''}">
                    </div>
                </div>
            </div>
            
            <div class="schedule-days" style="display: ${s.type === 'recurring' ? 'block' : 'none'};">
                <label>Days of Week</label>
                <div class="days-checkboxes">
                    ${Object.entries(DAYS_OF_WEEK).map(([num, name]) => `
                        <label>
                            <input type="checkbox" value="${num}" ${s.daysOfWeek.includes(Number(num)) ? 'checked' : ''}>
                            ${name.substring(0, 3)}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="schedule-countdown" style="display: ${s.type === 'countdown' ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Target Date</label>
                    <input type="datetime-local" class="schedule-countdown-date" value="${s.countdownDate || ''}">
                </div>
                <div class="form-row">
                    <label>
                        <input type="checkbox" class="schedule-show-before" ${s.showBefore ? 'checked' : ''}>
                        Show before date
                    </label>
                    <label>
                        <input type="checkbox" class="schedule-show-after" ${s.showAfter ? 'checked' : ''}>
                        Show after date
                    </label>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate schedule CSS
 */
export function generateScheduleCSS() {
    return `
        .schedule-editor {
            padding: 15px;
            background: #1a1a1a;
            border-radius: 8px;
        }
        
        .schedule-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .schedule-type {
            margin-bottom: 15px;
        }
        
        .schedule-type select {
            width: 100%;
            padding: 10px;
            background: #252525;
            border: 1px solid #333;
            border-radius: 6px;
            color: #ddd;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .form-group {
            margin-bottom: 10px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #888;
        }
        
        .form-group input {
            width: 100%;
            padding: 8px 10px;
            background: #252525;
            border: 1px solid #333;
            border-radius: 6px;
            color: #ddd;
        }
        
        .days-checkboxes {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .days-checkboxes label {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 10px;
            background: #252525;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
        }
        
        .days-checkboxes label:has(input:checked) {
            background: rgba(132,112,255,0.2);
            color: #8470ff;
        }
        
        .toggle-switch {
            position: relative;
            width: 40px;
            height: 22px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #333;
            border-radius: 11px;
            transition: 0.3s;
        }
        
        .toggle-slider::before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background: #888;
            border-radius: 50%;
            transition: 0.3s;
        }
        
        .toggle-switch input:checked + .toggle-slider {
            background: rgba(132,112,255,0.5);
        }
        
        .toggle-switch input:checked + .toggle-slider::before {
            transform: translateX(18px);
            background: #8470ff;
        }
    `;
}

/**
 * Generate schedule runtime script
 */
export function generateScheduleScript() {
    return `
        (function() {
            const sliders = document.querySelectorAll('[data-lexslider]');
            
            sliders.forEach(function(slider) {
                const schedulesData = slider.dataset.schedules;
                if (!schedulesData) return;
                
                try {
                    const schedules = JSON.parse(schedulesData);
                    
                    function checkSchedules() {
                        const now = new Date();
                        const slides = slider.querySelectorAll('.slide');
                        
                        slides.forEach(function(slide) {
                            const schedule = schedules[slide.dataset.slideId];
                            if (!schedule) return;
                            
                            const isActive = ${isScheduleActive.toString()}(schedule, now);
                            slide.style.display = isActive ? '' : 'none';
                        });
                    }
                    
                    // Initial check
                    checkSchedules();
                    
                    // Check every minute
                    setInterval(checkSchedules, 60000);
                } catch (e) {
                    console.error('Schedule parse error:', e);
                }
            });
        })();
    `;
}

export default {
    SCHEDULE_TYPES,
    DAYS_OF_WEEK,
    createSchedule,
    isScheduleActive,
    filterScheduledSlides,
    getNextChange,
    generateScheduleEditorHTML,
    generateScheduleCSS,
    generateScheduleScript
};
