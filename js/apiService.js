 

const SEED_DATA = [
  { id: 101, model: 'Nike Air Jordan 1 Retro High Chicago', client: 'Алексей Иванов', phone: '+375 (29) 111-22-33', service: 'Реставрация и колеровка кожи', price: 95, status: 'Готово', date: '12.11.2026' },
  { id: 102, model: 'Adidas Yeezy Boost 350 V2 Bone', client: 'Мария Ковалева', phone: '+375 (33) 222-33-44', service: 'Глубокая биочистка + UV отбеливание', price: 65, status: 'В работе', date: '13.11.2026' },
  { id: 103, model: 'New Balance 990v3 Made in USA', client: 'Дмитрий Смирнов', phone: '+375 (44) 333-44-55', service: 'Восстановление ворса замши и чистка', price: 70, status: 'Ожидает', date: '14.11.2026' },
  { id: 104, model: 'Balenciaga Triple S White', client: 'Владислав Белов', phone: '+375 (29) 444-55-66', service: 'Комплексный спа-уход Luxe', price: 120, status: 'В работе', date: '14.11.2026' },
  { id: 105, model: 'Converse Chuck 70 Parchment', client: 'Елена Мороз', phone: '+375 (25) 555-66-77', service: 'Ручная биочистка текстиля', price: 35, status: 'Готово', date: '15.11.2026' },
  { id: 106, model: 'Timberland 6-Inch Premium Boot', client: 'Артем Новиков', phone: '+375 (29) 666-77-88', service: 'Чистка нубука и гидрофобная защита', price: 80, status: 'Готово', date: '15.11.2026' },
  { id: 107, model: 'Puma Suede Classic XXI Navy', client: 'Ольга Соколова', phone: '+375 (33) 777-88-99', service: 'Комплекс чистки и поднятие ворса', price: 50, status: 'Ожидает', date: '15.11.2026' },
  { id: 108, model: 'Asics Gel-Kayano 14 Silver Cream', client: 'Павел Кузнецов', phone: '+375 (44) 888-99-00', service: 'Деликатная мойка сетки и подошвы', price: 45, status: 'В работе', date: '16.11.2026' },
  { id: 109, model: 'Nike Dunk Low Retro Panda', client: 'Татьяна Лебедева', phone: '+375 (29) 999-00-11', service: 'Устранение заломов и подкраска мыска', price: 60, status: 'Готово', date: '16.11.2026' },
  { id: 110, model: 'Salomon XT-6 Gore-Tex Black', client: 'Илья Федоров', phone: '+375 (25) 123-45-67', service: 'Очистка мембраны и Nano-пропитка', price: 55, status: 'В работе', date: '16.11.2026' },
  { id: 111, model: 'Rick Owens Geobasket Black/White', client: 'Роман Васильев', phone: '+375 (29) 234-56-78', service: 'Прошивка рантов и спа-уход Bespoke', price: 140, status: 'Ожидает', date: '16.11.2026' },
  { id: 112, model: 'Сумка Louis Vuitton Keepall 50', client: 'Анна Зайцева', phone: '+375 (33) 345-67-89', service: 'Реставрация ручек из кожи Vachetta', price: 160, status: 'В работе', date: '16.11.2026' }
];

function createApiService(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  const STORAGE_KEYS = {
    DATA: 'sneakfix_orders_v1',
    FILE: 'sneakfix_excel_meta_v1',
    LOGS: 'sneakfix_activity_logs_v1'
  };

  const delay = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms));

  const logActivity = (action, details) => {
    if (!storage) return;
    try {
      const raw = storage.getItem(STORAGE_KEYS.LOGS);
      const logs = raw ? JSON.parse(raw) : [];
      logs.unshift({
        id: Date.now(),
        action,
        details,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      storage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch (_) {}
  };

  return {
    version: '1.0.0',

    validateFile(file) {
      if (!file || !file.name) {
        return { valid: false, message: 'Файл не выбран.' };
      }
      const ext = file.name.split('.').pop().toLowerCase();
      const isExcel = ext === 'xlsx' || ext === 'xls';
      if (!isExcel) {
        return {
          valid: false,
          message: 'Неверный формат файла. Разрешены исключительно таблицы Excel (.xlsx, .xls).'
        };
      }
      return { valid: true };
    },

    async getTableData() {
      await delay();
      if (!storage) return [...SEED_DATA];
      const raw = storage.getItem(STORAGE_KEYS.DATA);
      if (!raw) {
        storage.setItem(STORAGE_KEYS.DATA, JSON.stringify(SEED_DATA));
        return [...SEED_DATA];
      }
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_DATA];
      } catch {
        return [...SEED_DATA];
      }
    },

    async saveTableData(data) {
      await delay();
      if (storage) {
        storage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
      }
      return data;
    },

    async addRecord(item) {
      const data = await this.getTableData();
      const nextId = data.length > 0 ? Math.max(...data.map(r => Number(r.id) || 0)) + 1 : 101;
      const newRecord = {
        id: nextId,
        model: item.model.trim(),
        client: item.client.trim(),
        phone: item.phone.trim(),
        service: item.service || 'Глубокая эко-чистка',
        price: Number(item.price) || 45,
        status: item.status || 'В работе',
        date: new Date().toLocaleDateString('ru-RU')
      };
      data.unshift(newRecord);
      await this.saveTableData(data);
      logActivity('Добавление заказа', `#${newRecord.id} ${newRecord.model} (${newRecord.client})`);
      return newRecord;
    },

    async updateRecord(id, updates) {
      const data = await this.getTableData();
      const idx = data.findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`Запись #${id} не найдена`);
      data[idx] = { ...data[idx], ...updates };
      await this.saveTableData(data);
      logActivity('Обновление заказа', `#${id} обновлен статус на "${data[idx].status}"`);
      return data[idx];
    },

    async deleteRecord(id) {
      let data = await this.getTableData();
      const target = data.find(r => r.id === id);
      data = data.filter(r => r.id !== id);
      await this.saveTableData(data);
      logActivity('Удаление заказа', `#${id} ${target ? target.model : ''}`);
      return true;
    },

    async saveFile(fileInfo) {
      await delay();
      if (storage) {
        storage.setItem(STORAGE_KEYS.FILE, JSON.stringify(fileInfo));
      }
      logActivity('Импорт Excel', `Загружен реестр "${fileInfo.name}" (${fileInfo.rowCount} строк)`);
      return fileInfo;
    },

    async getUploadedFile() {
      await delay();
      if (!storage) return null;
      const raw = storage.getItem(STORAGE_KEYS.FILE);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },

    async deleteUploadedFile() {
      await delay();
      if (storage) {
        storage.removeItem(STORAGE_KEYS.FILE);
      }
      logActivity('Очистка файла', 'Удален загруженный файл из локального хранилища');
      return true;
    },

    async parseExcel(file, XLSXLib = (typeof window !== 'undefined' ? window.XLSX : null)) {
      await delay();
      if (!XLSXLib) {
        throw new Error('Библиотека SheetJS (XLSX) не подключена.');
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSXLib.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = XLSXLib.utils.sheet_to_json(worksheet, { header: 1 });

            if (!rawRows || rawRows.length === 0) {
              resolve([]);
              return;
            }

            const startIndex = (typeof rawRows[0][0] === 'string' && isNaN(Number(rawRows[0][0]))) ? 1 : 0;
            const parsedRows = [];
            for (let i = startIndex; i < rawRows.length; i++) {
              const row = rawRows[i];
              if (!row || row.length === 0 || !row[0]) continue;
              parsedRows.push({
                id: 200 + (i - startIndex + 1),
                model: String(row[0] || 'Кроссовки').trim(),
                client: String(row[1] || 'Клиент').trim(),
                phone: String(row[2] || '+375 (29) 000-00-00').trim(),
                service: String(row[3] || 'Глубокая эко-чистка').trim(),
                price: Number(row[4]) || 45,
                status: String(row[5] || 'В работе').trim(),
                date: new Date().toLocaleDateString('ru-RU')
              });
            }
            resolve(parsedRows);
          } catch (err) {
            reject(new Error('Ошибка чтения данных Excel: ' + err.message));
          }
        };
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsArrayBuffer(file);
      });
    }
  };
}

if (typeof window !== 'undefined') {
  window.createApiService = createApiService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createApiService };
}

