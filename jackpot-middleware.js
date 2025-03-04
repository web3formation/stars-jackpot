// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware для проверки JWT токена
 * 
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 * @param {Function} next - Функция для продолжения цепочки middleware
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Недействительный или истекший токен',
          error: err.message
        });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Требуется авторизация'
    });
  }
};

module.exports = authenticateJWT;

// middleware/errorHandler.js
/**
 * Middleware для обработки ошибок
 * 
 * @param {Error} err - Объект ошибки
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 * @param {Function} next - Функция для продолжения цепочки middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`Ошибка: ${err.message}`, err.stack);
  
  // Ошибки MongoDB
  if (err.name === 'MongoError' || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Ошибка базы данных',
      error: err.message
    });
  }
  
  // Ошибки JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Ошибка авторизации',
      error: err.message
    });
  }
  
  // Все остальные ошибки
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'production' ? 'Что-то пошло не так' : err.message
  });
};

module.exports = errorHandler;

// middleware/logger.js
/**
 * Middleware для логирования запросов
 * 
 * @param {Object} req - Объект запроса Express
 * @param {Object} res - Объект ответа Express
 * @param {Function} next - Функция для продолжения цепочки middleware
 */
const logger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent']
    };
    
    // В продакшн-версии здесь можно использовать специальные библиотеки для логирования
    // например, winston или morgan
    console.log(JSON.stringify(logEntry));
  });
  
  next();
};

module.exports = logger;

// middleware/rateLimiter.js
/**
 * Middleware для ограничения частоты запросов
 * Простая реализация, в продакшн лучше использовать express-rate-limit
 * 
 * @param {Object} options - Опции для ограничителя
 * @returns {Function} - Middleware функция
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 минута по умолчанию
    max = 60, // 60 запросов в минуту по умолчанию
    message = 'Слишком много запросов, пожалуйста, повторите позже'
  } = options;
  
  // Хранилище для отслеживания запросов
  // В продакшн лучше использовать Redis или другое внешнее хранилище
  const requestLog = {};
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Очистить устаревшие записи
    for (const storedIp in requestLog) {
      if (requestLog[storedIp].timestamp < now - windowMs) {
        delete requestLog[storedIp];
      }
    }
    
    // Инициализировать запись для IP, если её нет
    if (!requestLog[ip]) {
      requestLog[ip] = {
        count: 0,
        timestamp: now
      };
    }
    
    // Проверить, не превышен ли лимит
    if (requestLog[ip].count >= max) {
      return res.status(429).json({
        success: false,
        message
      });
    }
    
    // Увеличить счетчик запросов
    requestLog[ip].count++;
    
    next();
  };
};

module.exports = rateLimiter;

// middleware/index.js
module.exports = {
  authenticateJWT: require('./auth'),
  errorHandler: require('./errorHandler'),
  logger: require('./logger'),
  rateLimiter: require('./rateLimiter')
};
