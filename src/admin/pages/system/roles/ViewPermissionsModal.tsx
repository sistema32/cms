import { html } from "hono/html";
import { NexusModal, NexusButton } from "@/admin/components/ui/index.ts";

export const ViewPermissionsModal = () => {
    return NexusModal({
        id: "viewPermissionsModal",
        title: "Permisos del Rol", // Updated by JS
        size: "sm",
        children: html`
      <div id="viewPermissionsContent" style="padding: 1rem 0;"></div>
    `,
        footer: NexusButton({
            label: "Cerrar",
            type: "outline",
            className: "js-close-view-permissions",
            htmlType: "button"
        })
    });
};
