  // Format time from seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };import React, { useState, useEffect } from 'react';
import { Bell, Star, Gift, Users, Trophy, Clock, User, Award, PieChart, Eye, EyeOff, Check, Share2, ExternalLink, HelpCircle, MessageCircle } from 'lucide-react';

const LotteryApp = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [currentRoundData, setCurrentRoundData] = useState({
    players: 3,
    maxPlayers: 5,
    timeLeft: 354, // seconds
    totalPot: 183,
    myTickets: 0
  });
  
  const [betAmount, setBetAmount] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [language, setLanguage] = useState('ru'); // 'ru' или 'en'
  
  // Локализация текстов
  const texts = {
    ru: {
      header: 'Stars Jackpot',
      currentRound: 'Текущий раунд',
      participants: 'Участники',
      pot: 'Банк',
      myTickets: 'Мои билеты',
      yourBet: 'Ваша ставка (Stars)',
      ticketsInfo: '1 Star = 10 билетов • Макс. 3 ставки на раунд',
      placeBet: 'Сделать ставку',
      weeklyJackpot: 'Еженедельный джекпот',
      drawIn: 'Розыгрыш через',
      days: 'дня',
      hours: 'часов',
      recentWinners: 'Последние победители',
      minAgo: 'мин назад',
      anonymousPlayer: 'Анонимный игрок',
      round: 'Раунд',
      drawInProgress: 'Идет розыгрыш',
      watch: 'Смотреть',
      tasks: 'Задания',
      availableTickets: 'Доступно билетов',
      subscribeToChannel: 'Подписаться на канал проекта',
      subscribeToTwitter: 'Подписаться на X (Twitter)',
      shareToStory: 'Сделать репост в историю',
      ticket: 'билет',
      tickets: 'билета',
      ticketsMany: 'билетов',
      subscribeToTelegram: 'Подпишитесь на официальный канал Stars Jackpot в Telegram и получите билет',
      subscribeToX: 'Подпишитесь на наш официальный аккаунт в X и получите дополнительный билет',
      shareToStoryDesc: 'Сделайте репост нашей рекламы в свою историю и получите 3 билета. Новые пользователи, пришедшие по вашей ссылке, станут вашими рефералами.',
      goToChannel: 'Перейти в канал',
      check: 'Проверить',
      goToX: 'Перейти в X',
      shareStory: 'Репост в историю',
      partnerTasks: 'Задания от партнеров',
      partnerChannel: 'Подписка на канал партнера',
      subscribeToPartner: 'Подпишитесь на канал нашего партнера и получите дополнительные билеты',
      profile: 'Ваш профиль',
      anonymousMode: 'Анонимный режим активен',
      publicProfile: 'Публичный профиль',
      nameHidden: 'Ваше имя скрыто для других игроков',
      nameVisible: 'Ваше имя видно другим игрокам',
      totalWon: 'Выиграно всего',
      referrals: 'Рефералы',
      users: 'пользователей',
      referralProgram: 'Реферальная программа',
      fromEachBet: 'с каждой ставки',
      inviteFriends: 'Пригласить друзей',
      gameHistory: 'История игр',
      game: 'Игра',
      viewer: 'Зритель',
      help: 'Помощь',
      enterAmount: 'Введите сумму',
      howToPlay: 'Как играть',
      rules: 'Правила игры',
      contacts: 'Контакты',
      supportEmail: 'Поддержка: support@starsjackpot.com'
    },
    en: {
      header: 'Stars Jackpot',
      currentRound: 'Current Round',
      participants: 'Participants',
      pot: 'Pot',
      myTickets: 'My Tickets',
      yourBet: 'Your Bet (Stars)',
      ticketsInfo: '1 Star = 10 tickets • Max. 3 bets per round',
      placeBet: 'Place Bet',
      weeklyJackpot: 'Weekly Jackpot',
      drawIn: 'Draw in',
      days: 'days',
      hours: 'hours',
      recentWinners: 'Recent Winners',
      minAgo: 'min ago',
      anonymousPlayer: 'Anonymous Player',
      round: 'Round',
      drawInProgress: 'Draw in progress',
      watch: 'Watch',
      tasks: 'Tasks',
      availableTickets: 'Available tickets',
      subscribeToChannel: 'Subscribe to Project Channel',
      subscribeToTwitter: 'Subscribe to X (Twitter)',
      shareToStory: 'Share to Story',
      ticket: 'ticket',
      tickets: 'tickets',
      ticketsMany: 'tickets',
      subscribeToTelegram: 'Subscribe to the official Stars Jackpot channel on Telegram and get a ticket',
      subscribeToX: 'Subscribe to our official X account and get an additional ticket',
      shareToStoryDesc: 'Share our ad to your story and get 3 tickets. New users who come through your link will become your referrals.',
      goToChannel: 'Go to Channel',
      check: 'Check',
      goToX: 'Go to X',
      shareStory: 'Share to Story',
      partnerTasks: 'Partner Tasks',
      partnerChannel: 'Subscribe to Partner Channel',
      subscribeToPartner: 'Subscribe to our partner\'s channel and get additional tickets',
      profile: 'Your Profile',
      anonymousMode: 'Anonymous Mode Active',
      publicProfile: 'Public Profile',
      nameHidden: 'Your name is hidden from other players',
      nameVisible: 'Your name is visible to other players',
      totalWon: 'Total Won',
      referrals: 'Referrals',
      users: 'users',
      referralProgram: 'Referral Program',
      fromEachBet: 'from each bet',
      inviteFriends: 'Invite Friends',
      gameHistory: 'Game History',
      game: 'Game',
      viewer: 'Viewer',
      help: 'Help',
      enterAmount: 'Enter amount',
      howToPlay: 'How to Play',
      rules: 'Game Rules',
      contacts: 'Contacts',
      supportEmail: 'Support: support@starsjackpot.com'
    }
  };
  
  // Определить язык из окружения Telegram, если доступно, или использовать русский по умолчанию
  useEffect(() => {
    // В реальном приложении здесь будет код для определения языка пользователя из Telegram API
    const detectLanguage = () => {
      // Здесь будет вызов к API Telegram для получения языка пользователя
      // Для примера просто проверяем navigator.language, если он доступен
      if (typeof window !== 'undefined' && window.navigator) {
        const browserLang = window.navigator.language.slice(0, 2).toLowerCase();
        if (browserLang === 'en') {
          setLanguage('en');
        } else {
          setLanguage('ru');
        }
      }
    };
    
    detectLanguage();
  }, []);
  
  // Получить текущие тексты в зависимости от выбранного языка
  const t = texts[language];
  
  // Simulate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRoundData(prev => ({
        ...prev,
        timeLeft: prev.timeLeft > 0 ? prev.timeLeft - 1 : 0
      }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Progress percentage
  const progressPercentage = (currentRoundData.players / currentRoundData.maxPlayers) * 100;
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{t.header}</h1>
        <div className="flex items-center">
          <div className="flex border border-white rounded mr-3 overflow-hidden">
            <button 
              className={`px-2 py-1 text-xs ${language === 'ru' ? 'bg-white text-blue-600' : 'bg-transparent text-white'}`}
              onClick={() => setLanguage('ru')}
            >
              RUS
            </button>
            <button 
              className={`px-2 py-1 text-xs ${language === 'en' ? 'bg-white text-blue-600' : 'bg-transparent text-white'}`}
              onClick={() => setLanguage('en')}
            >
              ENG
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Star size={18} className="text-yellow-300" />
            <span className="font-bold">356</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'main' && (
          <div className="space-y-4">
            {/* Current Round Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold">{t.currentRound}</h2>
                <div className="flex items-center text-sm">
                  <Clock size={16} className="mr-1" />
                  <span className={currentRoundData.timeLeft < 60 ? "text-red-500" : ""}>
                    {formatTime(currentRoundData.timeLeft)}
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full flex items-center justify-end pr-2 text-xs text-white"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {currentRoundData.players}/{currentRoundData.maxPlayers}
                </div>
              </div>
              
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <div className="text-gray-500">{t.participants}</div>
                  <div className="font-bold flex items-center">
                    <Users size={16} className="mr-1" />
                    {currentRoundData.players}/{currentRoundData.maxPlayers}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">{t.pot}</div>
                  <div className="font-bold flex items-center">
                    <Star size={16} className="mr-1 text-yellow-500" />
                    {currentRoundData.totalPot}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">{t.myTickets}</div>
                  <div className="font-bold flex items-center">
                    <Trophy size={16} className="mr-1 text-blue-500" />
                    {currentRoundData.myTickets}
                  </div>
                </div>
              </div>
              
              {/* Bet controls */}
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">{t.yourBet}</div>
                <div className="flex gap-2 mb-2">
                  {[1, 5, 10, 50].map(amount => (
                    <button
                      key={amount}
                      className={`flex-1 py-2 rounded ${betAmount === amount ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                      onClick={() => setBetAmount(amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <div className="relative mt-3 mb-3">
                  <input
                    type="number"
                    min="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10 text-center font-bold"
                    placeholder={t.enterAmount}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Star size={18} className="text-yellow-500" />
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3">{t.ticketsInfo}</div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
                  {t.placeBet}
                </button>
              </div>
            </div>
            
            {/* Weekly Jackpot */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold">Еженедельный джекпот</h2>
                <div className="flex items-center text-yellow-600 font-bold">
                  <Star size={16} className="mr-1" />
                  <span>1,245</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Розыгрыш через 3 дня 14 часов
              </div>
            </div>
            
                          {/* Recent Winners */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold mb-2">Последние победители</h2>
              <div className="space-y-3">
                {[
                  {name: "Alex", amount: 158, time: "2 мин назад", anonymous: false},
                  {name: "Анонимный игрок", amount: 87, time: "14 мин назад", anonymous: true},
                  {name: "Ivan", amount: 221, time: "26 мин назад", anonymous: false}
                ].map((winner, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${winner.anonymous ? 'bg-gray-200' : 'bg-blue-100'}`}>
                        {winner.anonymous ? 
                          <EyeOff size={16} className="text-gray-500" /> : 
                          <User size={16} className="text-blue-600" />
                        }
                      </div>
                      <div>
                        <div className="font-medium">{winner.name}</div>
                        <div className="text-xs text-gray-500">{winner.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center text-green-600 font-bold">
                      <span>+{winner.amount}</span>
                      <Star size={14} className="ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4">{t.howToPlay}</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-3 py-1">
                  <h3 className="font-medium text-blue-800">{t.rules}</h3>
                  <div className="text-sm text-gray-700 mt-2 space-y-2">
                    <p>1. {language === 'ru' ? 'Каждый раунд начинается, когда набирается 5 участников.' : 'Each round starts when 5 participants are collected.'}</p>
                    <p>2. {language === 'ru' ? 'Минимальная ставка составляет 1 Star (10 билетов).' : 'Minimum bet is 1 Star (10 tickets).'}</p>
                    <p>3. {language === 'ru' ? 'Можно сделать до 3 ставок в одном раунде.' : 'You can make up to 3 bets in one round.'}</p>
                    <p>4. {language === 'ru' ? 'Победитель выбирается случайным образом из всех купленных билетов.' : 'The winner is randomly selected from all purchased tickets.'}</p>
                    <p>5. {language === 'ru' ? 'Комиссия сервиса составляет 5% от общего банка.' : 'Service commission is 5% of the total pot.'}</p>
                    <p>6. {language === 'ru' ? 'Еженедельный джекпот разыгрывается среди всех участников недели.' : 'Weekly jackpot is drawn among all participants of the week.'}</p>
                  </div>
                </div>
                
                <div className="border-l-4 border-green-500 pl-3 py-1">
                  <h3 className="font-medium text-green-800">{t.contacts}</h3>
                  <div className="text-sm text-gray-700 mt-2 space-y-2">
                    <p>{t.supportEmail}</p>
                    <p>Telegram: @stars_jackpot_support</p>
                    <button className="mt-3 flex items-center text-blue-600">
                      <MessageCircle size={16} className="mr-1" />
                      {language === 'ru' ? 'Написать в поддержку' : 'Contact Support'}
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-800">
                    {language === 'ru' 
                      ? 'Если вы столкнулись с ошибкой или у вас есть предложения по улучшению сервиса, пожалуйста, сообщите нам через контакты выше.'
                      : 'If you encounter an error or have suggestions for improving the service, please let us know through the contacts above.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'watch' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold mb-4">Наблюдай за игрой</h2>
            <div className="space-y-4">
              {[
                {id: 1, players: 4, maxPlayers: 5, pot: 167, timeLeft: 124},
                {id: 2, players: 2, maxPlayers: 5, pot: 45, timeLeft: 423},
                {id: 3, players: 5, maxPlayers: 5, pot: 274, status: "running"}
              ].map(game => (
                <div key={game.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">Раунд #{game.id}</div>
                    {game.status === "running" ? (
                      <div className="text-sm bg-green-100 text-green-800 px-2 rounded">Идет розыгрыш</div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <Clock size={14} className="inline mr-1" />
                        {formatTime(game.timeLeft)}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <Users size={14} className="inline mr-1" />
                      {game.players}/{game.maxPlayers}
                    </div>
                    <div>
                      <Star size={14} className="inline mr-1 text-yellow-500" />
                      {game.pot}
                    </div>
                    <button className="text-blue-600">
                      Смотреть
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Задания</h2>
                <div className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  <Trophy size={14} className="mr-1" />
                  Доступно билетов: 5
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Задание 1 */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">Подписаться на канал проекта</div>
                    <div className="text-green-600 font-bold flex items-center">
                      <Trophy size={14} className="mr-1" />
                      1 билет
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Подпишитесь на официальный канал Stars Jackpot в Telegram и получите билет
                  </p>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center">
                      <ExternalLink size={16} className="mr-1" />
                      Перейти в канал
                    </button>
                    <button className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                      <Check size={16} className="mr-1" />
                      Проверить
                    </button>
                  </div>
                </div>
                
                {/* Задание 2 */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">Подписаться на X (Twitter)</div>
                    <div className="text-green-600 font-bold flex items-center">
                      <Trophy size={14} className="mr-1" />
                      1 билет
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Подпишитесь на наш официальный аккаунт в X и получите дополнительный билет
                  </p>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center">
                      <ExternalLink size={16} className="mr-1" />
                      Перейти в X
                    </button>
                    <button className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                      <Check size={16} className="mr-1" />
                      Проверить
                    </button>
                  </div>
                </div>
                
                {/* Задание 3 */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">Сделать репост в историю</div>
                    <div className="text-green-600 font-bold flex items-center">
                      <Trophy size={14} className="mr-1" />
                      3 билета
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Сделайте репост нашей рекламы в свою историю и получите 3 билета. Новые пользователи, пришедшие по вашей ссылке, станут вашими рефералами.
                  </p>
                  <button className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center">
                    <Share2 size={16} className="mr-1" />
                    Репост в историю
                  </button>
                </div>
                
                {/* Партнерские задания */}
                <div className="pt-2">
                  <div className="flex items-center text-gray-500 mb-3">
                    <div className="flex-grow border-t border-gray-300 mr-3"></div>
                    <span className="text-sm">Задания от партнеров</span>
                    <div className="flex-grow border-t border-gray-300 ml-3"></div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">Подписка на канал партнера</div>
                      <div className="text-green-600 font-bold flex items-center">
                        <Trophy size={14} className="mr-1" />
                        2 билета
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Подпишитесь на канал нашего партнера и получите дополнительные билеты
                    </p>
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center">
                        <ExternalLink size={16} className="mr-1" />
                        Перейти в канал
                      </button>
                      <button className="flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                        <Check size={16} className="mr-1" />
                        Проверить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold">Ваш профиль</div>
                    <div className="text-sm text-gray-500">ID: 87423561</div>
                  </div>
                </div>
                <button 
                  className={`p-2 rounded-full ${isAnonymous ? 'bg-blue-100' : 'bg-gray-100'}`}
                  onClick={() => setIsAnonymous(!isAnonymous)}
                >
                  {isAnonymous ? 
                    <EyeOff size={20} className="text-blue-600" /> : 
                    <Eye size={20} className="text-gray-600" />
                  }
                </button>
              </div>
              
              <div className="flex items-center mb-2 text-sm">
                <div className={`px-2 py-1 rounded mr-2 ${isAnonymous ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {isAnonymous ? 'Анонимный режим активен' : 'Публичный профиль'}
                </div>
                <div className="text-gray-500 text-xs">
                  {isAnonymous ? 'Ваше имя скрыто для других игроков' : 'Ваше имя видно другим игрокам'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Выиграно всего</div>
                  <div className="font-bold flex items-center">
                    <Star size={16} className="mr-1 text-yellow-500" />
                    843
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Рефералы</div>
                  <div className="font-bold">
                    12 пользователей
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">Реферальная программа</div>
                  <div className="text-sm text-blue-600">10% с каждой ставки</div>
                </div>
                <button className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg">
                  Пригласить друзей
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold mb-3">История игр</h2>
              <div className="space-y-3">
                {[
                  {date: "20.03", result: "win", amount: 87},
                  {date: "19.03", result: "lose", amount: 15},
                  {date: "18.03", result: "lose", amount: 5},
                  {date: "15.03", result: "win", amount: 142}
                ].map((game, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <div className="font-medium">{game.date}</div>
                      <div className="text-xs text-gray-500">Раунд #{1023 - idx}</div>
                    </div>
                    <div className={`flex items-center font-bold ${game.result === 'win' ? 'text-green-600' : 'text-red-500'}`}>
                      {game.result === 'win' ? '+' : '-'}{game.amount}
                      <Star size={14} className="ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <div className="bg-white border-t flex justify-around p-2">
        <button 
          className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'main' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('main')}
        >
          <Trophy size={20} />
          <span className="text-xs mt-1">{t.game}</span>
        </button>
        <button 
          className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'watch' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('watch')}
        >
          <PieChart size={20} />
          <span className="text-xs mt-1">{t.viewer}</span>
        </button>
        <button 
          className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'tasks' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Gift size={20} />
          <span className="text-xs mt-1">{t.tasks}</span>
        </button>
        <button 
          className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={20} />
          <span className="text-xs mt-1">{t.profile}</span>
        </button>
        <button 
          className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'help' ? 'text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('help')}
        >
          <Bell size={20} />
          <span className="text-xs mt-1">{t.help}</span>
        </button>
      </div>
      
      {/* Notification Button */}
      <button className="absolute bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg">
        <Bell size={20} />
      </button>
    </div>
  );
};

export default LotteryApp;