// Marketplace Plugin Management Functions

function filterPlugins() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const sortBy = document.getElementById('sortFilter').value;
  const verifiedOnly = document.getElementById('verifiedFilter').checked;

  let filteredPlugins = [...window.allPlugins];

  // Filter by search term
  if (searchTerm) {
    filteredPlugins = filteredPlugins.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.displayName.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Filter by category
  if (category) {
    filteredPlugins = filteredPlugins.filter(p => p.category === category);
  }

  // Filter by verified
  if (verifiedOnly) {
    filteredPlugins = filteredPlugins.filter(p => p.verified);
  }

  // Sort
  filteredPlugins.sort((a, b) => {
    switch(sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'price':
        return a.price - b.price;
      case 'downloads':
      default:
        return b.downloads - a.downloads;
    }
  });

  // Update display
  const grid = document.getElementById('pluginsGrid');
  const noResults = document.getElementById('noResults');

  if (filteredPlugins.length === 0) {
    grid.classList.add('hidden');
    noResults.classList.remove('hidden');
  } else {
    grid.classList.remove('hidden');
    noResults.classList.add('hidden');

    // Rebuild grid
    grid.innerHTML = filteredPlugins.map(plugin => renderPluginCardHTML(plugin)).join('');
  }
}

function formatDownloads(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function renderPluginCardHTML(plugin) {
  const isInstalled = window.installedNames.includes(plugin.name);
  const priceTag = plugin.price > 0
    ? '<span class="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">$' + plugin.price + '</span>'
    : '<span class="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Gratis</span>';

  const installedTag = '<span class="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Instalado</span>';

  const verifiedBadge = plugin.verified
    ? '<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" title="Plugin verificado"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
    : '';

  const downloadButton = !isInstalled
    ? '<button onclick="downloadPlugin(\'' + plugin.name + '\', ' + plugin.price + ')" class="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg">' + (plugin.price > 0 ? 'Comprar' : 'Descargar') + '</button>'
    : '<a href="/admincp/plugins/installed" class="flex-1 px-3 py-2 text-sm text-center bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Ver instalados</a>';

  return `
    <div class="plugin-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${plugin.displayName}</h3>
            ${verifiedBadge}
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">v${plugin.version} • ${plugin.author}</p>
          <span class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">${plugin.category}</span>
        </div>
        ${isInstalled ? installedTag : priceTag}
      </div>
      <div class="flex items-center gap-4 mb-3">
        <div class="flex items-center">
          <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          <span class="ml-1 text-sm text-gray-600 dark:text-gray-400">${plugin.rating.toFixed(1)}</span>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">${formatDownloads(plugin.downloads)} descargas</div>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">${plugin.description}</p>
      <div class="flex flex-wrap gap-1 mb-4">
        ${plugin.tags.slice(0, 3).map(tag => '<span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">' + tag + '</span>').join('')}
      </div>
      <div class="flex gap-2">
        <button onclick='showPluginDetails(${JSON.stringify(plugin)}, ${isInstalled})' class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Ver detalles</button>
        ${downloadButton}
      </div>
    </div>
  `;
}

function showPluginDetails(plugin, isInstalled) {
  document.getElementById('detailModalTitle').textContent = plugin.displayName;

  const content = `
    <div class="space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Por ${plugin.author} • v${plugin.version}</p>
          <div class="flex items-center gap-4 mt-2">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              <span class="ml-1 text-sm font-semibold">${plugin.rating.toFixed(1)}/5.0</span>
            </div>
            <span class="text-sm text-gray-600 dark:text-gray-400">${formatDownloads(plugin.downloads)} descargas</span>
            <span class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">${plugin.category}</span>
            ${plugin.verified ? '<span class="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✓ Verificado</span>' : ''}
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-purple-600">${plugin.price > 0 ? '$' + plugin.price : 'Gratis'}</div>
          <p class="text-xs text-gray-500 dark:text-gray-400">${plugin.license}</p>
        </div>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Descripción</h4>
        <p class="text-gray-600 dark:text-gray-400">${plugin.description}</p>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Características</h4>
        <ul class="space-y-2">
          ${plugin.features.map(f => '<li class="flex items-start"><svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg><span class="text-gray-700 dark:text-gray-300">' + f + '</span></li>').join('')}
        </ul>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Permisos requeridos</h4>
        <div class="flex flex-wrap gap-2">
          ${plugin.permissions.map(p => '<span class="px-3 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">' + p + '</span>').join('')}
        </div>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Compatibilidad</h4>
        <p class="text-sm text-gray-600 dark:text-gray-400">LexCMS ${plugin.compatibility.lexcms}</p>
      </div>

      <div>
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Etiquetas</h4>
        <div class="flex flex-wrap gap-2">
          ${plugin.tags.map(tag => '<span class="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">' + tag + '</span>').join('')}
        </div>
      </div>

      <div class="flex gap-4">
        <a href="${plugin.homepage}" target="_blank" class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400">
          Sitio web →
        </a>
      </div>

      <div class="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button onclick="closeDetailModal()" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cerrar</button>
        ${!isInstalled
          ? '<button onclick="downloadPlugin(\'' + plugin.name + '\', ' + plugin.price + ')" class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">' + (plugin.price > 0 ? 'Comprar por $' + plugin.price : 'Descargar gratis') + '</button>'
          : '<span class="flex-1 px-4 py-2 text-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">Ya instalado</span>'
        }
      </div>
    </div>
  `;

  document.getElementById('detailModalContent').innerHTML = content;
  document.getElementById('detailModal').classList.remove('hidden');
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.add('hidden');
}

function downloadPlugin(pluginName, price) {
  // Validation
  if (!pluginName || pluginName.trim() === '') {
    alert('Error: Nombre de plugin inválido');
    return;
  }

  // Check if already installed
  if (window.installedNames.includes(pluginName)) {
    alert('Este plugin ya está instalado');
    return;
  }

  // Simulate payment for paid plugins
  if (price > 0) {
    const confirmPurchase = confirm('Este plugin cuesta $' + price + '. \\n\\nNOTA: Este es un marketplace de demostración. En producción, aquí se procesaría el pago real.\\n\\n¿Continuar con la descarga simulada?');
    if (!confirmPurchase) return;
  }

  const action = confirm('¿Descargar e instalar el plugin "' + pluginName + '"?');
  if (!action) return;

  // Simulate download
  alert('NOTA: Este es un marketplace de demostración.\\n\\nEn un entorno de producción, el plugin "' + pluginName + '" se descargaría desde un repositorio remoto y se instalaría automáticamente.\\n\\nPara probar la funcionalidad de plugins:\\n1. Copia manualmente el plugin al directorio /plugins/\\n2. Instálalo desde la pestaña "Disponibles"');

  closeDetailModal();
}
