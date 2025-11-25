import { html } from "https://esm.sh/htm@3.1.1/preact";
import { useState } from "https://esm.sh/preact@10.19.3/hooks";
import { route } from "https://esm.sh/preact-router@4.1.2";

/**
 * LexSlider - Create/Edit Slider Form
 */

export function SliderForm({ sliderId = null }) {
    const isEdit = sliderId !== null;

    const [formData, setFormData] = useState({
        name: '',
        alias: '',
        type: 'simple',
        width: 1200,
        height: 600,
        settings: {
            autoplay: true,
            autoplayDelay: 5000,
            loop: true,
            navigation: true,
            pagination: true,
            effect: 'slide',
            speed: 500
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = isEdit
                ? `/api/lexslider/sliders/${sliderId}`
                : '/api/lexslider/sliders';

            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save slider');

            const slider = await response.json();
            alert(isEdit ? 'Slider actualizado' : 'Slider creado exitosamente');
            route(`/admincp/lexslider/edit/${slider.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function updateField(field, value) {
        setFormData({ ...formData, [field]: value });
    }

    function updateSetting(setting, value) {
        setFormData({
            ...formData,
            settings: { ...formData.settings, [setting]: value }
        });
    }

    return html`
    <div class="lexslider-form-page">
      <div class="lexslider-form-header">
        <h1>${isEdit ? 'Editar Slider' : 'Nuevo Slider'}</h1>
        <a href="/admincp/lexslider" class="btn btn-secondary">
          ← Volver a lista
        </a>
      </div>

      ${error && html`
        <div class="alert alert-error">
          ${error}
        </div>
      `}

      <form onSubmit=${handleSubmit} class="lexslider-form">
        <div class="form-section">
          <h2>Información Básica</h2>
          
          <div class="form-group">
            <label for="name">Nombre del Slider *</label>
            <input
              type="text"
              id="name"
              value=${formData.name}
              onInput=${(e) => updateField('name', e.target.value)}
              required
              placeholder="Ej: Hero Slider, Galería de Productos"
            />
          </div>

          <div class="form-group">
            <label for="alias">Alias (para shortcode)</label>
            <input
              type="text"
              id="alias"
              value=${formData.alias}
              onInput=${(e) => updateField('alias', e.target.value)}
              placeholder="Ej: hero, gallery"
            />
            <small>Usa [lexslider alias="${formData.alias || 'hero'}"] en tu contenido</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="width">Ancho (px)</label>
              <input
                type="number"
                id="width"
                value=${formData.width}
                onInput=${(e) => updateField('width', parseInt(e.target.value))}
                min="100"
                max="3840"
              />
            </div>

            <div class="form-group">
              <label for="height">Alto (px)</label>
              <input
                type="number"
                id="height"
                value=${formData.height}
                onInput=${(e) => updateField('height', parseInt(e.target.value))}
                min="100"
                max="2160"
              />
            </div>

            <div class="form-group">
              <label for="type">Tipo</label>
              <select
                id="type"
                value=${formData.type}
                onChange=${(e) => updateField('type', e.target.value)}
              >
                <option value="simple">Simple</option>
                <option value="carousel">Carousel</option>
                <option value="showcase">Showcase</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Configuración</h2>
          
          <div class="form-group">
            <label>
              <input
                type="checkbox"
                checked=${formData.settings.autoplay}
                onChange=${(e) => updateSetting('autoplay', e.target.checked)}
              />
              Reproducción automática
            </label>
          </div>

          ${formData.settings.autoplay && html`
            <div class="form-group">
              <label for="autoplayDelay">Delay de autoplay (ms)</label>
              <input
                type="number"
                id="autoplayDelay"
                value=${formData.settings.autoplayDelay}
                onInput=${(e) => updateSetting('autoplayDelay', parseInt(e.target.value))}
                min="1000"
                max="10000"
                step="500"
              />
            </div>
          `}

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                checked=${formData.settings.loop}
                onChange=${(e) => updateSetting('loop', e.target.checked)}
              />
              Loop infinito
            </label>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                checked=${formData.settings.navigation}
                onChange=${(e) => updateSetting('navigation', e.target.checked)}
              />
              Mostrar flechas de navegación
            </label>
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                checked=${formData.settings.pagination}
                onChange=${(e) => updateSetting('pagination', e.target.checked)}
              />
              Mostrar paginación (bullets)
            </label>
          </div>

          <div class="form-group">
            <label for="effect">Efecto de transición</label>
            <select
              id="effect"
              value=${formData.settings.effect}
              onChange=${(e) => updateSetting('effect', e.target.value)}
            >
              <option value="slide">Slide</option>
              <option value="fade">Fade</option>
              <option value="cube">Cube</option>
              <option value="flip">Flip</option>
            </select>
          </div>

          <div class="form-group">
            <label for="speed">Velocidad de transición (ms)</label>
            <input
              type="number"
              id="speed"
              value=${formData.settings.speed}
              onInput=${(e) => updateSetting('speed', parseInt(e.target.value))}
              min="100"
              max="2000"
              step="100"
            />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" disabled=${loading}>
            ${loading ? 'Guardando...' : (isEdit ? 'Actualizar Slider' : 'Crear Slider')}
          </button>
          <a href="/admincp/lexslider" class="btn btn-secondary">
            Cancelar
          </a>
        </div>
      </form>
    </div>

    <style>
      .lexslider-form-page {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .lexslider-form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .lexslider-form-header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e2328;
        margin: 0;
      }

      .lexslider-form {
        background: #fff;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .form-section {
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #f3f4f6;
      }

      .form-section:last-of-type {
        border-bottom: none;
      }

      .form-section h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e2328;
        margin: 0 0 1.5rem 0;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        font-weight: 500;
        color: #1e2328;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .form-group input[type="text"],
      .form-group input[type="number"],
      .form-group select {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid #dcdee0;
        border-radius: 6px;
        font-size: 0.875rem;
        transition: all 0.2s;
      }

      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #167bff;
        box-shadow: 0 0 0 3px rgba(22, 123, 255, 0.1);
      }

      .form-group small {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.8125rem;
        color: #6b7280;
      }

      .form-group input[type="checkbox"] {
        margin-right: 0.5rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        padding-top: 1.5rem;
      }

      .alert {
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1.5rem;
      }

      .alert-error {
        background: #fee;
        color: #f31260;
        border: 1px solid #fdd;
      }
    </style>
  `;
}
