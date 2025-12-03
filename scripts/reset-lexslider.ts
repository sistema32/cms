import Database from 'https://deno.land/x/sqlite@v3.8/mod.ts';

const db = new Database('./data/db.sqlite');

// Update status to inactive
db.execute("UPDATE plugins SET status = 'inactive' WHERE name = 'lexslider'");

// Clear permission grants
db.execute(`DELETE FROM plugin_permission_grants 
            WHERE plugin_id = (SELECT id FROM plugins WHERE name = 'lexslider')`);

// Show final state
const result = db.query('SELECT name, status FROM plugins WHERE name = ?', ['lexslider']);
console.log('✅ Plugin actualizado:', result);

const grants = db.query(`SELECT COUNT(*) as count FROM plugin_permission_grants 
                         WHERE plugin_id = (SELECT id FROM plugins WHERE name = 'lexslider')`);
console.log('✅ Permisos restantes:', grants[0][0]);

db.close();
