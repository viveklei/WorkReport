import bcrypt from 'bcryptjs';
import { db } from './server/db.js';

const seedAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.run(
            `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
            ['admin@lei.com', hashedPassword, 'System Admin', 'admin'],
            (err) => {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        console.log('Admin already exists.');
                    } else {
                        console.error('Error seeding admin:', err.message);
                    }
                } else {
                    console.log('Admin seeded successfully:');
                    console.log('ID: admin@lei.com');
                    console.log('Pass: admin123');
                }
                process.exit(0);
            }
        );
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedAdmin();
