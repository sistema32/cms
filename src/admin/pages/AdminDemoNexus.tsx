import { html, raw } from "hono/html";
import AdminLayoutFocus from "../components/AdminLayoutFocus.tsx";

export default function AdminDemoNexus(props: { user: any }) {
    const { user } = props;
    return AdminLayoutFocus({
        title: "Focus Mode Demo",
        activePage: "dashboard",
        user,
        children: html`
      <div>
        <div class="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
                <h1 class="dashboard-title">Resumen General</h1>
                <p class="text-gray-500 text-lg">Bienvenido al modo de enfoque total.</p>
            </div>
            
            <div class="flex gap-3">
                <button class="btn btn-outline gap-2" onclick="showToast('Exportando datos...', 'info')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Exportar
                </button>
                <button class="btn btn-primary gap-2" onclick="showToast('Generando nuevo reporte...', 'success')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nuevo Reporte
                </button>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="stat bg-white border border-gray-100 p-6">
                <div class="stat-figure text-secondary">
                    <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                </div>
                <div class="stat-title text-gray-500 font-medium">Usuarios Totales</div>
                <div class="text-3xl font-bold mt-2 text-black">89,400</div>
                <div class="stat-desc mt-2 text-green-600 flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    +14% este mes
                </div>
            </div>
            
            <div class="stat bg-white border border-gray-100 p-6 transition hover:shadow-lg">
                <div class="stat-figure text-secondary">
                    <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-black">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                </div>
                <div class="stat-title text-gray-500 font-medium">Sesiones Activas</div>
                <div class="text-3xl font-bold mt-2 text-black">1,209</div>
                <div class="stat-desc mt-2 text-gray-400">En los últimos 30 min</div>
            </div>

            <div class="stat bg-white border border-gray-100 p-6 transition hover:shadow-lg">
                <div class="stat-figure text-secondary">
                     <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-black">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    </div>
                </div>
                <div class="stat-title text-gray-500 font-medium">Conversión</div>
                <div class="text-3xl font-bold mt-2 text-black">4.85%</div>
                <div class="stat-desc mt-2 text-red-500 flex items-center gap-1 font-medium">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                    -2% vs semana pasada
                </div>
            </div>

            <div class="stat bg-white border border-gray-100 p-6">
                <div class="stat-figure text-secondary">
                     <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                </div>
                <div class="stat-title text-gray-500 font-medium">Tiempo Promedio</div>
                <div class="text-3xl font-bold mt-2 text-black">4m 32s</div>
                <div class="stat-desc mt-2 text-green-600 flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    +30s mejorado
                </div>
            </div>
        </div>

        <!-- Main Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Charts & Data -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Main Chart -->
                <div class="content-card p-6">
                     <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-bold">Rendimiento de Ventas</h3>
                        <select class="select select-bordered select-sm w-full max-w-xs focus:ring-2 focus:ring-black">
                            <option>Últimos 7 días</option>
                            <option>Este mes</option>
                            <option>Este año</option>
                        </select>
                    </div>
                    <div style="height: 350px;">
                        <canvas id="salesChart"></canvas>
                    </div>
                </div>

                <!-- Secondary Charts Grid -->
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="content-card p-6">
                        <h3 class="text-lg font-bold mb-4">Dispositivos</h3>
                        <div style="height: 200px; position: relative;">
                            <canvas id="deviceChart"></canvas>
                             <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span class="text-2xl font-bold">Total</span>
                            </div>
                        </div>
                    </div>
                     <div class="content-card p-6">
                        <h3 class="text-lg font-bold mb-4">Fuentes de Tráfico</h3>
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium">Directo</span>
                                    <span class="font-bold">45%</span>
                                </div>
                                <progress class="progress progress-primary w-full" value="45" max="100"></progress>
                            </div>
                             <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium">Búsqueda Orgánica</span>
                                    <span class="font-bold">32%</span>
                                </div>
                                <progress class="progress progress-accent w-full" value="32" max="100"></progress>
                            </div>
                             <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium">Referidos</span>
                                    <span class="font-bold">18%</span>
                                </div>
                                <progress class="progress progress-warning w-full" value="18" max="100"></progress>
                            </div>
                             <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="font-medium">Redes Sociales</span>
                                    <span class="font-bold">5%</span>
                                </div>
                                <progress class="progress w-full" value="5" max="100"></progress>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transactions Table -->
                <div class="content-card p-0 overflow-hidden">
                    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 class="text-lg font-bold">Últimas Transacciones</h3>
                        <button class="btn btn-sm btn-ghost">Ver Todo</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="table w-full">
                            <thead>
                                <tr class="bg-gray-50 border-b border-gray-100">
                                    <th class="font-semibold text-gray-500">ID</th>
                                    <th class="font-semibold text-gray-500">Cliente</th>
                                    <th class="font-semibold text-gray-500">Servicio</th>
                                    <th class="font-semibold text-gray-500">Estado</th>
                                    <th class="font-semibold text-gray-500 text-right">Monto</th>
                                    <th class="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="hover">
                                    <td class="font-mono text-gray-400">#TR-8892</td>
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <div class="avatar placeholder">
                                                <div class="bg-neutral-focus text-neutral-content rounded-full w-8">
                                                    <span>JD</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="font-bold">Janis Davis</div>
                                                <div class="text-xs opacity-50">United States</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Suscripción Premium</td>
                                    <td><span class="badge badge-success gap-2">Completado</span></td>
                                    <td class="text-right font-medium">$99.00</td>
                                    <td>
                                        <button class="btn btn-ghost btn-xs">
                                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                                        </button>
                                    </td>
                                </tr>
                                <tr class="hover">
                                    <td class="font-mono text-gray-400">#TR-8891</td>
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <div class="avatar placeholder">
                                                <div class="bg-primary text-primary-content rounded-full w-8">
                                                    <span>AL</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="font-bold">Alex Lee</div>
                                                <div class="text-xs opacity-50">Canada</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Renovación Dominio</td>
                                    <td><span class="badge badge-warning gap-2">Pendiente</span></td>
                                    <td class="text-right font-medium">$12.50</td>
                                    <td>
                                        <button class="btn btn-ghost btn-xs">
                                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                                        </button>
                                    </td>
                                </tr>
                                <tr class="hover">
                                    <td class="font-mono text-gray-400">#TR-8890</td>
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <div class="avatar placeholder">
                                                <div class="bg-secondary text-secondary-content rounded-full w-8">
                                                    <span>MJ</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="font-bold">Mary Johnson</div>
                                                <div class="text-xs opacity-50">UK</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Soporte Técnico</td>
                                    <td><span class="badge badge-success gap-2">Completado</span></td>
                                    <td class="text-right font-medium">$45.00</td>
                                    <td>
                                        <button class="btn btn-ghost btn-xs">
                                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right Column: Form & Activity -->
            <div class="lg:col-span-1 space-y-8">
                <!-- Activity Timeline -->
                 <div class="content-card p-6">
                    <h3 class="text-lg font-bold mb-4">Actividad Reciente</h3>
                    <div class="timeline-widget">
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <p class="text-sm font-semibold">Nuevo usuario registrado</p>
                            <p class="text-xs text-gray-400 mt-1">Hace 2 minutos • Johnny Doe</p>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <p class="text-sm font-semibold">Backup automático completado</p>
                            <p class="text-xs text-gray-400 mt-1">Hace 15 minutos • Sistema</p>
                        </div>
                         <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <p class="text-sm font-semibold">Alerta de seguridad resuelta</p>
                            <p class="text-xs text-gray-400 mt-1">Hace 2 horas • Admin</p>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <p class="text-sm font-semibold">Despliegue de actualización v2.1</p>
                            <p class="text-xs text-gray-400 mt-1">Ayer • DevOps</p>
                        </div>
                    </div>
                    <button class="btn btn-xs btn-outline w-full mt-2">Ver Historial Completo</button>
                </div>

                <div class="content-card p-6">
                    <h3 class="text-lg font-bold mb-6">Configuración Rápida</h3>
                    <form onsubmit="event.preventDefault(); showToast('Configuración guardada', 'success');">
                        <div class="form-control w-full mb-4">
                            <label class="label">
                                <span class="label-text font-medium text-gray-700">Nombre del Sitio</span>
                            </label>
                            <input type="text" placeholder="Mi Super Sitio" class="input input-bordered w-full" value="LexCMS Focus Demo" />
                        </div>

                        <div class="form-control w-full mb-4">
                            <label class="label">
                                <span class="label-text font-medium text-gray-700">Email de Contacto</span>
                            </label>
                            <input type="email" placeholder="admin@example.com" class="input input-bordered w-full" />
                        </div>

                         <div class="form-control w-full mb-4">
                            <label class="label">
                                <span class="label-text font-medium text-gray-700">Modo de Mantenimiento</span>
                            </label>
                            <select class="select select-bordered text-base">
                                <option>Desactivado</option>
                                <option>Activado</option>
                                <option>Programado</option>
                            </select>
                        </div>

                        <div class="form-control mb-6">
                            <label class="label cursor-pointer justify-start gap-4">
                                <input type="checkbox" checked="checked" class="toggle toggle-primary" />
                                <span class="label-text text-gray-700">Notificaciones por Email</span>
                            </label>
                        </div>
                        
                        <div class="form-control mb-6">
                             <label class="label">
                                <span class="label-text font-medium text-gray-700">Rango de Volumen</span>
                            </label>
                            <input type="range" min="0" max="100" value="40" class="range range-xs range-primary" /> 
                        </div>

                        <button class="btn btn-primary w-full shadow-lg shadow-black/10">Guardar Cambios</button>
                    </form>
                </div>

                <div class="content-card card-dark p-6 border-0">
                    <h3 class="text-lg font-bold mb-2 text-white">Nexus Pro</h3>
                    <p class="text-white opacity-70 text-sm mb-4">Desbloquea todas las funcionalidades avanzadas para tu equipo.</p>
                    <div class="w-full bg-white/10 rounded-full h-2 mb-4">
                        <div class="bg-blue-500 h-2 rounded-full" style="width: 70%"></div>
                    </div>
                    <button class="btn btn-sm btn-block text-black bg-white hover:bg-gray-200 border-0">Actualizar Plan</button>
                </div>
            </div>
            </div>
        </div>
      </div>
      
      ${raw(`
      <script>
        // Simple Chart.js Demo
        document.addEventListener('DOMContentLoaded', function() {
            // MAIN SALES CHART
            const ctx = document.getElementById('salesChart').getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(26, 26, 26, 0.1)'); 
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
                    datasets: [{
                        label: 'Ventas',
                        data: [1200, 1900, 3000, 2500, 2000, 3500, 4200],
                        borderColor: '#1a1a1a',
                        backgroundColor: gradient,
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#1a1a1a',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 10,
                            displayColors: false,
                            cornerRadius: 4
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { display: true, color: '#f3f4f6', drawBorder: false },
                            ticks: { color: '#9ca3af' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#9ca3af' }
                        }
                    }
                }
            });

            // DEVICE DOUGHNUT CHART
             const ctxDevice = document.getElementById('deviceChart').getContext('2d');
             new Chart(ctxDevice, {
                type: 'doughnut',
                data: {
                    labels: ['Móvil', 'Desktop', 'Tablet'],
                    datasets: [{
                        data: [55, 30, 15],
                        backgroundColor: ['#1a1a1a', '#9ca3af', '#e5e7eb'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12 }
                            }
                        }
                    }
                }
            });
        });

        // Global Toast Helper
        window.showToast = function(msg, type) {
            // Check if existing toast container exists (from layout)
            // If not, we rely on console for now or basic alert fallback 
            // but AdminLayoutNexus includes toast container usually.
            
            // Creating a simple toast for demo purposes if not present
            let container = document.getElementById('toast-container');
            if(!container) return alert(msg);
            
            const toast = document.createElement('div');
            toast.className = 'toast ' + (type === 'success' ? 'success' : 'info');
            toast.innerHTML = (type === 'success' ? '✅ ' : 'ℹ️ ') + msg;
            container.appendChild(toast);
            
            setTimeout(() => toast.classList.add('visible'), 10);
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
      </script>
      `)}
    `
    });
}
