import { html } from "hono/html";
import { NexusCard } from "@/admin/components/ui/index.ts";

interface TaxonomyCardProps {
    title: string;
    items: Array<{ id: number; name: string }>;
    selectedItems: number[];
    inputName: string; // e.g., 'categories[]'
    newItemInputId: string; // e.g., 'newCategoryInput'
    addNewFunction: string; // e.g., 'addNewCategory()'
    emptyMessage: string;
    newItemPlaceholder: string;
    newItemDataId: string; // e.g., 'newCategoriesData'
    newItemDataName: string; // e.g., 'newCategories'
}

export const TaxonomyCard = (props: TaxonomyCardProps) => {
    const {
        title, items, selectedItems, inputName,
        newItemInputId, addNewFunction, emptyMessage,
        newItemPlaceholder, newItemDataId, newItemDataName
    } = props;

    return NexusCard({
        header: html`<h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${title}</h3>`,
        children: html`
      ${items.length > 0 ? html`
        <div class="checkbox-list" style="margin-bottom: 1rem;">
          ${items.map(item => html`
            <div class="checkbox-item">
              <input
                type="checkbox"
                id="tax-${inputName.replace(/[^a-z0-9]/g, '')}-${item.id}"
                name="${inputName}"
                value="${item.id}"
                ${selectedItems.includes(item.id) ? "checked" : ""}
              />
              <label for="tax-${inputName.replace(/[^a-z0-9]/g, '')}-${item.id}">${item.name}</label>
            </div>
          `)}
        </div>
      ` : html`
        <p style="font-size: 0.875rem; color: #888; margin-bottom: 1rem;">${emptyMessage}</p>
      `}

      <!-- Add new item -->
      <div style="border-top: 1px solid var(--nexus-base-200, #eef0f2); padding-top: 1rem;">
        <label class="form-label" style="margin-bottom: 0.5rem;">${newItemPlaceholder}</label>
        <div style="display: flex; gap: 0.5rem;">
          <input
            type="text"
            id="${newItemInputId}"
            placeholder="Nombre"
            class="form-input"
            style="flex: 1;"
          />
          <button
            type="button"
            onclick="${addNewFunction}"
            style="padding: 0.75rem 1rem; background: #167bff; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; white-space: nowrap;"
          >
            Agregar
          </button>
        </div>
        <input type="hidden" id="${newItemDataId}" name="${newItemDataName}" value="" />
      </div>
    `
    });
};
