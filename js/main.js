 

const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted } = Vue;

const app = createApp({
  setup() {
     
     
     
    const createFallbackAuth = () => {
      const USERS_KEY = 'sneakfix_users_v1';
      const CURRENT_USER_KEY = 'sneakfix_current_user_v1';
      const defaultUsers = [
        { id: 1, name: 'Иван Романов', email: 'admin@sneakfix.by', password: 'admin123', role: 'admin' },
        { id: 2, name: 'Артём Смирнов', email: 'master@sneakfix.by', password: 'master123', role: 'master' },
        { id: 3, name: 'Алексей Клиент', email: 'client@sneakfix.by', password: 'client123', role: 'user' }
      ];
      return {
        getCurrentUser() {
          try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        async login(email, password) {
          const raw = localStorage.getItem(USERS_KEY);
          const users = raw ? JSON.parse(raw) : defaultUsers;
          const cleanEmail = String(email || '').trim().toLowerCase();
          const found = users.find(u => u.email.toLowerCase() === cleanEmail);
          if (!found || found.password !== password) {
            return { success: false, message: 'Неверный email или пароль.' };
          }
          const safeUser = { id: found.id, name: found.name, email: found.email, role: found.role };
          try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser)); } catch (_) {}
          return { success: true, user: safeUser };
        },
        async quickLogin(role = 'admin') {
          const raw = localStorage.getItem(USERS_KEY);
          const users = raw ? JSON.parse(raw) : defaultUsers;
          const found = users.find(u => u.role === role) || users[0];
          const safeUser = { id: found.id, name: found.name, email: found.email, role: found.role };
          try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser)); } catch (_) {}
          return { success: true, user: safeUser };
        },
        async register(name, email, password, confirmPassword) {
          if (!name || !email || !password) return { success: false, message: 'Заполните обязательные поля.' };
          if (password !== confirmPassword) return { success: false, message: 'Пароли не совпадают.' };
          const safeUser = { id: Date.now(), name, email, role: 'user' };
          try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser)); } catch (_) {}
          return { success: true, user: safeUser };
        },
        async resetPassword(email) {
          return { success: true, message: 'Инструкция отправлена на ' + email };
        },
        async logout() {
          try { localStorage.removeItem(CURRENT_USER_KEY); } catch (_) {}
          return { success: true };
        }
      };
    };

    const auth = (typeof window !== 'undefined' && typeof window.createAuthService === 'function' ? window.createAuthService() : null) || createFallbackAuth();
    const api = (typeof window !== 'undefined' && typeof window.createApiService === 'function' ? window.createApiService() : null);

    const currentUser = ref(auth ? auth.getCurrentUser() : null);

    const isAdmin = computed(() => currentUser.value && currentUser.value.role === 'admin');
    const isMaster = computed(() => currentUser.value && currentUser.value.role === 'master');
    const isStaff = computed(() => currentUser.value && (currentUser.value.role === 'master' || currentUser.value.role === 'admin'));
    const isClient = computed(() => currentUser.value && currentUser.value.role === 'user');
    const isGuest = computed(() => !currentUser.value);

    const userRoleBadge = computed(() => {
      if (!currentUser.value) return { text: 'Гость (Только просмотр)', role: 'guest', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
      if (currentUser.value.role === 'admin') return { text: 'Администратор', role: 'admin', color: 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-700' };
      if (currentUser.value.role === 'master') return { text: 'Мастер смены', role: 'master', color: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' };
      return { text: 'Клиент', role: 'user', color: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' };
    });

    const activeView = ref('site');  
    const adminTab = ref('overview');  
    const isMenuOpen = ref(false);
    const isWorkshopMenuOpen = ref(false);

    const isClientChatOpen = ref(false);
    const clientMessageInput = ref('');
    const isMasterTyping = ref(false);

    const appViews = [
      { id: 'site', label: 'Главная', badge: null, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'admin', label: 'Панель Voyager CRM', badge: null, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
    ];

    const internalViews = [
      { id: 'admin', label: 'Панель Voyager', badge: null, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
    ];

    const isMoreMenuOpen = ref(false);

    const navLinks = [
      { href: '#services', text: 'Услуги и цены' },
      { href: '#before-after', text: 'До и После' },
      { href: '#stepper', text: 'Калькулятор' },
      { href: '#products', text: 'Магазин' }
    ];

    const secondaryNavLinks = [
      { href: '#about', text: 'О мастере' },
      { href: '#pricing', text: 'Тарифные планы' },
      { href: '#faq', text: 'Вопрос-ответ (FAQ)' },
      { href: '#contact', text: 'Контакты' }
    ];

    const mobileNavLinks = [
      { href: '#services', text: 'Услуги и цены' },
      { href: '#before-after', text: 'До и После' },
      { href: '#stepper', text: 'Онлайн-калькулятор' },
      { href: '#products', text: 'Фирменный магазин' },
      { href: '#about', text: 'О мастере и работы' },
      { href: '#pricing', text: 'Тарифные планы' },
      { href: '#faq', text: 'Вопрос-ответ (FAQ)' }
    ];

    const switchView = (vId, tab = null) => {
      isMenuOpen.value = false;
      isWorkshopMenuOpen.value = false;

      if (vId === 'admin' || vId === 'kanban' || vId === 'overview' || vId === 'orders' || vId === 'design-system') {
        if (!isStaff.value) {
          activeView.value = 'site';
          return;
        }

        activeView.value = 'admin';
        if (vId === 'kanban') {
          adminTab.value = 'kanban';
        } else if (vId === 'design-system') {
          adminTab.value = 'design-system';
        } else if (tab) {
          if (tab === 'overview' && !isAdmin.value) {
            adminTab.value = 'orders';
          } else {
            adminTab.value = tab;
          }
        } else {
          adminTab.value = isAdmin.value ? 'overview' : 'orders';
        }
      } else if (vId === 'messenger') {
        if (isStaff.value) {
          activeView.value = 'admin';
          adminTab.value = 'chat';
        } else {
          openChat();
        }
      } else {
        activeView.value = 'site';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const navigateTo = (href) => {
      isMoreMenuOpen.value = false;
      isMenuOpen.value = false;
      if (activeView.value !== 'site') {
        activeView.value = 'site';
      }
      if (href && href.startsWith('#')) {
        setTimeout(() => {
          const el = document.querySelector(href);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      }
    };

    const openChat = () => {
      if (!currentUser.value) {
        openAuthModal('login', 'Для обращения к мастеру необходимо войти в систему или зарегистрироваться.');
        return;
      }
      if (isStaff.value) {
        switchView('admin', 'chat');
      } else {
        isClientChatOpen.value = true;
      }
    };

    const closeClientChat = () => {
      isClientChatOpen.value = false;
    };

    const openMenu = () => { isMenuOpen.value = true; };
    const closeMenu = () => { isMenuOpen.value = false; };
    const toggleMenu = () => { isMenuOpen.value = !isMenuOpen.value; };

     
     
     
    const isDarkMode = ref(false);

    const applyTheme = (dark) => {
      isDarkMode.value = dark;
      if (dark) {
        document.documentElement.classList.add('dark');
        try { localStorage.setItem('sneakfix_theme', 'dark'); } catch (_) {}
      } else {
        document.documentElement.classList.remove('dark');
        try { localStorage.setItem('sneakfix_theme', 'light'); } catch (_) {}
      }
    };

    const toggleDarkMode = () => {
      applyTheme(!isDarkMode.value);
    };

     
     
     
    const masterInfo = reactive({
      name: 'Иван Романов',
      role: 'Главный мастер-технолог SneakFix',
      avatar: 'img/master.jpg',
      bio: '11 лет опыта реставрации премиальной обуви. Сертифицированный специалист Saphir Medaille D\'Or. Спас более 4500 коллекционных пар.',
      badges: ['Ручная биочистка', 'Заводская колеровка', 'UV-отбеливание подошвы', 'Гарантия 30 дней'],
      stats: [
        { label: 'Пар отреставрировано', value: '4 500+' },
        { label: 'Лет ремесла', value: '11 лет' },
        { label: 'Средний срок', value: '48 часов' },
        { label: 'Рейтинг качества', value: '4.98 ★' }
      ]
    });

    const isFollowing = ref(false);
    const toggleFollow = () => {
      isFollowing.value = !isFollowing.value;
    };

    const galleryFilter = ref('all');
    const galleryWorks = ref([
      { id: 1, title: 'Air Jordan 1 High "Chicago"', category: 'jordan', categoryLabel: 'Jordan / Кожа', tag: 'Полная реставрация', complexity: 'Высокая', client: 'Влад Б.', desc: 'Выравнивание заломов мыска жидкой кожей, устранение глубоких царапин, восстановление заводского красного колера Varsity Red.', img: 'img/shoe-1.jpg', service: 'Реставрация кожи + Колеровка' },
      { id: 2, title: 'Adidas Yeezy Boost 350 V2 "Bone"', category: 'yeezy', categoryLabel: 'Yeezy / Текстиль', tag: 'Глубокая биочистка', complexity: 'Средняя', client: 'Мария К.', desc: 'Удаление въевшихся уличных масляных пятен, очистка шнурков и стелек озоном, UV-раскисление пожелтевшего баллона Boost.', img: 'img/shoe-2.jpg', service: 'Биочистка + Boost Whitening' },
      { id: 3, title: 'New Balance 2002R Grey Suede', category: 'suede', categoryLabel: 'Замша / Нубук', tag: 'Спа-уход замши', complexity: 'Высокая', client: 'Дмитрий С.', desc: 'Выведение солевых ореолов после зимы, латунное вычесывание бархатистого ворса, гидрофобная нано-пропитка на 90 дней.', img: 'img/shoe-3.jpg', service: 'Биочистка замши + Нано-барьер' },
      { id: 4, title: 'Balenciaga Triple S Multi', category: 'luxe', categoryLabel: 'Luxe / Сложные сетки', tag: 'Сложный деконструкт', complexity: 'Премиум', client: 'Артем Н.', desc: 'Ручная мойка многослойной подошвы, ультразвуковая чистка сетки, проклейка расслоившихся рантов.', img: 'img/shoe-4.jpg', service: 'Комплексный спа-уход Luxe' },
      { id: 5, title: 'Nike SB Dunk Low Pro', category: 'jordan', categoryLabel: 'Nike / Dunk', tag: 'Устранение заломов', complexity: 'Средняя', client: 'Татьяна Л.', desc: 'Внутреннее распаривание носовой части на колодках, нанесение матового финишного защитного лака против повторных трещин.', img: 'img/shoe-5.jpg', service: 'Антизалом + Защитный лак' },
      { id: 6, title: 'Asics GEL-Kahana 8 "Cream Teal"', category: 'suede', categoryLabel: 'Asics / Сетки', tag: 'Полировка кейджа', complexity: 'Средняя', client: 'Павел К.', desc: 'Очистка полимерного каркаса кейджа, ультразвуковая чистка сетчатых панелей, ручная мойка подошвы GEL.', img: 'img/shoe-6.jpg', service: 'Глубокая чистка + Полировка GEL' },
      { id: 7, title: 'Timberland 6-Inch Premium', category: 'suede', categoryLabel: 'Нубук / Ботинки', tag: 'Восстановление цвета', complexity: 'Высокая', client: 'Илья Ф.', desc: 'Глубокая экстракция дорожных реагентов, восстановление аутентичного рыжего оттенка Wheat, обработка водоотталкивающим воском.', img: 'img/shoe-7.jpg', service: 'Глубокая чистка нубука' },
      { id: 8, title: 'Rick Owens Geobasket', category: 'luxe', categoryLabel: 'Luxe / Bespoke', tag: 'Bespoke ремонт', complexity: 'Премиум', client: 'Роман В.', desc: 'Ручная перешивка рантов по контуру подошвы, перекраска молочной кожи в заводской тон Milk, замена бегунков молний Raccagni.', img: 'img/shoe-8.jpg', service: 'Реставрация рантов + Покраска' }
    ]);

    const filteredGalleryWorks = computed(() => {
      if (galleryFilter.value === 'all') return galleryWorks.value;
      return galleryWorks.value.filter(w => w.category === galleryFilter.value);
    });

    const activeGalleryItem = ref(null);
    const openGalleryModal = (item) => {
      activeGalleryItem.value = item;
      document.body.classList.add('modal-open');
    };
    const closeGalleryModal = () => {
      activeGalleryItem.value = null;
      document.body.classList.remove('modal-open');
    };

     
     
     
    const sliderRef = ref(null);
    const sliderPos = ref(50);
    const isDraggingSlider = ref(false);

    const beforeImgStyle = computed(() => ({
      clipPath: `inset(0 ${100 - sliderPos.value}% 0 0)`
    }));

    const dividerStyle = computed(() => ({
      left: `${sliderPos.value}%`
    }));

    const updateSliderPosition = (clientX) => {
      if (!sliderRef.value) return;
      const rect = sliderRef.value.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      sliderPos.value = Math.round((x / rect.width) * 1000) / 10;
    };

    const onSliderPointerDown = (event) => {
      isDraggingSlider.value = true;
      if (sliderRef.value && event.pointerId) {
        try { sliderRef.value.setPointerCapture(event.pointerId); } catch (_) {}
      }
      updateSliderPosition(event.clientX);
    };

    const onSliderPointerMove = (event) => {
      if (isDraggingSlider.value) {
        updateSliderPosition(event.clientX);
      }
    };

    const stopSliderDragging = (event) => {
      isDraggingSlider.value = false;
      if (sliderRef.value && event && event.pointerId) {
        try { sliderRef.value.releasePointerCapture(event.pointerId); } catch (_) {}
      }
    };

     
     
     
    const stepperStep = ref(1);
    const isStepperCompleted = ref(false);
    const stepperForm = reactive({
      name: '',
      phone: '',
      email: '',
      shoeBrand: 'Nike',
      shoeModel: '',
      shoeMaterial: 'leather',
      address: '',
      tariff: 'pro',
      soleWhitening: true,
      ozoneDeodorant: false
    });

    const stepperTotal = computed(() => {
      let sum = 0;
      if (stepperForm.tariff === 'basic') sum = 35;
      else if (stepperForm.tariff === 'pro') sum = 65;
      else if (stepperForm.tariff === 'enterprise') sum = 120;
      if (stepperForm.soleWhitening) sum += 15;
      if (stepperForm.ozoneDeodorant) sum += 10;
      return sum;
    });

    const nextStepperStep = () => {
      if (stepperStep.value === 1) {
        if (!stepperForm.name.trim() || !stepperForm.phone.trim()) {
          alert('Пожалуйста, укажите имя и телефон для связи.');
          return;
        }
      } else if (stepperStep.value === 2) {
        if (!stepperForm.shoeModel.trim()) {
          alert('Пожалуйста, укажите модель вашей обуви.');
          return;
        }
      }
      if (stepperStep.value < 4) stepperStep.value++;
    };

    const prevStepperStep = () => {
      if (stepperStep.value > 1) stepperStep.value--;
    };

    const finishStepperOrder = async () => {
      isStepperCompleted.value = true;
      const modelName = `${stepperForm.shoeBrand} ${stepperForm.shoeModel}`.trim() || 'Sneakers';
      const serviceName = `Тариф ${stepperForm.tariff.toUpperCase()} (${stepperForm.shoeMaterial})`;
       
      if (api) {
        await api.addRecord({
          model: modelName,
          client: stepperForm.name || 'Клиент',
          phone: stepperForm.phone || '+375 (29) 000-00-00',
          service: serviceName,
          price: stepperTotal.value,
          status: 'Ожидает'
        });
        await loadInitialTableData();
      }
       
      const newId = `SF-${Date.now().toString().slice(-3)}`;
      kanbanTasks.value.unshift({
        id: newId,
        title: modelName,
        tag: stepperForm.tariff.toUpperCase(),
        priority: 'Средний',
        priorityColor: 'badge-info',
        assignee: 'Мастер цеха',
        avatar: 'img/master.jpg',
        desc: `Заказ через калькулятор от ${stepperForm.name}. Материал: ${stepperForm.shoeMaterial}.`,
        status: 'todo',
        image: 'img/shoe-1.jpg'
      });
      saveKanbanTasks();
    };

    const resetStepper = () => {
      stepperStep.value = 1;
      isStepperCompleted.value = false;
      stepperForm.shoeModel = '';
      stepperForm.address = '';
    };

     
     
     
    const products = ref([
      { id: 1, name: 'SneakFix Bio Foam 150ml', price: 25, category: 'foam', categoryName: 'Пены и шампуни', rating: 4.9, reviewsCount: 88, tag: 'Хит продаж', desc: 'Органическая пена с нейтральным pH для безопасной чистки кожи, замши и сетки без использования воды.', img: 'img/product-foam.jpg' },
      { id: 2, name: 'Nano Protector Spray 250ml', price: 30, category: 'protection', categoryName: 'Влагозащита', rating: 5.0, reviewsCount: 112, tag: '90 дней стойкости', desc: 'Сверхстойкий гидрофобный барьер с эффектом лотоса против грязи, луж и солевых реагентов.', img: 'img/product-spray.jpg' },
      { id: 3, name: 'Premium Hog Bristle Brush', price: 18, category: 'brushes', categoryName: 'Щетки и аксессуары', rating: 4.8, reviewsCount: 46, tag: 'Мягкий ворс', desc: 'Ручная колодка из бука и натуральная кабанья щетина для бережного ухода за чувствительной замшей.', img: 'img/product-brush.jpg' },
      { id: 4, name: 'Saphir Leather Balm 75ml', price: 24, category: 'creams', categoryName: 'Кремы и воски', rating: 4.9, reviewsCount: 53, tag: 'Франция', desc: 'Питательный бальзам с пчелиным воском для восстановления эластичности и блеска гладкой кожи.', img: 'img/product-balm.jpg' },
      { id: 5, name: 'Anti-Odor Sport Ozone Spray', price: 16, category: 'deodorants', categoryName: 'Дезодоранты', rating: 4.7, reviewsCount: 39, tag: 'Антибактериальный', desc: 'Спрей с молекулами активного серебра. Нейтрализует причину запаха, не маскируя ее отдушкой.', img: 'img/product-deodorant.jpg' },
      { id: 6, name: 'Sneaker Repaint Dye Kit 50ml', price: 28, category: 'creams', categoryName: 'Кремы и краски', rating: 4.9, reviewsCount: 67, tag: 'Стойкий пигмент', desc: 'Специальный акриловый краситель с проникающим грунтом для восстановления цвета мысков и подошвы.', img: 'img/product-dye.jpg' }
    ]);

    const catalogSearch = ref('');
    const catalogCategory = ref('all');
    const catalogPriceMax = ref(60);
    const catalogSort = ref('popular');
    const isCatalogLoading = ref(false);
    const isMobileFilterDrawerOpen = ref(false);
    const catalogPage = ref(1);
    const catalogPageSize = ref(4);
    const cartCount = ref(0);

    const triggerCatalogFilter = () => {
      isCatalogLoading.value = true;
      catalogPage.value = 1;
      setTimeout(() => {
        isCatalogLoading.value = false;
      }, 150);
    };

    const resetCatalogFilters = () => {
      catalogSearch.value = '';
      catalogCategory.value = 'all';
      catalogPriceMax.value = 60;
      catalogSort.value = 'popular';
      triggerCatalogFilter();
    };

    const filteredCatalogProducts = computed(() => {
      let list = products.value.filter(p => {
        const matchesCategory = catalogCategory.value === 'all' || p.category === catalogCategory.value;
        const matchesPrice = p.price <= catalogPriceMax.value;
        const matchesSearch = !catalogSearch.value || p.name.toLowerCase().includes(catalogSearch.value.toLowerCase()) || p.desc.toLowerCase().includes(catalogSearch.value.toLowerCase());
        return matchesCategory && matchesPrice && matchesSearch;
      });

      if (catalogSort.value === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (catalogSort.value === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (catalogSort.value === 'rating') {
        list.sort((a, b) => b.rating - a.rating);
      }
      return list;
    });

    const catalogTotalPages = computed(() => Math.ceil(filteredCatalogProducts.value.length / catalogPageSize.value) || 1);

    const paginatedCatalogProducts = computed(() => {
      const start = (catalogPage.value - 1) * catalogPageSize.value;
      return filteredCatalogProducts.value.slice(start, start + catalogPageSize.value);
    });

    const addToCart = (prod) => {
      cartCount.value++;
      alert(`Товар "${prod.name}" успешно добавлен в корзину! (Всего позиций: ${cartCount.value})`);
    };

     
     
     
    const services = ref([
      {
        id: 'eco-cleaning',
        title: 'Комплексная биочистка',
        desc: 'Ручная чистка органической пеной, ультразвуковая обработка шнурков и дезодорация озоном.',
        price: 'от 35 BYN',
        badge: 'Базовый',
        iconSvg: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>'
      },
      {
        id: 'restoration',
        title: 'Реставрация и колеровка',
        desc: 'Устранение заломов жидкой кожей, точный подбор заводского оттенка и стойкий матовый финиш.',
        price: 'от 55 BYN',
        badge: 'Хит',
        iconSvg: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>'
      },
      {
        id: 'sole-whitening',
        title: 'Отбеливание Sole Bright',
        desc: 'Выведение желтизны и окисления подошвы в UV-камере. Возвращает заводскую белизну баллонам.',
        price: 'от 25 BYN',
        badge: 'Специальный',
        iconSvg: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
      }
    ]);

    const pricingPlans = ref([
      {
        id: 'basic',
        name: 'Basic Care',
        popular: false,
        price: '35 BYN',
        period: 'за пару',
        desc: 'Повседневная бережная чистка обуви из сетки и текстиля.',
        features: [
          { text: 'Ручная биочистка верха и подошвы', included: true },
          { text: 'Сушка при температуре 22°C', included: true },
          { text: 'Антибактериальное озонирование', included: true },
          { text: 'Устранение заломов и покраска', included: false },
          { text: 'Гидрофобный барьер на 90 дней', included: false }
        ]
      },
      {
        id: 'pro',
        name: 'Pro Restoration',
        popular: true,
        price: '65 BYN',
        period: 'за пару',
        desc: 'Глубокая чистка со снятием стелек и локальным восстановлением цвета.',
        features: [
          { text: 'Глубокая чистка верха, стелек, подошвы', included: true },
          { text: 'Деликатная сушка и озонирование', included: true },
          { text: 'Локальная реставрация заломов и царапин', included: true },
          { text: 'Гидрофобная нано-пропитка Saphir', included: true },
          { text: 'Фирменный пыльник SneakFix в подарок', included: true }
        ]
      },
      {
        id: 'enterprise',
        name: 'Luxe Bespoke',
        popular: false,
        price: '120 BYN',
        period: 'от 3-х пар',
        desc: 'Премиальный уход для коллекционных релизов и изделий из кожи.',
        features: [
          { text: 'Полная ручная реставрация жидкой кожей', included: true },
          { text: 'Заводская колеровка по оригинальному коду', included: true },
          { text: 'Проклейка рантов полиуретановым клеем', included: true },
          { text: 'Бесплатный экспресс-курьер в обе стороны', included: true },
          { text: 'Персональная гарантия мастера 6 месяцев', included: true }
        ]
      }
    ]);

     
     
     
    const testimonials = ref([
      { id: 1, name: 'Максим Козлов', role: 'Сникерхед', model: 'Air Jordan 1 Retro', text: 'Спас мои любимые Чикаго после осеннего рейва. Думал заломы на носке уже не выпрямить, но мастер сделал заводскую гладкость!', avatar: 'img/avatar-1.jpg' },
      { id: 2, name: 'Екатерина В.', role: 'Стилист', model: 'Yeezy Boost 350', text: 'Желтизна с баллонов исчезла полностью в их UV-камере. Обувь выглядит как только что из магазина. Курьер приехал ровно в назначенное время.', avatar: 'img/avatar-2.jpg' },
      { id: 3, name: 'Артем Мельников', role: 'Дизайнер', model: 'New Balance 990v3', text: 'Замша на 990-х была забита солью и задубела. После SneakFix ворс снова мягкий и бархатистый. Очень ценю такое ремесленное отношение к вещам.', avatar: 'img/avatar-3.jpg' }
    ]);

    const faqItems = ref([
      { q: 'Сколько времени занимает стандартная чистка пары?', a: 'Стандартный цикл чистки и деликатной сушки при комнатной температуре 22°C занимает ровно 48 часов с момента забора пары курьером.' },
      { q: 'Безопасна ли химия для чувствительных материалов?', a: 'Мы используем премиальные французские составы Saphir Medaille D\'Or и органическую пену SneakFix Bio Foam с нейтральным pH без хлора и растворителей.' },
      { q: 'Как работает бесплатный забор курьером по Минску?', a: 'Курьер приезжает в удобный 2-часовой интервал с фирменными пыльниками, фиксирует текущее состояние обуви и оставляет вам квитанцию с QR-кодом заказа.' },
      { q: 'Предоставляется ли гарантия на выполненные работы?', a: 'Да, на все реставрационные работы, проклейку подошвы и покраску мы даем официальную гарантию мастерской сроком 30 календарных дней.' }
    ]);

     
     
     
    const tableData = ref([]);
    const isTableLoading = ref(false);
    const searchQuery = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const lazyLimit = ref(10);
    const viewMode = ref('pagination');

    const isExcelDragging = ref(false);
    const excelInputRef = ref(null);
    const isUploadingExcel = ref(false);
    const uploadedExcelInfo = ref(null);
    const isErrorModalOpen = ref(false);
    const errorMessage = ref('');

    const loadInitialTableData = async () => {
      isTableLoading.value = true;
      try {
        if (api) {
          tableData.value = await api.getTableData();
          uploadedExcelInfo.value = await api.getUploadedFile();
        }
      } finally {
        isTableLoading.value = false;
      }
    };

    const triggerExcelPicker = () => {
      if (!isStaff.value) {
        showErrorModal('Пакетная передача партий обуви через Excel доступна только сотрудникам мастерской (мастеру или администратору). Пожалуйста, авторизуйтесь.');
        return;
      }
      if (excelInputRef.value) excelInputRef.value.click();
    };

    const closeErrorModal = () => {
      isErrorModalOpen.value = false;
      errorMessage.value = '';
    };

    const showErrorModal = (msg) => {
      errorMessage.value = msg;
      isErrorModalOpen.value = true;
    };

    const processExcelFile = async (file) => {
      if (!file) return;
      if (!isStaff.value) {
        showErrorModal('Пакетная передача партий обуви через Excel доступна только сотрудникам мастерской (мастеру или администратору). Пожалуйста, авторизуйтесь.');
        return;
      }
      if (api) {
        const val = api.validateFile(file);
        if (!val.valid) {
          showErrorModal(val.message);
          return;
        }
      }

      isUploadingExcel.value = true;
      try {
        if (api) {
          const parsed = await api.parseExcel(file, window.XLSX);
          if (parsed.length > 0) {
            tableData.value = parsed;
            await api.saveTableData(parsed);
          }
          const info = {
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} КБ`,
            date: new Date().toLocaleString('ru-RU'),
            rowCount: parsed.length
          };
          uploadedExcelInfo.value = info;
          await api.saveFile(info);
        }
      } catch (err) {
        showErrorModal(err.message || 'Ошибка чтения файла Excel.');
      } finally {
        isUploadingExcel.value = false;
        if (excelInputRef.value) excelInputRef.value.value = '';
      }
    };

    const onExcelFileSelect = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) processExcelFile(file);
    };

    const onExcelDrop = (e) => {
      isExcelDragging.value = false;
      if (!isMaster.value) {
        showErrorModal('Пакетная передача партий обуви через Excel доступна только сотрудникам мастерской (мастеру или администратору). Пожалуйста, авторизуйтесь.');
        return;
      }
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) processExcelFile(file);
    };

    const clearUploadedExcel = async () => {
      if (confirm('Удалить информацию о загруженном файле Excel?')) {
        if (api) await api.deleteUploadedFile();
        uploadedExcelInfo.value = null;
      }
    };

    const resetToDefaultSeed = async () => {
      if (confirm('Сбросить таблицу заказов к исходным демо-данным?')) {
        try { localStorage.removeItem('sneakfix_orders_v1'); } catch (_) {}
        await loadInitialTableData();
      }
    };

     
    const filteredTableData = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      if (!q) return tableData.value;
      return tableData.value.filter(r =>
        String(r.id || '').toLowerCase().includes(q) ||
        String(r.model || '').toLowerCase().includes(q) ||
        String(r.client || '').toLowerCase().includes(q) ||
        String(r.phone || '').toLowerCase().includes(q) ||
        String(r.service || '').toLowerCase().includes(q) ||
        String(r.status || '').toLowerCase().includes(q)
      );
    });

    const totalPages = computed(() => Math.ceil(filteredTableData.value.length / pageSize.value) || 1);

    const displayedRows = computed(() => {
      if (viewMode.value === 'pagination') {
        const start = (currentPage.value - 1) * pageSize.value;
        return filteredTableData.value.slice(start, start + pageSize.value);
      } else {
        return filteredTableData.value.slice(0, lazyLimit.value);
      }
    });

    const canLoadMoreLazy = computed(() => lazyLimit.value < filteredTableData.value.length);
    const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
    const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
    const loadMoreLazy = () => { lazyLimit.value += 10; };
    const setViewMode = (mode) => {
      viewMode.value = mode;
      currentPage.value = 1;
      lazyLimit.value = 10;
    };

     
     
     
    const isCrudModalOpen = ref(false);
    const crudMode = ref('add');
    const crudError = ref('');
    const crudForm = reactive({
      id: null,
      model: '',
      client: '',
      phone: '+375 (29) ',
      service: 'Глубокая эко-чистка',
      price: 45,
      status: 'В работе'
    });

    const openAddModal = () => {
      if (!isStaff.value) {
        alert('Регистрация и добавление заказов в реестр доступно только мастеру или администратору.');
        openAuthModal('login');
        return;
      }
      crudMode.value = 'add';
      crudError.value = '';
      crudForm.id = null;
      crudForm.model = '';
      crudForm.client = '';
      crudForm.phone = '+375 (29) ';
      crudForm.service = 'Глубокая эко-чистка';
      crudForm.price = 45;
      crudForm.status = 'В работе';
      isCrudModalOpen.value = true;
      document.body.classList.add('modal-open');
    };

    const openEditModal = (row) => {
      if (!isStaff.value) {
        alert('Редактирование заказов доступно только мастеру или администратору.');
        openAuthModal('login');
        return;
      }
      crudMode.value = 'edit';
      crudError.value = '';
      crudForm.id = row.id;
      crudForm.model = row.model;
      crudForm.client = row.client;
      crudForm.phone = row.phone;
      crudForm.service = row.service;
      crudForm.price = row.price;
      crudForm.status = row.status;
      isCrudModalOpen.value = true;
      document.body.classList.add('modal-open');
    };

    const closeCrudModal = () => {
      isCrudModalOpen.value = false;
      crudError.value = '';
      document.body.classList.remove('modal-open');
    };

    const saveCrudItem = async () => {
      if (!crudForm.model.trim() || !crudForm.client.trim()) {
        crudError.value = 'Пожалуйста, заполните название модели и имя клиента.';
        return;
      }
      if (api) {
        if (crudMode.value === 'add') {
          await api.addRecord(crudForm);
           
          const newId = `SF-${Date.now().toString().slice(-3)}`;
          kanbanTasks.value.unshift({
            id: newId,
            title: crudForm.model,
            tag: crudForm.service || 'Реставрация',
            priority: 'Высокий',
            priorityColor: 'badge-warning',
            assignee: 'Иван Р.',
            avatar: 'img/master.jpg',
            desc: `Клиент: ${crudForm.client} (${crudForm.phone}). Стоимость: ${crudForm.price} BYN`,
            status: 'todo',
            image: 'img/shoe-3.jpg'
          });
          saveKanbanTasks();
        } else {
          await api.updateRecord(crudForm.id, crudForm);
        }
        await loadInitialTableData();
      }
      closeCrudModal();
    };

    const deleteRow = async (id) => {
      if (!isAdmin.value) {
        alert('Удаление заказов из базы данных разрешено исключительно Администратору.');
        if (!currentUser.value) openAuthModal('login');
        return;
      }
      if (confirm(`Вы уверены, что хотите удалить заказ #${id}?`)) {
        if (api) {
          await api.deleteRecord(id);
          await loadInitialTableData();
        }
      }
    };

     
     
     
    const isAuthModalOpen = ref(false);
    const authTab = ref('login');
    const authLoading = ref(false);
    const authError = ref('');
    const authSuccess = ref('');
    const termsAccepted = ref(true);

    const authForm = reactive({
      name: '',
      email: 'client@sneakfix.by',
      password: 'client123',
      confirmPassword: ''
    });

    const openAuthModal = (tab = 'login', message = '') => {
      authTab.value = tab;
      authError.value = message;
      authSuccess.value = '';
      isAuthModalOpen.value = true;
      document.body.classList.add('modal-open');
    };

    const closeAuthModal = () => {
      isAuthModalOpen.value = false;
      authError.value = '';
      authSuccess.value = '';
      document.body.classList.remove('modal-open');
    };

    const passwordStrength = computed(() => {
      const p = authForm.password || '';
      if (!p) return 0;
      let score = 0;
      if (p.length >= 6) score++;
      if (p.length >= 8) score++;
      if (/[0-9]/.test(p)) score++;
      if (/[^A-Za-z0-9]/.test(p) || /[A-Z]/.test(p)) score++;
      return score;
    });

    const handleLogin = async () => {
      authError.value = '';
      authSuccess.value = '';
      authLoading.value = true;
      try {
        const res = await auth.login(authForm.email, authForm.password);
        if (res.success) {
          currentUser.value = res.user;
          authSuccess.value = `Добро пожаловать, ${res.user.name}!`;
          setTimeout(() => {
            closeAuthModal();
            if (res.user.role === 'admin') {
              switchView('admin', 'overview');
            } else if (res.user.role === 'master') {
              switchView('admin', 'orders');
            } else {
              activeView.value = 'site';
            }
          }, 500);
        } else {
          authError.value = res.message;
        }
      } catch (err) {
        authError.value = err.message || 'Ошибка авторизации';
      } finally {
        authLoading.value = false;
      }
    };

    const handleQuickLogin = async (role) => {
      authError.value = '';
      authSuccess.value = '';
      authLoading.value = true;
      try {
        const res = await auth.quickLogin(role);
        if (res.success) {
          currentUser.value = res.user;
          const roleTitle = res.user.role === 'admin' ? 'Администратор' : (res.user.role === 'master' ? 'Мастер' : 'Клиент');
          authSuccess.value = `Вход выполнен: ${res.user.name} (${roleTitle})`;
          setTimeout(() => {
            closeAuthModal();
            if (res.user.role === 'admin') {
              switchView('admin', 'overview');
            } else if (res.user.role === 'master') {
              switchView('admin', 'orders');
            } else {
              activeView.value = 'site';
            }
          }, 400);
        }
      } catch (err) {
        authError.value = err.message || 'Ошибка быстрого входа';
      } finally {
        authLoading.value = false;
      }
    };

    const handleRegister = async () => {
      authError.value = '';
      authSuccess.value = '';
      authLoading.value = true;
      try {
        const res = await auth.register(authForm.name, authForm.email, authForm.password, authForm.confirmPassword);
        if (res.success) {
          currentUser.value = res.user;
          authSuccess.value = 'Регистрация прошла успешно!';
          setTimeout(() => {
            closeAuthModal();
            activeView.value = 'site';
          }, 500);
        } else {
          authError.value = res.message;
        }
      } catch (err) {
        authError.value = err.message || 'Ошибка регистрации';
      } finally {
        authLoading.value = false;
      }
    };

    const handleReset = async () => {
      authError.value = '';
      authSuccess.value = '';
      authLoading.value = true;
      try {
        const res = await auth.resetPassword(authForm.email);
        if (res.success) authSuccess.value = res.message;
        else authError.value = res.message;
      } catch (err) {
        authError.value = err.message || 'Ошибка запроса';
      } finally {
        authLoading.value = false;
      }
    };

    const handleLogout = async () => {
      if (auth) await auth.logout();
      currentUser.value = null;
      isClientChatOpen.value = false;
      if (activeView.value === 'admin') activeView.value = 'site';
    };

    const dialogues = ref([
      {
        id: 1,
        name: 'Алексей Клиент (Air Jordan 1 Chicago)',
        clientName: 'Алексей Клиент',
        shoeModel: 'Air Jordan 1 Retro High Chicago',
        avatar: 'img/avatar-1.jpg',
        online: true,
        unread: 1,
        messages: [
          { id: 1, sender: 'master', text: 'Здравствуйте! Осмотрел ваши Jordan 1. Глубокий залом уберем жидкой кожей, колер уже замешал по каталогу Nike.', time: '11:20' },
          { id: 2, sender: 'client', text: 'Отлично! А сколько времени займет сушка после нанесения финишного слоя?', time: '11:24' },
          { id: 3, sender: 'master', text: 'По технологии ровно 12 часов при комнатной температуре. Завтра к 15:00 курьер сможет доставить.', time: '11:25' }
        ]
      },
      {
        id: 2,
        name: 'Максим Козлов (Yeezy 350 Bone)',
        clientName: 'Максим Козлов',
        shoeModel: 'Adidas Yeezy Boost 350 V2 Bone',
        avatar: 'img/avatar-2.jpg',
        online: true,
        unread: 0,
        messages: [
          { id: 1, sender: 'client', text: 'Добрый день, желтизна с прозрачного баллона Yeezy полностью сойдет?', time: 'Вчера' },
          { id: 2, sender: 'master', text: 'Да, после 4-часовой оксидации в ультрафиолетовой камере подошва вернет исходный молочный цвет.', time: 'Вчера' }
        ]
      },
      {
        id: 3,
        name: 'Екатерина В. (New Balance 990v3)',
        clientName: 'Екатерина В.',
        shoeModel: 'New Balance 990v3 Grey Suede',
        avatar: 'img/avatar-3.jpg',
        online: false,
        unread: 0,
        messages: [
          { id: 1, sender: 'client', text: 'Здравствуйте, замша после дождя стала грубой, получится поднять ворс?', time: '10.11' },
          { id: 2, sender: 'master', text: 'Здравствуйте! Конечно, используем деликатную паровую ванну и латунные щетки с эмульсией Saphir.', time: '10.11' }
        ]
      }
    ]);

    const activeDialogueId = ref(1);
    const chatSearchQuery = ref('');
    const messageInput = ref('');

    const clientDialogue = computed(() => dialogues.value[0]);

    const currentDialogue = computed(() => {
      return dialogues.value.find(d => d.id === activeDialogueId.value) || dialogues.value[0];
    });

    const filteredDialogues = computed(() => {
      const q = chatSearchQuery.value.trim().toLowerCase();
      if (!q) return dialogues.value;
      return dialogues.value.filter(d => d.name.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q));
    });

    const selectDialogue = (id) => {
      activeDialogueId.value = id;
      const d = dialogues.value.find(item => item.id === id);
      if (d) d.unread = 0;
    };

    const sendMessage = () => {
      const text = messageInput.value.trim();
      if (!text) return;
      currentDialogue.value.messages.push({
        id: Date.now(),
        sender: 'master',
        text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      });
      messageInput.value = '';
    };

    const sendClientMessage = (customText = null) => {
      const text = (typeof customText === 'string' ? customText : clientMessageInput.value).trim();
      if (!text) return;
      clientDialogue.value.messages.push({
        id: Date.now(),
        sender: 'client',
        text,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      });
      if (!customText) clientMessageInput.value = '';

      isMasterTyping.value = true;
      setTimeout(() => {
        isMasterTyping.value = false;
        let reply = 'Принял ваш запрос! Изучаю детали, сейчас сориентирую по срокам и материалам.';
        const lower = text.toLowerCase();
        if (lower.includes('замш')) {
          reply = 'Для замши рекомендуем деликатную биочистку с поднятием ворса латунной щеткой и водоотталкивающим нано-бальзамом (от 50 BYN).';
        } else if (lower.includes('курьер') || lower.includes('доставк')) {
          reply = 'Курьер забирает обувь по Минску бесплатно при заказе комплекса услуг. Укажите удобный адрес и время!';
        } else if (lower.includes('желтизн') || lower.includes('подошв') || lower.includes('отбеливан')) {
          reply = 'Желтизну с подошвы выводим в ультрафиолетовой камере с активным оксидантом. Подошва возвращает заводской белоснежный цвет.';
        }
        clientDialogue.value.messages.push({
          id: Date.now() + 1,
          sender: 'master',
          text: reply,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
      }, 1000);
    };

    const sendQuickClientMessage = (text) => {
      sendClientMessage(text);
    };

     
     
     
    const KANBAN_STORAGE_KEY = 'sneakfix_kanban_tasks_v3';

    const defaultKanbanTasks = [
      { id: 'SF-101', title: 'Air Jordan 1 High Chicago', tag: 'Реставрация', priority: 'Высокий', priorityColor: 'badge-danger', assignee: 'Иван Р.', avatar: 'img/master.jpg', desc: 'Устранение залома мыска и колеровка кожи Varsity Red', status: 'done', image: 'img/shoe-1.jpg' },
      { id: 'SF-102', title: 'Adidas Yeezy Boost 350 V2 Bone', tag: 'UV-камера', priority: 'Средний', priorityColor: 'badge-warning', assignee: 'Артем С.', avatar: 'img/avatar-1.jpg', desc: 'Раскисление пожелтевшего баллона и эко-чистка верха', status: 'in_progress', image: 'img/shoe-2.jpg' },
      { id: 'SF-103', title: 'New Balance 2002R Grey Suede', tag: 'Замша', priority: 'Обычный', priorityColor: 'badge-info', assignee: 'Иван Р.', avatar: 'img/master.jpg', desc: 'Выведение реагентов и поднятие ворса латунной щеткой', status: 'todo', image: 'img/shoe-3.jpg' },
      { id: 'SF-104', title: 'Balenciaga Triple S Multi', tag: 'Спа Luxe', priority: 'Высокий', priorityColor: 'badge-danger', assignee: 'Артем С.', avatar: 'img/avatar-3.jpg', desc: 'Проклейка многослойной подошвы полиуретановым клеем', status: 'in_progress', image: 'img/shoe-4.jpg' },
      { id: 'SF-105', title: 'Nike SB Dunk Low Pro', tag: 'Антизалом', priority: 'Обычный', priorityColor: 'badge-info', assignee: 'Иван Р.', avatar: 'img/master.jpg', desc: 'Распаривание носовой части на колодках с финишным лаком', status: 'done', image: 'img/shoe-5.jpg' },
      { id: 'SF-106', title: 'Timberland 6-Inch Premium', tag: 'Нубук', priority: 'Средний', priorityColor: 'badge-warning', assignee: 'Иван Р.', avatar: 'img/master.jpg', desc: 'Нанесение гидрофобной нано-защиты на 90 дней', status: 'todo', image: 'img/shoe-7.jpg' }
    ];

    const kanbanTasks = ref([]);

    const saveKanbanTasks = () => {
      try {
        localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(kanbanTasks.value));
      } catch (e) {
        console.error('Failed to save kanban tasks to localStorage', e);
      }
    };

    const loadKanbanTasks = () => {
      try {
        const raw = localStorage.getItem(KANBAN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            kanbanTasks.value = parsed;
            return;
          }
        }
      } catch (e) {}
      kanbanTasks.value = JSON.parse(JSON.stringify(defaultKanbanTasks));
      saveKanbanTasks();
    };

     
    loadKanbanTasks();

    const kanbanColumns = computed(() => [
      { id: 'todo', title: 'В очереди (To Do)', dotColor: 'bg-slate-400', tasks: kanbanTasks.value.filter(t => t.status === 'todo') },
      { id: 'in_progress', title: 'В работе (In Progress)', dotColor: 'bg-indigo-500', tasks: kanbanTasks.value.filter(t => t.status === 'in_progress') },
      { id: 'done', title: 'Готово к выдаче (Done)', dotColor: 'bg-emerald-500', tasks: kanbanTasks.value.filter(t => t.status === 'done') }
    ]);

    const moveKanbanTask = (taskId, targetStatus) => {
      const task = kanbanTasks.value.find(t => t.id === taskId);
      if (task) {
        task.status = targetStatus;
        saveKanbanTasks();
      }
    };

     
    const draggedTaskId = ref(null);
    const dragOverColId = ref(null);

    const onKanbanDragStart = (event, task) => {
      draggedTaskId.value = task.id;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', task.id);
      }
    };

    const onKanbanDragOver = (event, colId) => {
      event.preventDefault();
      dragOverColId.value = colId;
    };

    const onKanbanDragLeave = (event, colId) => {
      if (dragOverColId.value === colId) {
        dragOverColId.value = null;
      }
    };

    const onKanbanDrop = (event, colId) => {
      event.preventDefault();
      dragOverColId.value = null;
      const taskId = draggedTaskId.value || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : null);
      if (!taskId) return;
      const task = kanbanTasks.value.find(t => t.id === taskId);
      if (task) {
        task.status = colId;
        saveKanbanTasks();
      }
      draggedTaskId.value = null;
    };

    const onKanbanCardDrop = (event, targetTaskId, targetColId) => {
      event.preventDefault();
      event.stopPropagation();
      dragOverColId.value = null;
      const sourceId = draggedTaskId.value;
      if (!sourceId || sourceId === targetTaskId) return;

      const sourceIdx = kanbanTasks.value.findIndex(t => t.id === sourceId);
      const targetIdx = kanbanTasks.value.findIndex(t => t.id === targetTaskId);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const item = kanbanTasks.value.splice(sourceIdx, 1)[0];
        item.status = targetColId;
        const newTargetIdx = kanbanTasks.value.findIndex(t => t.id === targetTaskId);
        kanbanTasks.value.splice(newTargetIdx >= 0 ? newTargetIdx : kanbanTasks.value.length, 0, item);
        saveKanbanTasks();
      }
      draggedTaskId.value = null;
    };

    const resetKanbanTasks = () => {
      kanbanTasks.value = JSON.parse(JSON.stringify(defaultKanbanTasks));
      saveKanbanTasks();
    };

     
     
     
    const analyticsStats = ref([
      { title: 'Выручка за ноябрь', value: '8 460 BYN', change: '+14.2%', trend: 'up', hint: 'по сравнению с прошлым месяцем' },
      { title: 'Принято пар в работу', value: '184 пары', change: '+8.5%', trend: 'up', hint: 'в среднем 6 пар в сутки' },
      { title: 'Средний чек заказа', value: '62.5 BYN', change: '+3.1%', trend: 'up', hint: 'рост за счет доп. опций' },
      { title: 'Срок выполнения', value: '44 часа', change: '-4.0%', trend: 'up', hint: 'быстрее целевых 48 часов' }
    ]);

    const chartBars = ref([
      { label: 'Пн', height: '60%', val: '24 пары', color: 'bg-indigo-400' },
      { label: 'Вт', height: '75%', val: '31 пара', color: 'bg-indigo-500' },
      { label: 'Ср', height: '90%', val: '38 пар', color: 'bg-brand-600' },
      { label: 'Чт', height: '65%', val: '26 пар', color: 'bg-indigo-400' },
      { label: 'Пт', height: '100%', val: '44 пары', color: 'bg-brand-500' },
      { label: 'Сб', height: '85%', val: '36 пар', color: 'bg-indigo-500' },
      { label: 'Вс', height: '50%', val: '20 пар', color: 'bg-indigo-300' }
    ]);

    const transactions = ref([
      { id: 'TX-901', client: 'Алексей Иванов', model: 'Air Jordan 1 High', service: 'Реставрация кожи', amount: '95 BYN', status: 'Оплачено', statusClass: 'badge-success', date: '16.11.2026 11:30' },
      { id: 'TX-902', client: 'Мария Ковалева', model: 'Yeezy Boost 350', service: 'UV отбеливание', amount: '65 BYN', status: 'В обработке', statusClass: 'badge-warning', date: '16.11.2026 10:15' },
      { id: 'TX-903', client: 'Дмитрий Смирнов', model: 'New Balance 990v3', service: 'Спа-уход замши', amount: '70 BYN', status: 'Оплачено', statusClass: 'badge-success', date: '15.11.2026 18:40' },
      { id: 'TX-904', client: 'Владислав Белов', model: 'Balenciaga Triple S', service: 'Комплекс Luxe', amount: '120 BYN', status: 'Оплачено', statusClass: 'badge-success', date: '15.11.2026 15:20' },
      { id: 'TX-905', client: 'Елена Мороз', model: 'Converse Chuck 70', service: 'Биочистка текстиля', amount: '35 BYN', status: 'Оплачено', statusClass: 'badge-success', date: '14.11.2026 12:10' }
    ]);

    const transactionSearch = ref('');
    const transactionFilter = ref('Все');

    const filteredTransactions = computed(() => {
      return transactions.value.filter(t => {
        const matchesStatus = transactionFilter.value === 'Все' || t.status === transactionFilter.value;
        const q = transactionSearch.value.trim().toLowerCase();
        const matchesSearch = !q || t.client.toLowerCase().includes(q) || t.model.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      });
    });

     
     
     
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        if (isErrorModalOpen.value) closeErrorModal();
        if (isAuthModalOpen.value) closeAuthModal();
        if (isCrudModalOpen.value) closeCrudModal();
        if (activeGalleryItem.value) closeGalleryModal();
        if (isMenuOpen.value) closeMenu();
        if (isMobileFilterDrawerOpen.value) isMobileFilterDrawerOpen.value = false;
      }
    };

    onMounted(async () => {
      window.addEventListener('keydown', handleKeydown);
      
       
      try {
        const savedTheme = localStorage.getItem('sneakfix_theme');
        if (savedTheme === 'dark') applyTheme(true);
      } catch (_) {}

       
      loadKanbanTasks();

       
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('role')) {
          await auth.quickLogin(urlParams.get('role'));
          currentUser.value = auth.getCurrentUser();
        }
        if (urlParams.has('view')) {
          switchView(urlParams.get('view'), urlParams.get('tab') || 'overview');
        }
        if (urlParams.has('chat')) {
          openChat();
        }
      } catch (_) {}

      await loadInitialTableData();
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown);
    });

     
    return {
      activeView,
      adminTab,
      switchView,
      appViews,
      internalViews,
      navLinks,
      secondaryNavLinks,
      isMoreMenuOpen,
      mobileNavLinks,
      isMenuOpen,
      isWorkshopMenuOpen,
      openMenu,
      closeMenu,
      toggleMenu,

       
      isAdmin,
      isMaster,
      isStaff,
      isClient,
      isGuest,
      userRoleBadge,
      navigateTo,
      openChat,
      isClientChatOpen,
      clientDialogue,
      clientMessageInput,
      isMasterTyping,
      closeClientChat,
      sendClientMessage,
      sendQuickClientMessage,
      handleQuickLogin,

      isDarkMode,
      toggleDarkMode,

      masterInfo,
      isFollowing,
      toggleFollow,
      galleryFilter,
      galleryWorks,
      filteredGalleryWorks,
      activeGalleryItem,
      openGalleryModal,
      closeGalleryModal,

      sliderRef,
      sliderPos,
      beforeImgStyle,
      dividerStyle,
      onSliderPointerDown,
      onSliderPointerMove,
      stopSliderDragging,

      stepperStep,
      isStepperCompleted,
      stepperForm,
      stepperTotal,
      nextStepperStep,
      prevStepperStep,
      finishStepperOrder,
      resetStepper,

      products,
      catalogSearch,
      catalogCategory,
      catalogPriceMax,
      catalogSort,
      isCatalogLoading,
      isMobileFilterDrawerOpen,
      catalogPage,
      catalogTotalPages,
      paginatedCatalogProducts,
      cartCount,
      triggerCatalogFilter,
      resetCatalogFilters,
      addToCart,

      services,
      pricingPlans,
      testimonials,
      faqItems,

      tableData,
      isTableLoading,
      searchQuery,
      currentPage,
      pageSize,
      lazyLimit,
      viewMode,
      filteredTableData,
      totalPages,
      displayedRows,
      canLoadMoreLazy,
      nextPage,
      prevPage,
      loadMoreLazy,
      setViewMode,

      isExcelDragging,
      excelInputRef,
      isUploadingExcel,
      uploadedExcelInfo,
      isErrorModalOpen,
      errorMessage,
      triggerExcelPicker,
      closeErrorModal,
      onExcelFileSelect,
      onExcelDrop,
      clearUploadedExcel,
      resetToDefaultSeed,

      isCrudModalOpen,
      crudMode,
      crudError,
      crudForm,
      openAddModal,
      openEditModal,
      closeCrudModal,
      saveCrudItem,
      deleteRow,

      currentUser,
      isAuthModalOpen,
      authTab,
      authLoading,
      authError,
      authSuccess,
      termsAccepted,
      authForm,
      openAuthModal,
      closeAuthModal,
      passwordStrength,
      handleLogin,
      handleRegister,
      handleReset,
      handleLogout,

      dialogues,
      activeDialogueId,
      chatSearchQuery,
      messageInput,
      currentDialogue,
      filteredDialogues,
      selectDialogue,
      sendMessage,

      kanbanTasks,
      kanbanColumns,
      moveKanbanTask,
      draggedTaskId,
      dragOverColId,
      onKanbanDragStart,
      onKanbanDragOver,
      onKanbanDragLeave,
      onKanbanDrop,
      onKanbanCardDrop,
      resetKanbanTasks,

      analyticsStats,
      chartBars,
      transactions,
      transactionSearch,
      transactionFilter,
      filteredTransactions
    };
  }
});

app.component('ad-slot', {
  props: {
    size: {
      type: String,
      default: 'banner'
    },
    width: {
      type: String,
      default: ''
    },
    height: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: 'Рекламное место'
    }
  },
  computed: {
    slotClasses() {
      if (this.size === 'banner') return 'w-full h-24 sm:h-28';
      if (this.size === 'sidebar') return 'w-full h-64';
      if (this.size === 'rectangle') return 'w-72 sm:w-80 h-60';
      return '';
    },
    slotStyle() {
      const style = {};
      if (this.width) style.width = this.width;
      if (this.height) style.height = this.height;
      return style;
    }
  },
  template: `
    <div
      class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 transition-colors select-none group"
      :class="slotClasses"
      :style="slotStyle"
    >
      <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500">
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
        <span class="text-xs font-mono uppercase tracking-wider font-semibold">{{ label }}</span>
      </div>
      <p class="text-[10px] text-slate-400/80 mt-1">Партнерский рекламный блок (Формат: {{ size }})</p>
    </div>
  `
});

app.mount('#app');

