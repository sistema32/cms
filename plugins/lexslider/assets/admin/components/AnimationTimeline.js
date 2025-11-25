/**
 * AnimationTimeline - Visual animation timeline editor
 */

import { html } from 'https://esm.sh/htm/preact';
import { useState, useRef, useEffect } from 'https://esm.sh/preact/hooks';
import { layers, selectedLayer, uiState, actions } from '../services/state.js';
import { applyAnimation, animationPresets } from '../utils/animations.js';

export function AnimationTimeline() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const timelineRef = useRef(null);
    const animationFrameRef = useRef(null);

    const TIMELINE_DURATION = 6000; // 6 seconds
    const PIXEL_PER_SECOND = 100;

    useEffect(() => {
        if (isPlaying) {
            const startTime = Date.now() - currentTime;

            const animate = () => {
                const elapsed = Date.now() - startTime;

                if (elapsed >= TIMELINE_DURATION) {
                    setCurrentTime(0);
                    setIsPlaying(false);
                } else {
                    setCurrentTime(elapsed);
                    animationFrameRef.current = requestAnimationFrame(animate);
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [isPlaying]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleStop = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleTimelineClick = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / rect.width) * TIMELINE_DURATION;
        setCurrentTime(Math.max(0, Math.min(time, TIMELINE_DURATION)));
    };

    const getLayerAnimationBar = (layer) => {
        const animations = layer.animations || {};
        const bars = [];

        // In animation
        if (animations.in) {
            const duration = animations.in.duration || 1000;
            const delay = animations.in.delay || 0;
            bars.push({
                type: 'in',
                start: delay,
                duration: duration,
                color: '#10b981',
            });
        }

        // Out animation
        if (animations.out) {
            const duration = animations.out.duration || 800;
            const delay = animations.out.delay || 4000;
            bars.push({
                type: 'out',
                start: delay,
                duration: duration,
                color: '#ef4444',
            });
        }

        return bars;
    };

    return html`
        <div class="animation-timeline">
            <div class="timeline-header">
                <h4>Animation Timeline</h4>
                <div class="timeline-controls">
                    <button onClick=${handlePlayPause} class="control-btn">
                        ${isPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick=${handleStop} class="control-btn">
                        ⏹
                    </button>
                    <span class="time-display">
                        ${(currentTime / 1000).toFixed(2)}s / ${TIMELINE_DURATION / 1000}s
                    </span>
                </div>
            </div>

            <div class="timeline-content">
                <div class="timeline-layers">
                    ${layers.value.map(layer => {
        const isSelected = selectedLayer.value?.id === layer.id;
        const animationBars = getLayerAnimationBar(layer);

        return html`
                            <div
                                key=${layer.id}
                                class=${`timeline-layer ${isSelected ? 'selected' : ''}`}
                                onClick=${() => actions.selectLayer(layer)}
                            >
                                <div class="timeline-layer-name">
                                    ${layer.content?.substring(0, 15) || layer.type}
                                </div>
                                <div class="timeline-layer-track">
                                    ${animationBars.map((bar, idx) => {
            const left = (bar.start / TIMELINE_DURATION) * 100;
            const width = (bar.duration / TIMELINE_DURATION) * 100;

            return html`
                                            <div
                                                key=${idx}
                                                class="animation-bar"
                                                style=${{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: bar.color,
                }}
                                                title=${`${bar.type}: ${bar.duration}ms`}
                                            >
                                                <span class="bar-label">${bar.type}</span>
                                            </div>
                                        `;
        })}
                                </div>
                            </div>
                        `;
    })}
                </div>

                <div
                    ref=${timelineRef}
                    class="timeline-ruler"
                    onClick=${handleTimelineClick}
                >
                    <div class="timeline-playhead" style=${{ left: `${(currentTime / TIMELINE_DURATION) * 100}%` }}></div>
                    ${[0, 1, 2, 3, 4, 5, 6].map(second => html`
                        <div key=${second} class="timeline-marker" style=${{ left: `${(second / 6) * 100}%` }}>
                            ${second}s
                        </div>
                    `)}
                </div>
            </div>
        </div>
    `;
}
