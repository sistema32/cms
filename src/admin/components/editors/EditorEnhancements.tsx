import { html, raw } from "hono/html";

export const EditorEnhancements = () => {
  return html`
    <style>
      /* Word Counter & Reading Time */
      .editor-stats {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 0.75rem 1rem;
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
        font-size: 0.875rem;
        margin-top: 1rem;
      }

      .editor-stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.7;
      }

      .editor-stat-value {
        font-weight: 600;
        color: var(--nexus-primary, #167bff);
      }

      /* SEO Score Badge */
      .seo-score-widget {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--nexus-base-100, #fff);
        border: 1px solid var(--nexus-base-200, #eef0f2);
        border-radius: var(--nexus-radius-md, 0.5rem);
      }

      .seo-score-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .seo-score-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--nexus-base-content, #1e2328);
      }

      .seo-score-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        font-size: 1.125rem;
        font-weight: 700;
        transition: all 0.3s ease;
      }

      .seo-score-badge.poor {
        background: rgba(243, 18, 96, 0.1);
        color: var(--nexus-error, #f31260);
      }

      .seo-score-badge.fair {
        background: rgba(245, 165, 36, 0.1);
        color: var(--nexus-warning, #f5a524);
      }

      .seo-score-badge.good {
        background: rgba(11, 191, 88, 0.1);
        color: var(--nexus-success, #0bbf58);
      }

      .seo-score-details {
        font-size: 0.75rem;
        color: var(--nexus-base-content, #1e2328);
        opacity: 0.6;
        line-height: 1.4;
      }

      .seo-score-issue {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.25rem;
      }

      .seo-score-issue svg {
        width: 12px;
        height: 12px;
      }
    </style>
  `;
};

export const WordCounter = () => {
  return html`
    <div class="editor-stats">
      <div class="editor-stat-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span><span id="wordCount" class="editor-stat-value">0</span> palabras</span>
      </div>
      <div class="editor-stat-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span><span id="readingTime" class="editor-stat-value">0</span> min de lectura</span>
      </div>
    </div>
  `;
};

export const SeoScoreWidget = () => {
  return html`
    <div class="seo-score-widget">
      <div class="seo-score-header">
        <span class="seo-score-title">Puntuación SEO</span>
        <div id="seoScoreBadge" class="seo-score-badge poor">0</div>
      </div>
      <div id="seoScoreDetails" class="seo-score-details">
        Completa los campos SEO para mejorar tu puntuación
      </div>
    </div>
  `;
};

export const EditorEnhancementsScript = () => {
  return raw(`
    <script>
      (function() {
        let editorInstance = null;
        
        // Word counter and reading time
        function updateWordCount() {
          let text = '';
          
          // Try to get text from CKEditor
          // Try to get text from TipTap
          if (window.editor_body) {
             // Access the underlying ProseMirror doc text often needs care, but getText() is usually fine
             text = window.editor_body.getText();
          } else if (window.CKEDITOR && window.CKEDITOR.instances) {
            // Legacy/Fallback
            const editors = Object.values(window.CKEDITOR.instances);
            if (editors.length > 0) {
              editorInstance = editors[0];
              text = editorInstance.getData().replace(/<[^>]*>/g, ' ');
            }
          }
          
          // Fallback to textarea
          if (!text) {
            const textarea = document.querySelector('textarea[name="body"]');
            if (textarea) {
              text = textarea.value;
            }
          }
          
          const words = text.trim().split(/\\s+/).filter(w => w.length > 0);
          const wordCount = words.length;
          const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
          
          const wordCountEl = document.getElementById('wordCount');
          const readingTimeEl = document.getElementById('readingTime');
          
          if (wordCountEl) wordCountEl.textContent = wordCount;
          if (readingTimeEl) readingTimeEl.textContent = readingTime || '<1';
        }
        
        // SEO Score Calculator
        function calculateSeoScore() {
          let score = 0;
          const issues = [];
          
          // Title (40 points)
          const title = document.getElementById('postTitle');
          if (title) {
            const titleLength = title.value.length;
            if (titleLength >= 50 && titleLength <= 60) {
              score += 40;
            } else if (titleLength >= 40 && titleLength <= 70) {
              score += 25;
              issues.push('Título óptimo: 50-60 caracteres');
            } else if (titleLength > 0) {
              score += 10;
              issues.push('Título muy corto o muy largo');
            } else {
              issues.push('Falta título');
            }
          }
          
          // Meta Title (20 points)
          const metaTitle = document.querySelector('input[name="seoMetaTitle"]');
          if (metaTitle && metaTitle.value.length >= 50 && metaTitle.value.length <= 60) {
            score += 20;
          } else if (metaTitle && metaTitle.value.length > 0) {
            score += 10;
            issues.push('Meta título: 50-60 caracteres ideal');
          } else {
            issues.push('Falta meta título');
          }
          
          // Meta Description (30 points)
          const metaDesc = document.querySelector('textarea[name="seoMetaDescription"]');
          if (metaDesc && metaDesc.value.length >= 150 && metaDesc.value.length <= 160) {
            score += 30;
          } else if (metaDesc && metaDesc.value.length > 0) {
            score += 15;
            issues.push('Meta descripción: 150-160 caracteres ideal');
          } else {
            issues.push('Falta meta descripción');
          }
          
          // Keywords (10 points)
          const keywords = document.querySelector('input[name="seoMetaKeywords"]');
          if (keywords && keywords.value.length > 0) {
            score += 10;
          } else {
            issues.push('Agrega palabras clave');
          }
          
          // Update badge
          const badge = document.getElementById('seoScoreBadge');
          const details = document.getElementById('seoScoreDetails');
          
          if (badge) {
            badge.textContent = score;
            badge.className = 'seo-score-badge ' + 
              (score >= 70 ? 'good' : score >= 40 ? 'fair' : 'poor');
          }
          
          if (details) {
            if (score >= 70) {
              details.innerHTML = '✅ Excelente optimización SEO';
            } else if (score >= 40) {
              details.innerHTML = issues.slice(0, 2).map(i => 
                \`<div class="seo-score-issue">⚠️ \${i}</div>\`
              ).join('');
            } else {
              details.innerHTML = issues.slice(0, 3).map(i => 
                \`<div class="seo-score-issue">❌ \${i}</div>\`
              ).join('');
            }
          }
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
          // Update word count on editor change
          // Update word count on editor change
          const checkEditor = setInterval(() => {
            // Check for TipTap instance
            if (window.editor_body) {
              clearInterval(checkEditor);
              
              // Initial update
              updateWordCount();
              
              // Listen for changes (TipTap)
              window.editor_body.on('update', () => {
                updateWordCount();
              });
            }
          }, 500);

          // Stop checking after 10 seconds
          setTimeout(() => clearInterval(checkEditor), 10000);
          
          // Fallback: update on textarea change
          const textarea = document.querySelector('textarea[name="body"]');
          if (textarea) {
            textarea.addEventListener('input', updateWordCount);
          }
          
          // Update SEO score on input
          const seoInputs = document.querySelectorAll(
            'input[name="seoMetaTitle"], textarea[name="seoMetaDescription"], input[name="seoMetaKeywords"]'
          );
          seoInputs.forEach(input => {
            input.addEventListener('input', calculateSeoScore);
          });
          
          const titleInput = document.getElementById('postTitle');
          if (titleInput) {
            titleInput.addEventListener('input', calculateSeoScore);
          }
          
          // Initial calculation
          setTimeout(calculateSeoScore, 500);
          setTimeout(updateWordCount, 500);
        });
      })();
    </script>
  `);
};
