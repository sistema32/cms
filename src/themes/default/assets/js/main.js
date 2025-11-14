/**
 * LexCMS Default Theme - Main JavaScript
 */

// Smooth scrolling para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Cargar comentarios dinámicamente si existe el contenedor
const commentsContainer = document.getElementById("comments-container");
if (commentsContainer) {
  // TODO: Implementar carga de comentarios via API
  // Usar textContent en lugar de innerHTML para prevenir XSS
  const message = document.createElement("p");
  message.textContent = "Sistema de comentarios próximamente...";
  commentsContainer.appendChild(message);
}

console.log("LexCMS Theme loaded");
