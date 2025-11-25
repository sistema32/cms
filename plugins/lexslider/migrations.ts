/**
 * LexSlider Migrations (Database-Agnostic)
 * 
 * Uses Drizzle ORM schema for automatic table creation.
 * Custom migrations only needed for data transformations or complex changes.
 */

import { schema } from './schema.ts';
import { sql } from 'drizzle-orm';

export const migrations = [
    {
        version: 1,
        name: 'initial_schema',
        up: async (db: any) => {
            // Schema is automatically applied by Drizzle
            // This migration is just for tracking purposes
            console.log('Schema tables will be created automatically');
        },
        down: async (db: any) => {
            // Drop tables in reverse order (due to foreign keys)
            await db.execute(sql`DROP TABLE IF EXISTS lexslider_slides`);
            await db.execute(sql`DROP TABLE IF EXISTS lexslider_sliders`);
        }
    },

    // Example of a data migration (version 2)
    // {
    //     version: 2,
    //     name: 'migrate_old_config_format',
    //     up: async (db: any) => {
    //         // Transform data from old format to new
    //         const sliders = await db.execute(sql`SELECT * FROM lexslider_sliders`);
    //         for (const slider of sliders.rows) {
    //             const oldConfig = JSON.parse(slider.config);
    //             const newConfig = {
    //                 ...oldConfig,
    //                 version: 2
    //             };
    //             await db.execute(sql`
    //                 UPDATE lexslider_sliders 
    //                 SET config = ${JSON.stringify(newConfig)}
    //                 WHERE id = ${slider.id}
    //             `);
    //         }
    //     },
    //     down: async (db: any) => {
    //         // Revert to old format
    //     }
    // }
];

export { schema };
