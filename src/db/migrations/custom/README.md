
## Cómo crear una Custom Migration

1. Crea un archivo TypeScript en este directorio con el formato `TIMESTAMP_nombre_descriptivo.ts`.
   Ejemplo: `0026_normalize_emails.ts`

2. Exporta un objeto `migration` que implemente la interfaz `CustomMigration`:

```typescript
import { sql } from 'drizzle-orm';
import type { CustomMigration } from '../types.ts';

export const migration: CustomMigration = {
  id: '0026_normalize_emails', // Debe coincidir con el nombre del archivo (sin extensión)
  name: 'Normalize user emails to lowercase',
  
  async up(db, dbType) {
    console.log(`Running on ${dbType}`);
    
    if (dbType === 'sqlite') {
      await db.run(sql`UPDATE users SET email = LOWER(email)`);
    } else {
      await db.execute(sql`UPDATE users SET email = LOWER(email)`);
    }
  }
};
```

3. Ejecuta `deno task db:migrate`. El sistema detectará la nueva migración y la ejecutará después de las migraciones de schema de Drizzle.

## Reglas Importantes

1. **Idempotencia**: Asegúrate de que tu migración pueda correrse sin romper nada si ya se aplicó parcialmente (aunque el sistema intenta evitar esto con transacciones).
2. **Transacciones**: Las migraciones se ejecutan dentro de una transacción. Si falla, se hace rollback automático.
3. **No borrar archivos**: Una vez aplicada en producción, no borres el archivo de migración. Sirve de historial.
