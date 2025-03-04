// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Получить JWT по Telegram авторизации
router.post('/telegram', async (req, res) => {
  try {
    const { id, first_name, last_name, username, auth_date, hash } = req.body;
    
    // Проверка хеша для безопасности
    // В реальном приложении необходимо реализовать проверку TelegramAuth
    // Подробнее: https://core.telegram.org/widgets/login#checking-authorization

    // Найти пользователя или создать нового
    let user = await User.findOne({ telegramId: id });
    
    if (!user) {
      user = new User({
        telegramId: id,
        firstName: first_name,
        lastName: last_name,
        username: username,
        balance: 10 // Начальный бонус новым пользователям (10 Stars)
      });
      await user.save();
    } else {
      // Обновить информацию пользователя, если она изменилась
      user.firstName = first_name;
      user.lastName = last_name;
      user.username = username;
      user.lastActive = new Date();
      await user.save();
    }
    
    // Создание JWT токена
    const token = jwt.sign(
      { id: user._id, telegramId: user.telegramId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        balance: user.balance,
        isAnonymous: user.isAnonymous,
        language: user.language,
        darkMode: user.darkMode
      }
    });
    
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ message: 'Ошибка авторизации', error: error.message });
  }
});

// Проверка токена
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false, message: 'Токен не предоставлен' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ valid: false, message: 'Пользователь не найден' });
    }
    
    res.json({ 
      valid: true, 
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        balance: user.balance,
        isAnonymous: user.isAnonymous,
        language: user.language,
        darkMode: user.darkMode
      } 
    });
    
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Недействительный токен', error: error.message });
  }
});

module.exports = router;

// routes/rounds.js
const express = require('express');
const router = express.Router();
const { Round, User, Transaction } = require('../models');
const authenticateJWT = require('../middleware/auth');
const { generateRandomTicket } = require('../services/chainlink');

// Получить информацию о текущем раунде
router.get('/current', async (req, res) => {
  try {
    const round = await Round.findOne({ status: 'active' })
      .populate('participants.user', 'telegramId username firstName lastName isAnonymous')
      .sort({ startTime: -1 });
    
    if (!round) {
      // Если активных раундов нет, находим последний завершенный
      const lastRound = await Round.findOne({ status: 'completed' })
        .populate('participants.user winner.user', 'telegramId username firstName lastName isAnonymous')
        .sort({ endTime: -1 });
      
      // И создаем новый раунд
      const newRound = new Round({
        roundNumber: lastRound ? lastRound.roundNumber + 1 : 1,
        status: 'active',
        maxParticipants: 5,
        minBet: 1,
        feePercent: 5
      });
      
      await newRound.save();
      
      return res.json({ round: newRound, isNew: true });
    }
    
    res.json({ round, isNew: false });
    
  } catch (error) {
    console.error('Ошибка получения текущего раунда:', error);
    res.status(500).json({ message: 'Ошибка получения текущего раунда', error: error.message });
  }
});

// Получить список последних раундов
router.get('/history', async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  
  try {
    const rounds = await Round.find({ status: 'completed' })
      .populate('winner.user', 'telegramId username firstName lastName isAnonymous')
      .sort({ endTime: -1 })
      .limit(limit);
    
    res.json({ rounds });
    
  } catch (error) {
    console.error('Ошибка получения истории раундов:', error);
    res.status(500).json({ message: 'Ошибка получения истории раундов', error: error.message });
  }
});

// Сделать ставку в текущем раунде
router.post('/bet', authenticateJWT, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  
  try {
    // Найти пользователя и проверить баланс
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Недостаточно средств' });
    }
    
    // Найти текущий раунд
    let round = await Round.findOne({ status: 'active' });
    
    if (!round) {
      // Создать новый раунд, если нет активного
      const lastRound = await Round.findOne().sort({ roundNumber: -1 });
      round = new Round({
        roundNumber: lastRound ? lastRound.roundNumber + 1 : 1,
        status: 'active',
        maxParticipants: 5,
        minBet: 1,
        feePercent: 5
      });
    }
    
    // Проверить, не превышено ли максимальное количество ставок от одного пользователя
    const userBetsCount = round.participants.filter(p => p.user.toString() === userId).length;
    
    if (userBetsCount >= 3) {
      return res.status(400).json({ message: 'Превышено максимальное количество ставок (3) в одном раунде' });
    }
    
    // Проверить, не меньше ли ставка минимальной
    if (amount < round.minBet) {
      return res.status(400).json({ message: `Ставка должна быть не менее ${round.minBet} Stars` });
    }
    
    // Вычислить диапазон билетов
    const ticketStart = round.totalTickets + 1;
    const ticketsCount = amount * 10; // 1 Star = 10 билетов
    const ticketEnd = ticketStart + ticketsCount - 1;
    
    // Добавить ставку в раунд
    round.participants.push({
      user: userId,
      bet: amount,
      ticketStart,
      ticketEnd,
      betTime: new Date()
    });
    
    // Обновить общую сумму раунда и количество билетов
    round.totalPot += amount;
    round.totalTickets += ticketsCount;
    
    // Списать средства с баланса пользователя
    user.balance -= amount;
    user.totalBets += amount;
    
    // Сохранить транзакцию
    const transaction = new Transaction({
      user: userId,
      type: 'bet',
      amount: -amount,
      round: round._id,
      status: 'completed',
      note: `Ставка ${amount} Stars в раунде #${round.roundNumber}`
    });
    
    // Проверить, нужно ли проводить розыгрыш
    if (round.participants.length >= round.maxParticipants) {
      await determineWinner(round);
    }
    
    // Сохранить все изменения в базе данных
    await Promise.all([
      round.save(),
      user.save(),
      transaction.save()
    ]);
    
    res.json({
      message: 'Ставка успешно сделана',
      roundId: round._id,
      tickets: {
        start: ticketStart,
        end: ticketEnd,
        count: ticketsCount
      },
      userBalance: user.balance
    });
    
  } catch (error) {
    console.error('Ошибка при создании ставки:', error);
    res.status(500).json({ message: 'Ошибка при создании ставки', error: error.message });
  }
});

// Вспомогательная функция для определения победителя
async function determineWinner(round) {
  try {
    // Получить случайный билет через Chainlink VRF (или другой сервис)
    const winningTicket = await generateRandomTicket(1, round.totalTickets);
    
    // Найти победителя по выигрышному билету
    let winnerId = null;
    let winningParticipant = null;
    
    for (const participant of round.participants) {
      if (winningTicket >= participant.ticketStart && winningTicket <= participant.ticketEnd) {
        winnerId = participant.user;
        winningParticipant = participant;
        break;
      }
    }
    
    if (!winnerId) {
      throw new Error('Не удалось определить победителя');
    }
    
    // Рассчитать выигрыш (общий банк минус комиссия)
    const fee = (round.totalPot * round.feePercent) / 100;
    const prize = round.totalPot - fee;
    
    // Обновить данные раунда
    round.status = 'completed';
    round.endTime = new Date();
    round.winner = {
      user: winnerId,
      ticket: winningTicket,
      prize
    };
    round.winningTicket = winningTicket;
    
    // Обновить баланс победителя
    const winner = await User.findById(winnerId);
    winner.balance += prize;
    winner.totalWon += prize;
    await winner.save();
    
    // Создать транзакцию выигрыша
    const transaction = new Transaction({
      user: winnerId,
      type: 'win',
      amount: prize,
      round: round._id,
      status: 'completed',
      note: `Выигрыш ${prize} Stars в раунде #${round.roundNumber}`
    });
    await transaction.save();
    
    // Создать новый раунд
    const newRound = new Round({
      roundNumber: round.roundNumber + 1,
      status: 'active',
      maxParticipants: round.maxParticipants,
      minBet: round.minBet,
      feePercent: round.feePercent
    });
    await newRound.save();
    
    return true;
  } catch (error) {
    console.error('Ошибка при определении победителя:', error);
    return false;
  }
}

module.exports = router;

// routes/users.js
const express = require('express');
const router = express.Router();
const { User, Transaction, Round } = require('../models');

// Получить профиль пользователя
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('referrer', 'telegramId username firstName lastName')
      .select('-__v');
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Получить статистику пользователя
    const totalWins = await Transaction.countDocuments({ user: userId, type: 'win' });
    
    // Получить последние транзакции
    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('round', 'roundNumber')
      .populate('task', 'title');
    
    // Получить историю игр пользователя
    const gamesHistory = await Round.find({
      $or: [
        { 'participants.user': userId },
        { 'winner.user': userId }
      ]
    })
    .sort({ endTime: -1 })
    .limit(5)
    .select('roundNumber totalPot winner startTime endTime');
    
    res.json({
      user,
      statistics: {
        totalWins,
        totalReferrals: user.referrals.length
      },
      transactions,
      gamesHistory
    });
    
  } catch (error) {
    console.error('Ошибка получения профиля пользователя:', error);
    res.status(500).json({ message: 'Ошибка получения профиля пользователя', error: error.message });
  }
});

// Обновить настройки пользователя
router.put('/settings', async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAnonymous, language, darkMode } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Обновить только предоставленные поля
    if (isAnonymous !== undefined) user.isAnonymous = isAnonymous;
    if (language !== undefined) user.language = language;
    if (darkMode !== undefined) user.darkMode = darkMode;
    
    user.lastActive = new Date();
    await user.save();
    
    res.json({
      message: 'Настройки успешно обновлены',
      user: {
        id: user._id,
        isAnonymous: user.isAnonymous,
        language: user.language,
        darkMode: user.darkMode
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({ message: 'Ошибка обновления настроек', error: error.message });
  }
});

// Получить реферальную ссылку пользователя
router.get('/referral-link', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Создать реферальную ссылку на основе идентификатора пользователя
    const referralLink = `https://t.me/jackpot_ton_bot/Jackpot_ton?start=ref_${user.telegramId}`;
    
    res.json({
      referralLink,
      referralsCount: user.referrals.length,
      referralEarnings: user.referralEarnings
    });
    
  } catch (error) {
    console.error('Ошибка получения реферальной ссылки:', error);
    res.status(500).json({ message: 'Ошибка получения реферальной ссылки', error: error.message });
  }
});

// Использовать реферальную ссылку (для новых пользователей)
router.post('/use-referral', async (req, res) => {
  try {
    const userId = req.user.id;
    const { referralCode } = req.body;
    
    // Извлечь telegramId из реферального кода
    const referrerTelegramId = referralCode.replace('ref_', '');
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверить, не использовал ли уже пользователь реферальную ссылку
    if (user.referrer) {
      return res.status(400).json({ message: 'Вы уже использовали реферальную ссылку' });
    }
    
    // Найти пользователя по реферальному коду
    const referrer = await User.findOne({ telegramId: referrerTelegramId });
    
    if (!referrer) {
      return res.status(404).json({ message: 'Реферер не найден' });
    }
    
    // Предотвратить самореферальность
    if (referrer.telegramId === user.telegramId) {
      return res.status(400).json({ message: 'Нельзя использовать собственную реферальную ссылку' });
    }
    
    // Обновить пользователя, добавив реферера
    user.referrer = referrer._id;
    await user.save();
    
    // Добавить пользователя в список рефералов реферера
    if (!referrer.referrals.includes(user._id)) {
      referrer.referrals.push(user._id);
      await referrer.save();
    }
    
    res.json({
      message: 'Реферальная ссылка успешно использована',
      referrer: {
        id: referrer._id,
        telegramId: referrer.telegramId,
        username: referrer.username
      }
    });
    
  } catch (error) {
    console.error('Ошибка использования реферальной ссылки:', error);
    res.status(500).json({ message: 'Ошибка использования реферальной ссылки', error: error.message });
  }
});

module.exports = router;

// routes/tasks.js
const express = require('express');
const router = express.Router();
const { Task, User, Transaction } = require('../models');
const { verifySubscription, verifyShare } = require('../services/telegram');

// Получить все доступные задания
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Получить пользователя для проверки уже выполненных заданий
    const user = await User.findById(userId).populate('completedTasks');
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Получить все активные задания
    const tasks = await Task.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    
    // Отметить задания, которые уже выполнены пользователем
    const tasksWithStatus = tasks.map(task => {
      const isCompleted = user.completedTasks.some(
        completedTask => completedTask._id.toString() === task._id.toString()
      );
      
      return {
        ...task.toObject(),
        isCompleted
      };
    });
    
    // Разделить задания на партнерские и обычные
    const partnerTasks = tasksWithStatus.filter(task => task.isPartner);
    const regularTasks = tasksWithStatus.filter(task => !task.isPartner);
    
    res.json({
      regularTasks,
      partnerTasks
    });
    
  } catch (error) {
    console.error('Ошибка получения заданий:', error);
    res.status(500).json({ message: 'Ошибка получения заданий', error: error.message });
  }
});

// Проверить выполнение задания
router.post('/verify/:taskId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    
    // Найти пользователя и задание
    const user = await User.findById(userId);
    const task = await Task.findById(taskId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (!task) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }
    
    // Проверить, не выполнено ли уже задание этим пользователем
    if (user.completedTasks.includes(taskId)) {
      return res.status(400).json({ message: 'Задание уже выполнено' });
    }
    
    // Проверить выполнение задания в зависимости от его типа
    let isVerified = false;
    
    switch (task.type) {
      case 'subscription':
        isVerified = await verifySubscription(user.telegramId, task.channel);
        break;
      case 'social_share':
        isVerified = await verifyShare(user.telegramId);
        break;
      case 'partner':
        // Для партнерских заданий можно использовать другую логику проверки
        isVerified = await verifySubscription(user.telegramId, task.channel);
        break;
      default:
        return res.status(400).json({ message: 'Неизвестный тип задания' });
    }
    
    if (!isVerified) {
      return res.status(400).json({ message: 'Задание не выполнено. Пожалуйста, выполните задание и повторите проверку.' });
    }
    
    // Выдать награду пользователю
    const ticketsReward = task.reward; // Количество билетов
    
    // Добавить задание в список выполненных
    user.completedTasks.push(taskId);
    
    // Записать транзакцию
    const transaction = new Transaction({
      user: userId,
      type: 'task_reward',
      amount: ticketsReward,
      task: taskId,
      status: 'completed',
      note: `Награда за выполнение задания "${task.title}"`
    });
    
    await Promise.all([
      user.save(),
      transaction.save()
    ]);
    
    res.json({
      message: 'Задание успешно выполнено',
      reward: {
        tickets: ticketsReward
      }
    });
    
  } catch (error) {
    console.error('Ошибка проверки задания:', error);
    res.status(500).json({ message: 'Ошибка проверки задания', error: error.message });
  }
});

module.exports = router;

// routes/payments.js
const express = require('express');
const router = express.Router();
const { User, Transaction } = require('../models');
const { verifyTelegramPayment } = require('../services/telegram');

// Инициировать покупку Stars
router.post('/buy', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Неверная сумма' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Здесь в реальном приложении вы бы инициировали платеж через API Telegram
    // и получали платежную ссылку
    
    // Для примера просто возвращаем заглушку
    res.json({
      message: 'Платеж инициирован',
      paymentUrl: `https://t.me/jackpot_ton_bot/pay?amount=${amount}`,
      orderId: `order_${Date.now()}`
    });
    
  } catch (error) {
    console.error('Ошибка инициирования платежа:', error);
    res.status(500).json({ message: 'Ошибка инициирования платежа', error: error.message });
  }
});

// Подтвердить платеж после возврата из Telegram
router.post('/verify', async (req, res) => {
  try {
    const { telegramPaymentId, userId, amount } = req.body;
    
    // Проверить валидность платежа через API Telegram
    const isValid = await verifyTelegramPayment(telegramPaymentId);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Недействительный платеж' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Пополнить баланс пользователя
    user.balance += amount;
    
    // Записать транзакцию
    const transaction = new Transaction({
      user: userId,
      type: 'admin', // Тип "admin" для пополнения баланса
      amount,
      telegramPaymentId,
      status: 'completed',
      note: `Пополнение баланса на ${amount} Stars`
    });
    
    await Promise.all([
      user.save(),
      transaction.save()
    ]);
    
    res.json({
      message: 'Платеж успешно подтвержден',
      newBalance: user.balance
    });
    
  } catch (error) {
    console.error('Ошибка подтверждения платежа:', error);
    res.status(500).json({ message: 'Ошибка подтверждения платежа', error: error.message });
  }
});

module.exports = router;

// routes/admin.js
const express = require('express');
const router = express.Router();
const { User, Round, Task, Transaction, Jackpot } = require('../models');

// Middleware для проверки прав администратора
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Здесь можно реализовать свою логику проверки, например,
    // через список администраторов или специальное поле в модели User
    const adminTelegramIds = process.env.ADMIN_TELEGRAM_IDS?.split(',') || [];
    
    if (!user || !adminTelegramIds.includes(user.telegramId)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка проверки прав администратора', error: error.message });
  }
};

// Применить middleware isAdmin ко всем маршрутам
router.use(isAdmin);

// Получить статистику приложения
router.get('/stats', async (req, res) => {
  try {
    // Общая статистика
    const usersCount = await User.countDocuments();
    const activeRoundsCount = await Round.countDocuments({ status: 'active' });
    const completedRoundsCount = await Round.countDocuments({ status: 'completed' });
    const totalPotAmount = await Round.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPot' } } }
    ]);
    
    // Статистика за последние 24 часа
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsersLast24h = await User.countDocuments({ createdAt: { $gte: last24Hours } });
    const completedRoundsLast24h = await Round.countDocuments({
      status: 'completed',
      endTime: { $gte: last24Hours }
    });
    
    // Последние транзакции
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'telegramId username')
      .populate('round', 'roundNumber');
    
    res.json({
      general: {
        usersCount,
        activeRoundsCount,
        completedRoundsCount,
        totalPotAmount: totalPotAmount[0]?.total || 0
      },
      last24h: {
        newUsers: newUsersLast24h,
        completedRounds: completedRoundsLast24h
      },
      recentTransactions
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ message: 'Ошибка получения статистики', error: error.message });
  }
});

// Создать новое задание
router.post('/tasks', async (req, res) => {
  try {
    const { title, description, reward, type, channel, url, isPartner, order, expiresAt } = req.body;
    
    const task = new Task({
      title,
      description,
      reward,
      type,
      channel,
      url,
      isPartner: isPartner || false,
      order: order || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    await task.save();
    
    res.status(201).json({
      message: 'Задание успешно создано',
      task
    });
    
  } catch (error) {
    console.error('Ошибка создания задания:', error);
    res.status(500).json({ message: 'Ошибка создания задания', error: error.message });
  }
});

// Изменить настройки текущего раунда
router.put('/round/settings', async (req, res) => {
  try {
    const { maxParticipants, minBet, feePercent } = req.body;
    
    const round = await Round.findOne({ status: 'active' });
    
    if (!round) {
      return res.status(404).json({ message: 'Активный раунд не найден' });
    }
    
    // Обновить настройки
    if (maxParticipants !== undefined) round.maxParticipants = maxParticipants;
    if (minBet !== undefined) round.minBet = minBet;
    if (feePercent !== undefined) round.feePercent = feePercent;
    
    await round.save();
    
    res.json({
      message: 'Настройки раунда успешно обновлены',
      round
    });
    
  } catch (error) {
    console.error('Ошибка обновления настроек раунда:', error);
    res.status(500).json({ message: 'Ошибка обновления настроек раунда', error: error.message });
  }
});

// Управление пользовательским балансом
router.post('/user/balance', async (req, res) => {
  try {
    const { telegramId, amount, note } = req.body;
    
    if (!telegramId || !amount) {
      return res.status(400).json({ message: 'Требуются telegramId и amount' });
    }
    
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Обновить баланс пользователя
    user.balance += amount;
    
    // Записать транзакцию
    const transaction = new Transaction({
      user: user._id,
      type: 'admin',
      amount,
      status: 'completed',
      note: note || `Административное изменение баланса на ${amount} Stars`
    });
    
    await Promise.all([
      user.save(),
      transaction.save()
    ]);
    
    res.json({
      message: 'Баланс пользователя успешно обновлен',
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        newBalance: user.balance
      }
    });
    
  } catch (error) {
    console.error('Ошибка управления балансом пользователя:', error);
    res.status(500).json({ message: 'Ошибка управления балансом пользователя', error: error.message });
  }
});

// Создать еженедельный джекпот вручную
router.post('/jackpot/create', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    // Проверить, нет ли уже активного джекпота
    const activeJackpot = await Jackpot.findOne({ status: 'active' });
    
    if (activeJackpot) {
      return res.status(400).json({ 
        message: 'Уже существует активный джекпот',
        jackpot: activeJackpot
      });
    }
    
    // Создать новый джекпот
    const jackpot = new Jackpot({
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // По умолчанию на неделю
      status: 'active'
    });
    
    await jackpot.save();
    
    res.status(201).json({
      message: 'Еженедельный джекпот успешно создан',
      jackpot
    });
    
  } catch (error) {
    console.error('Ошибка создания джекпота:', error);
    res.status(500).json({ message: 'Ошибка создания джекпота', error: error.message });
  }
});

module.exports = router;