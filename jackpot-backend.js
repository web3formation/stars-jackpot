// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Telegram } = require('telegraf');
const chainlink = require('./services/chainlink'); // Сервис для работы с Chainlink VRF

// Настройка переменных окружения
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stars_jackpot';

// Телеграм бот для отправки уведомлений
const telegram = new Telegram(TELEGRAM_BOT_TOKEN);

// Подключение middleware
app.use(cors());
app.use(bodyParser.json());

// Подключение к MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB подключена'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Подключение маршрутов API
const authRoutes = require('./routes/auth');
const roundRoutes = require('./routes/rounds');
const userRoutes = require('./routes/users');
const tasksRoutes = require('./routes/tasks');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

// Middleware для проверки JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Использование маршрутов
app.use('/api/auth', authRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/tasks', authenticateJWT, tasksRoutes);
app.use('/api/payments', authenticateJWT, paymentRoutes);
app.use('/api/admin', authenticateJWT, adminRoutes);

// Базовый маршрут для проверки API
app.get('/', (req, res) => {
  res.json({ message: 'API для Stars Jackpot работает' });
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

// Экспорт для тестирования
module.exports = app;
