import { html, raw } from "hono/html";

interface Revision {
  id: number;
  revisionNumber: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  status: string;
  changesSummary: string | null;
  createdAt: string;
  author: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface RevisionHistoryProps {
  contentId: number;
  currentTitle: string;
}

export const RevisionHistory = (props: RevisionHistoryProps) => {
  const modalId = `revisionModal_${props.contentId}`;
  const compareModalId = `compareModal_${props.contentId}`;

  return html`
    <!-- Botón para abrir historial -->
    <button
      type="button"
      onclick="openRevisionHistory_${props.contentId}()"
      class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Ver Historial de Versiones
    </button>

    <!-- Modal de Historial -->
    <div id="${modalId}" class="fixed inset-0 bg-gray-500 bg-opacity-75 hidden z-50" style="display: none;">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">
              Historial de Versiones: ${props.currentTitle}
            </h3>
            <button
              onclick="closeRevisionHistory_${props.contentId}()"
              class="text-gray-400 hover:text-gray-500"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Loading -->
          <div id="${modalId}_loading" class="px-6 py-12 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p class="mt-4 text-gray-600">Cargando historial...</p>
          </div>

          <!-- Content -->
          <div id="${modalId}_content" class="hidden">
            <div class="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div id="${modalId}_revisions" class="space-y-4">
                <!-- Las revisiones se cargarán aquí -->
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onclick="closeRevisionHistory_${props.contentId}()"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Comparación -->
    <div id="${compareModalId}" class="fixed inset-0 bg-gray-500 bg-opacity-75 hidden z-50" style="display: none;">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Comparar Versiones</h3>
            <button
              onclick="closeCompareModal_${props.contentId}()"
              class="text-gray-400 hover:text-gray-500"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div id="${compareModalId}_content">
              <!-- La comparación se cargará aquí -->
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onclick="closeCompareModal_${props.contentId}()"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    ${raw(`
      <script type="module">
        // Variables globales
        window.revisions_${props.contentId} = [];
        window.selectedRevisions_${props.contentId} = [];

        // Abrir modal de historial
        window.openRevisionHistory_${props.contentId} = async function() {
          const modal = document.getElementById('${modalId}');
          const loading = document.getElementById('${modalId}_loading');
          const content = document.getElementById('${modalId}_content');

          modal.style.display = 'block';
          loading.style.display = 'block';
          content.style.display = 'none';

          try {
            const response = await fetch('/api/content/${props.contentId}/revisions', {
              credentials: 'include'
            });

            if (!response.ok) throw new Error('Error al cargar revisiones');

            const data = await response.json();
            window.revisions_${props.contentId} = data.revisions || [];

            renderRevisions_${props.contentId}();

            loading.style.display = 'none';
            content.style.display = 'block';
          } catch (error) {
            console.error('Error:', error);
            loading.innerHTML = '<p class="text-red-600">Error al cargar el historial de versiones</p>';
          }
        };

        // Cerrar modal de historial
        window.closeRevisionHistory_${props.contentId} = function() {
          document.getElementById('${modalId}').style.display = 'none';
          window.selectedRevisions_${props.contentId} = [];
        };

        // Renderizar revisiones
        window.renderRevisions_${props.contentId} = function() {
          const container = document.getElementById('${modalId}_revisions');
          const revisions = window.revisions_${props.contentId};

          if (revisions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay versiones anteriores</p>';
            return;
          }

          container.innerHTML = revisions.map((revision, index) => {
            const date = new Date(revision.createdAt);
            const formattedDate = date.toLocaleString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isCurrent = index === 0;

            return \`
              <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors \${isCurrent ? 'bg-blue-50 border-blue-300' : 'bg-white'}">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Versión #\${revision.revisionNumber}
                      </span>
                      \${isCurrent ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Actual</span>' : ''}
                    </div>

                    <h4 class="mt-2 text-sm font-medium text-gray-900">\${revision.title}</h4>

                    <div class="mt-2 text-sm text-gray-600">
                      <p><strong>Autor:</strong> \${revision.author.name || revision.author.email}</p>
                      <p><strong>Fecha:</strong> \${formattedDate}</p>
                      \${revision.changesSummary ? \`<p><strong>Cambios:</strong> \${revision.changesSummary}</p>\` : ''}
                    </div>
                  </div>

                  <div class="flex flex-col space-y-2 ml-4">
                    \${!isCurrent ? \`
                      <button
                        onclick="restoreRevision_${props.contentId}(\${revision.id})"
                        class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Restaurar
                      </button>
                      <button
                        onclick="viewRevision_${props.contentId}(\${revision.id})"
                        class="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50"
                      >
                        Ver
                      </button>
                      <label class="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          onchange="toggleRevisionSelection_${props.contentId}(\${revision.id}, this.checked)"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-xs text-gray-600">Comparar</span>
                      </label>
                    \` : ''}
                  </div>
                </div>
              </div>
            \`;
          }).join('');

          // Agregar botón de comparación si hay selecciones
          const selectedCount = window.selectedRevisions_${props.contentId}.length;
          if (selectedCount === 2) {
            const compareBtn = \`
              <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <button
                  onclick="compareSelectedRevisions_${props.contentId}()"
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Comparar versiones seleccionadas
                </button>
              </div>
            \`;
            container.innerHTML += compareBtn;
          }
        };

        // Toggle selección para comparar
        window.toggleRevisionSelection_${props.contentId} = function(revisionId, checked) {
          if (checked) {
            if (window.selectedRevisions_${props.contentId}.length < 2) {
              window.selectedRevisions_${props.contentId}.push(revisionId);
            } else {
              alert('Solo puedes comparar 2 versiones a la vez');
              return false;
            }
          } else {
            const index = window.selectedRevisions_${props.contentId}.indexOf(revisionId);
            if (index > -1) {
              window.selectedRevisions_${props.contentId}.splice(index, 1);
            }
          }
          renderRevisions_${props.contentId}();
        };

        // Ver una revisión específica
        window.viewRevision_${props.contentId} = async function(revisionId) {
          try {
            const response = await fetch(\`/api/content/${props.contentId}/revisions/\${revisionId}\`, {
              credentials: 'include'
            });

            if (!response.ok) throw new Error('Error al cargar revisión');

            const data = await response.json();
            const revision = data.revision;

            const modal = document.getElementById('${compareModalId}');
            const content = document.getElementById('${compareModalId}_content');

            const date = new Date(revision.createdAt);
            const formattedDate = date.toLocaleString('es-ES');

            content.innerHTML = \`
              <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">Versión #\${revision.revisionNumber}</h4>
                  <p class="text-sm text-gray-600"><strong>Fecha:</strong> \${formattedDate}</p>
                  <p class="text-sm text-gray-600"><strong>Autor:</strong> \${revision.author.name || revision.author.email}</p>
                  \${revision.changesSummary ? \`<p class="text-sm text-gray-600"><strong>Cambios:</strong> \${revision.changesSummary}</p>\` : ''}
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Título</label>
                  <p class="mt-1 text-sm text-gray-900">\${revision.title}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Slug</label>
                  <p class="mt-1 text-sm text-gray-900">\${revision.slug}</p>
                </div>

                \${revision.excerpt ? \`
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Extracto</label>
                    <p class="mt-1 text-sm text-gray-900">\${revision.excerpt}</p>
                  </div>
                \` : ''}

                <div>
                  <label class="block text-sm font-medium text-gray-700">Contenido</label>
                  <div class="mt-1 prose prose-sm max-w-none border border-gray-200 rounded p-4 bg-white max-h-96 overflow-y-auto">
                    \${revision.body || '<p class="text-gray-500">Sin contenido</p>'}
                  </div>
                </div>
              </div>
            \`;

            modal.style.display = 'block';
          } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar la revisión');
          }
        };

        // Comparar versiones seleccionadas
        window.compareSelectedRevisions_${props.contentId} = async function() {
          const selected = window.selectedRevisions_${props.contentId};
          if (selected.length !== 2) {
            alert('Debes seleccionar exactamente 2 versiones para comparar');
            return;
          }

          try {
            const response = await fetch(\`/api/content/revisions/compare?revision1=\${selected[0]}&revision2=\${selected[1]}\`, {
              credentials: 'include'
            });

            if (!response.ok) throw new Error('Error al comparar');

            const data = await response.json();
            const comparison = data.comparison;

            const modal = document.getElementById('${compareModalId}');
            const content = document.getElementById('${compareModalId}_content');

            const fields = [
              { key: 'title', label: 'Título' },
              { key: 'slug', label: 'Slug' },
              { key: 'excerpt', label: 'Extracto' },
              { key: 'body', label: 'Contenido' },
              { key: 'status', label: 'Estado' },
              { key: 'visibility', label: 'Visibilidad' }
            ];

            content.innerHTML = \`
              <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div class="bg-blue-50 p-3 rounded">
                    <strong>Versión #\${comparison.revision1.revisionNumber}</strong>
                    <p class="text-gray-600 text-xs mt-1">\${new Date(comparison.revision1.createdAt).toLocaleString('es-ES')}</p>
                  </div>
                  <div class="bg-blue-50 p-3 rounded">
                    <strong>Versión #\${comparison.revision2.revisionNumber}</strong>
                    <p class="text-gray-600 text-xs mt-1">\${new Date(comparison.revision2.createdAt).toLocaleString('es-ES')}</p>
                  </div>
                </div>

                \${fields.map(field => {
                  const isDifferent = comparison.differences[field.key];
                  const value1 = comparison.revision1[field.key] || '(vacío)';
                  const value2 = comparison.revision2[field.key] || '(vacío)';

                  return \`
                    <div class="border rounded-lg \${isDifferent ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}">
                      <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span class="font-medium text-gray-900">\${field.label}</span>
                        \${isDifferent ? '<span class="text-xs text-yellow-700 font-medium">⚠️ Diferente</span>' : '<span class="text-xs text-green-700">✓ Igual</span>'}
                      </div>
                      <div class="grid grid-cols-2 divide-x divide-gray-200">
                        <div class="p-4 \${field.key === 'body' ? 'prose prose-sm max-w-none max-h-48 overflow-y-auto' : ''}">
                          \${field.key === 'body' ? value1 : \`<p class="text-sm text-gray-900">\${value1}</p>\`}
                        </div>
                        <div class="p-4 \${field.key === 'body' ? 'prose prose-sm max-w-none max-h-48 overflow-y-auto' : ''}">
                          \${field.key === 'body' ? value2 : \`<p class="text-sm text-gray-900">\${value2}</p>\`}
                        </div>
                      </div>
                    </div>
                  \`;
                }).join('')}
              </div>
            \`;

            modal.style.display = 'block';
          } catch (error) {
            console.error('Error:', error);
            alert('Error al comparar versiones');
          }
        };

        // Cerrar modal de comparación
        window.closeCompareModal_${props.contentId} = function() {
          document.getElementById('${compareModalId}').style.display = 'none';
        };

        // Restaurar una revisión
        window.restoreRevision_${props.contentId} = async function(revisionId) {
          if (!confirm('¿Estás seguro de que deseas restaurar esta versión? Se creará una copia de seguridad de la versión actual.')) {
            return;
          }

          try {
            const response = await fetch(\`/api/content/${props.contentId}/revisions/\${revisionId}/restore\`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) throw new Error('Error al restaurar');

            alert('Versión restaurada exitosamente. La página se recargará.');
            window.location.reload();
          } catch (error) {
            console.error('Error:', error);
            alert('Error al restaurar la versión');
          }
        };

        // Cerrar modal al hacer clic fuera
        document.getElementById('${modalId}')?.addEventListener('click', function(e) {
          if (e.target === this) {
            closeRevisionHistory_${props.contentId}();
          }
        });

        document.getElementById('${compareModalId}')?.addEventListener('click', function(e) {
          if (e.target === this) {
            closeCompareModal_${props.contentId}();
          }
        });
      </script>
    `)}
  `;
};
