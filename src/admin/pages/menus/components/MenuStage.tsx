import { html } from "hono/html";

export const MenuStage = () => {
    return html`
        <div class="menu-stage">
            <div class="stage-head">
                <div>
                    <p class="eyebrow">Lienzo</p>
                    <h3>Estructura del menú</h3>
                    <p class="text-hint">Arrastra tarjetas desde la izquierda para añadirlas y reordena sobre este lienzo. Desplaza ligeramente a la derecha para anidar.</p>
                </div>
            </div>

            <div class="drop-helper" id="menu-drop-helper">
                <p>Arrastra aquí para agregar</p>
                <span>Drop & reorder</span>
            </div>

            <div class="menu-structure dd" id="menu-nestable">
                <ol class="dd-list" id="menu-root">
                    <!-- Items inserted by JS -->
                </ol>
            </div>
        </div>
    `;
};
