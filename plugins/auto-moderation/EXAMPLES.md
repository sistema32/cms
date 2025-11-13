# Ejemplos de Uso del Plugin Auto-Moderation

## Ejemplo 1: Configuración Básica (Solo Local)

```typescript
// src/main.ts
import { setupAutoModeration } from "../plugins/auto-moderation/init.ts";

// Inicializar con configuración por defecto
const plugin = setupAutoModeration();

// El plugin ahora detectará spam automáticamente en todos los comentarios nuevos
```

## Ejemplo 2: Configuración con Akismet

```bash
# .env
AKISMET_API_KEY=1234567890ab
AKISMET_SITE_URL=https://mi-blog.com
AUTO_MODERATION_STRATEGY=hybrid
```

```typescript
// El plugin se inicializa automáticamente con estas variables de entorno
// No requiere código adicional
```

## Ejemplo 3: Auto-aprobación de Comentarios Seguros

```bash
# .env
AUTO_MODERATION_AUTO_APPROVE=true
AUTO_MODERATION_APPROVE_THRESHOLD=15
```

Esto auto-aprobará comentarios con score de spam menor a 15 (muy seguros).

## Ejemplo 4: Auto-marcado de Spam Obvio

```bash
# .env
AUTO_MODERATION_AUTO_SPAM=true
AUTO_MODERATION_SPAM_MARK_THRESHOLD=90
```

Esto marcará automáticamente como spam comentarios con score mayor a 90.

## Ejemplo 5: Configuración Personalizada Programática

```typescript
import { initAutoModeration } from './plugins/auto-moderation/init.ts';

const plugin = initAutoModeration({
  enabled: true,
  strategy: 'hybrid',

  localDetector: {
    threshold: 65,  // Más agresivo que el default (70)
    whitelist: {
      emails: [
        'admin@mi-sitio.com',
        'editor@mi-sitio.com',
      ],
      domains: [
        'mi-sitio.com',
        'empresas-confiables.com',
      ],
    },
    blacklist: {
      emails: [
        'spammer@bad.com',
      ],
      domains: [
        'spam-domain.tk',
        'casino-spam.ml',
      ],
    },
  },

  actions: {
    autoApprove: true,
    autoApproveThreshold: 20,
    autoMarkSpam: true,
    autoMarkSpamThreshold: 85,
    sendToModeration: true,
  },

  hybrid: {
    useHighestConfidence: false,
    localWeight: 0.3,  // 30% peso local
    serviceWeight: 0.7,  // 70% peso Akismet (confiamos más en Akismet)
  },

  learning: {
    enabled: true,
    sendFeedback: true,
    updateBlacklist: true,
    updateWhitelist: false,  // No auto-añadir a whitelist
  },

  logging: {
    enabled: true,
    level: 'all',
    saveDetectionLogs: true,
  },
});
```

## Ejemplo 6: Verificar un Comentario Manualmente

```typescript
import { getAutoModeration } from './plugins/auto-moderation/index.ts';

const plugin = getAutoModeration();

if (plugin) {
  const decision = await plugin.checkComment({
    authorName: "John Doe",
    authorEmail: "john@example.com",
    body: "Este es un comentario de prueba",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 ...",
  });

  console.log(`Acción recomendada: ${decision.action}`);
  console.log(`Score de spam: ${decision.analysis.score}/100`);
  console.log(`Confianza: ${decision.analysis.confidence}%`);
  console.log(`Razones:`, decision.analysis.reasons);
  console.log(`Método: ${decision.analysis.detectionMethod}`);

  if (decision.action === 'spam') {
    console.log('⚠️ Este comentario es spam');
  } else if (decision.action === 'approve') {
    console.log('✅ Este comentario es seguro');
  } else {
    console.log('⏳ Este comentario requiere revisión manual');
  }
}
```

## Ejemplo 7: Reportar Falsos Positivos/Negativos

```typescript
import { getAutoModeration } from './plugins/auto-moderation/index.ts';

const plugin = getAutoModeration();

// Reportar falso positivo (comentario legítimo marcado como spam)
await plugin?.reportFalsePositive({
  authorName: "Usuario Real",
  authorEmail: "real@example.com",
  body: "Comentario legítimo que fue marcado incorrectamente",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 ...",
});

// Reportar falso negativo (spam no detectado)
await plugin?.reportFalseNegative({
  authorName: "Spammer",
  authorEmail: "spam@bad.com",
  body: "CLICK HERE TO BUY VIAGRA NOW!!!",
  ipAddress: "1.2.3.4",
  userAgent: "Bot/1.0",
});
```

## Ejemplo 8: Obtener Estadísticas

```typescript
import { getAutoModeration } from './plugins/auto-moderation/index.ts';

const plugin = getAutoModeration();
const stats = plugin?.getStats();

if (stats) {
  console.log('📊 Estadísticas del Plugin');
  console.log('─'.repeat(40));
  console.log(`Total analizados: ${stats.totalChecked}`);
  console.log(`Spam detectado: ${stats.spamDetected}`);
  console.log(`Comentarios legítimos: ${stats.hamDetected}`);
  console.log(`Falsos positivos: ${stats.falsePositives}`);
  console.log(`Falsos negativos: ${stats.falseNegatives}`);

  const accuracy = stats.totalChecked > 0
    ? ((stats.totalChecked - stats.falsePositives - stats.falseNegatives) / stats.totalChecked * 100).toFixed(2)
    : 100;
  console.log(`Precisión: ${accuracy}%`);
}
```

## Ejemplo 9: Verificar API Key de Akismet

```typescript
import { getAutoModeration } from './plugins/auto-moderation/index.ts';

const plugin = getAutoModeration();

if (plugin) {
  const isValid = await plugin.verifyAkismetKey();

  if (isValid) {
    console.log('✅ API key de Akismet verificada correctamente');
  } else {
    console.log('❌ API key de Akismet inválida o servicio no disponible');
  }
}
```

## Ejemplo 10: Resetear Estadísticas

```typescript
import { getAutoModeration } from './plugins/auto-moderation/index.ts';

const plugin = getAutoModeration();

// Resetear estadísticas (útil para testing o después de ajustes)
plugin?.resetStats();

console.log('📊 Estadísticas reseteadas');
```

## Ejemplo 11: Actualizar Configuración en Runtime

```typescript
import { getAutoModeration } from './plugins/auto-moderation/index.ts';

const plugin = getAutoModeration();

// Actualizar configuración sin reiniciar el servidor
plugin?.updateConfig({
  enabled: true,
  strategy: 'service-only',  // Cambiar a solo Akismet
  actions: {
    autoApprove: false,  // Desactivar auto-aprobación
    autoMarkSpam: true,
    autoMarkSpamThreshold: 95,  // Más conservador
  },
});

console.log('⚙️ Configuración actualizada');
```

## Ejemplo 12: Configuración para Blog Personal (Bajo Volumen)

```bash
# .env - Ideal para blogs pequeños sin mucho spam
AUTO_MODERATION_ENABLED=true
AUTO_MODERATION_STRATEGY=local-only
AUTO_MODERATION_SPAM_THRESHOLD=75
AUTO_MODERATION_AUTO_APPROVE=true
AUTO_MODERATION_APPROVE_THRESHOLD=25
```

## Ejemplo 13: Configuración para Sitio de Alto Tráfico

```bash
# .env - Ideal para sitios con mucho spam
AKISMET_API_KEY=tu-api-key
AKISMET_SITE_URL=https://tu-sitio.com
AUTO_MODERATION_ENABLED=true
AUTO_MODERATION_STRATEGY=hybrid
AUTO_MODERATION_SPAM_THRESHOLD=70
AUTO_MODERATION_AUTO_APPROVE=true
AUTO_MODERATION_APPROVE_THRESHOLD=15
AUTO_MODERATION_AUTO_SPAM=true
AUTO_MODERATION_SPAM_MARK_THRESHOLD=90
```

## Ejemplo 14: Configuración Ultra-Conservadora (Sin Auto-acciones)

```bash
# .env - Envía todo a moderación manual
AUTO_MODERATION_ENABLED=true
AUTO_MODERATION_STRATEGY=hybrid
AUTO_MODERATION_SPAM_THRESHOLD=70
AUTO_MODERATION_AUTO_APPROVE=false
AUTO_MODERATION_AUTO_SPAM=false
```

Esta configuración solo marca comentarios pero los envía todos a moderación manual.

## Ejemplo 15: Testing y Debugging

```typescript
import { LocalSpamDetector } from './plugins/auto-moderation/detector.ts';

// Crear detector local para testing
const detector = new LocalSpamDetector({
  threshold: 70,
  whitelist: { emails: [], domains: [] },
  blacklist: { emails: [], domains: [] },
});

// Probar detección
const testComments = [
  {
    authorEmail: 'test@example.com',
    body: 'Comentario normal',
  },
  {
    authorEmail: 'spam@spam.com',
    body: 'BUY VIAGRA NOW CLICK HERE!!!',
  },
  {
    authorEmail: 'user@tempmail.com',
    body: 'Win money fast work from home',
  },
];

for (const comment of testComments) {
  const result = await detector.analyze({
    authorEmail: comment.authorEmail,
    body: comment.body,
  });

  console.log(`\nComentario: "${comment.body}"`);
  console.log(`Spam: ${result.isSpam ? '⚠️ SÍ' : '✅ NO'}`);
  console.log(`Score: ${result.score}/100`);
  console.log(`Confianza: ${result.confidence}%`);
  console.log(`Razones:`, result.reasons);
}
```

## Ejemplo 16: Integración con Webhook

```typescript
// Ejemplo de cómo podrías usar el plugin en un webhook personalizado
import { getAutoModeration } from './plugins/auto-moderation/index.ts';

export async function handleWebhookComment(data: any) {
  const plugin = getAutoModeration();

  if (!plugin) {
    console.warn('Auto-moderation plugin not available');
    return { approved: true };  // Aprobar por defecto si no hay plugin
  }

  const decision = await plugin.checkComment({
    authorName: data.name,
    authorEmail: data.email,
    authorWebsite: data.website,
    body: data.body,
    ipAddress: data.ip,
    userAgent: data.userAgent,
  });

  return {
    approved: decision.action === 'approve',
    spam: decision.action === 'spam',
    needsModeration: decision.action === 'moderate',
    score: decision.analysis.score,
    reasons: decision.analysis.reasons,
  };
}
```

## Recursos Adicionales

- 📖 [README.md](./README.md) - Documentación completa
- 🔧 [config.ts](./config.ts) - Configuración por defecto
- 🛡️ [detector.ts](./detector.ts) - Implementación del detector local
- ☁️ [services/akismet.ts](./services/akismet.ts) - Cliente de Akismet
- 🎛️ Panel de Admin: `/admin/auto-moderation`
