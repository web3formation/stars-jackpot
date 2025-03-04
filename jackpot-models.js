// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  telegramId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: { 
    type: String 
  },
  firstName: { 
    type: String 
  },
  lastName: { 
    type: String 
  },
  isAnonymous: { 
    type: Boolean, 
    default: false 
  },
  balance: { 
    type: Number, 
    default: 0 
  },
  totalWon: { 
    type: Number, 
    default: 0 
  },
  totalBets: { 
    type: Number, 
    default: 0 
  },
  referrer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  referrals: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  referralEarnings: { 
    type: Number, 
    default: 0 
  },
  completedTasks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  }],
  language: { 
    type: String, 
    enum: ['ru', 'en'], 
    default: 'ru' 
  },
  darkMode: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  }
});

// Метод для сравнения хешированных паролей (если нужно)
userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// models/Round.js
const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  participants: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    bet: { 
      type: Number, 
      required: true 
    },
    ticketStart: { 
      type: Number 
    },
    ticketEnd: { 
      type: Number 
    },
    betTime: { 
      type: Date, 
      default: Date.now 
    }
  }],
  maxParticipants: { 
    type: Number, 
    default: 5 
  },
  minBet: { 
    type: Number, 
    default: 1 
  },
  totalPot: { 
    type: Number, 
    default: 0 
  },
  feePercent: { 
    type: Number, 
    default: 5 
  },
  winner: {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    ticket: { 
      type: Number 
    },
    prize: { 
      type: Number 
    }
  },
  winningTicket: { 
    type: Number 
  },
  totalTickets: { 
    type: Number, 
    default: 0 
  },
  verificationHash: { 
    type: String 
  } // Хеш для верификации честности розыгрыша
});

// Виртуальное свойство для получения текущего количества участников
roundSchema.virtual('participantsCount').get(function() {
  return this.participants.length;
});

const Round = mongoose.model('Round', roundSchema);

module.exports = Round;

// models/Jackpot.js
const mongoose = require('mongoose');

const jackpotSchema = new mongoose.Schema({
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  totalPot: { 
    type: Number, 
    default: 0 
  },
  participants: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    tickets: { 
      type: Number, 
      default: 0 
    }
  }],
  winner: {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    ticket: { 
      type: Number 
    },
    prize: { 
      type: Number 
    }
  },
  winningTicket: { 
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['active', 'completed'], 
    default: 'active' 
  },
  verificationHash: { 
    type: String 
  } // Хеш для верификации честности розыгрыша
});

const Jackpot = mongoose.model('Jackpot', jackpotSchema);

module.exports = Jackpot;

// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reward: {
    type: Number, // Количество билетов
    required: true
  },
  type: {
    type: String,
    enum: ['subscription', 'social_share', 'partner'],
    required: true
  },
  channel: {
    type: String
  }, // Для подписок: имя канала
  url: {
    type: String
  }, // URL для перехода
  isActive: {
    type: Boolean,
    default: true
  },
  isPartner: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }, // Для сортировки заданий
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  } // Если задание временное
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['bet', 'win', 'referral', 'task_reward', 'admin'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  round: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Round' 
  },
  jackpot: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Jackpot' 
  },
  referral: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  task: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  },
  telegramPaymentId: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  note: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

// models/index.js
module.exports = {
  User: require('./User'),
  Round: require('./Round'),
  Jackpot: require('./Jackpot'),
  Task: require('./Task'),
  Transaction: require('./Transaction')
};
