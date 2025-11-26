import { db } from './src/db/index.ts';

const sql = await Deno.readTextFile('plugins/lexslider/migrations/001_initial_schema.sql');
const statements = sql.split(';').filter(s => s.trim());

console.log('🔧 Applying LexSlider migration...');
for (const stmt of statements) {
    if (stmt.trim()) {
        try {
            await db.run(stmt);
            const preview = stmt.trim().split('\n')[0].substring(0, 60);
            console.log('✅', preview + '...');
        } catch (e: any) {
            console.error('❌', e.message);
        }
    }
}
console.log('✨ Migration complete!');
Deno.exit(0);
