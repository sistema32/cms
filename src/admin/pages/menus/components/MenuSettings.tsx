import { html } from "hono/html";

interface MenuSettingsProps {
    menu: any;
    registeredLocations: string[];
    adminPath: string;
}

export const MenuSettings = ({ menu, registeredLocations, adminPath }: MenuSettingsProps) => {
    return html`
        <div class="settings-card">
            <h3>Ajustes del Menú</h3>
            <form id="menuSettingsForm" action="${adminPath}/appearance/menus/${menu.id}" method="POST">
                <div class="form-group">
                    <label class="form-label">Nombre del Menú</label>
                    <input type="text" name="name" class="form-input" value="${menu.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Ubicación</label>
                    <select name="location" class="form-input">
                        <option value="">-- Sin ubicación --</option>
                        ${registeredLocations.map(loc => html`
                            <option value="${loc}" ${menu.location === loc ? 'selected' : ''}>${loc}</option>
                        `)}
                    </select>
                    <p class="text-hint mt-1">
                        Selecciona dónde mostrar este menú en el tema actual.
                    </p>
                </div>
                <div class="form-group">
                     <label class="item-checkbox">
                        <input type="checkbox" name="isActive" ${menu.isActive ? 'checked' : ''}> 
                        Activo
                     </label>
                </div>
            </form>
        </div>
    `;
};
