import dotenv from 'dotenv';
dotenv.config({
    path: './.env',
    origin: true
});
import app from './app.js';
import connect_db from './src/db/index.db.js';

connect_db()
    .then(() => {
        console.log('Database connected successfully');
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database connection failed:', error);
    });