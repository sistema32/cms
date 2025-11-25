# Comparativa: Acceso a Base de Datos en CMS Populares

Analizamos cómo Ghost, WordPress y Drupal resuelven el problema de seguridad y abstracción en el acceso a datos por parte de plugins/módulos.

## 1. WordPress
**Enfoque:** Global Database Object (`$wpdb`)
*   **Mecanismo:** WordPress expone un objeto global `$wpdb` que permite ejecutar cualquier consulta SQL.
*   **Seguridad:** Depende totalmente del desarrollador. Ofrece el método `$wpdb->prepare()` para escapar variables y prevenir inyecciones SQL.
*   **Aislamiento:** **Nulo**. Cualquier plugin puede leer, escribir o borrar cualquier tabla de la base de datos (incluso las de otros plugins o del núcleo).
*   **Tokens:** No utiliza tokens. La seguridad es "confianza total" una vez el plugin está activo.

```php
global $wpdb;
// Inseguro si no se usa prepare()
$wpdb->query("DELETE FROM wp_users"); // Un plugin puede borrar usuarios
```

## 2. Drupal
**Enfoque:** Database Abstraction Layer (DBAL) & Schema API
*   **Mecanismo:** Utiliza un sistema de inyección de dependencias. Los módulos solicitan el servicio de base de datos. Define tablas mediante una `Schema API` (arrays PHP) en lugar de SQL directo.
*   **Seguridad:** Alta. El uso de la capa de abstracción fuerza el uso de parámetros vinculados (prepared statements).
*   **Aislamiento:** Medio. Aunque es más estructurado, un módulo aún puede acceder a tablas de otros módulos si conoce sus nombres.
*   **Tokens:** No usa tokens de acceso por consulta.

```php
// Drupal 9/10
$database = \Drupal::database();
$query = $database->select('users_field_data', 'u');
$query->fields('u', ['uid', 'name']);
```

## 3. Ghost
**Enfoque:** ORM (Bookshelf.js / Knex.js) & API-First
*   **Mecanismo:** Ghost es una aplicación Node.js que usa un ORM (Bookshelf.js). Sin embargo, su arquitectura moderna (Ghost 5.0+) empuja a las integraciones a usar la **Admin API** (HTTP/JSON) en lugar de acceso directo a la BD.
*   **Seguridad:** Muy Alta. Las integraciones externas usan **API Keys** (Tokens JWT) con permisos granulares (Read-Only, Write, etc.).
*   **Aislamiento:** Alto. El acceso directo a la BD está reservado para el núcleo. Las "Apps" (plugins) suelen interactuar vía API.
*   **Tokens:** **Sí**, para integraciones externas (Content API / Admin API).

## Conclusión y Oportunidad para LexCMS

Ninguno de los CMS tradicionales utiliza un sistema de "Tokens de Base de Datos Internos" para plugins que corren en el mismo servidor. Operan bajo un modelo de confianza implícita o abstracción de código.

**La propuesta para LexCMS es innovadora porque:**
1.  Adopta el modelo de **Capabilities** (similar a Deno o Android): "Este plugin solo tiene permiso para escribir en `lexslider_*`".
2.  Utiliza un objeto `api.db` (como Drupal/Ghost) pero le inyecta permisos restringidos (Scoped) en tiempo de ejecución.
3.  Permitiría un nivel de seguridad superior a WordPress, donde un plugin vulnerable no compromete toda la base de datos.
