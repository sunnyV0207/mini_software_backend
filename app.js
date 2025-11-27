import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
    origin: ['https://mini-software-frontend.vercel.app','http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


import userRoutes from './src/routes/user.route.js';
app.use('/api/user', userRoutes);

import authRoutes from './src/routes/auth.route.js';
app.use('/api/auth', authRoutes);

import schoolRoutes from './src/routes/school.route.js';
app.use('/api/school', schoolRoutes);

import principalRoutes from './src/routes/principal.route.js';
app.use('/api/principal', principalRoutes);


app.use((err, req, res, next) => {
  console.error("Error middleware caught:", err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});



export default app;