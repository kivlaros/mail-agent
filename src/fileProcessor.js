// fileProcessor.js
import fs from 'fs/promises';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация путей
const config = {
  inputBase: './attachments',
  outputBase: './output',
  suppliers: {
    as61: {
      input: './attachments/as61',
      output: './output/as61',
      processor: processAs61Data // Функция обработки для as61
    },
    stparts: {
      input: './attachments/stparts',
      output: './output/stparts',
      processor: processStpartsData // Функция обработки для stparts
    },
    autorus: {
      input: './attachments/autorus',
      output: './output/autorus',
      processor: processAutorusData // Функция обработки для autorus
    }
  }
};

// Функции-заглушки для обработки данных (замените на свою логику)
async function processAs61Data(data) {
  console.log('Обработка данных as61');
  //console.log(data)
  return data;
}

async function processStpartsData(data) {
  console.log('Обработка данных stparts');
  console.log(data)
  return data;
}

async function processAutorusData(data) {
  console.log('Обработка данных autorus');
  // Ваша логика обработки для autorus
  return data;
}

class FileProcessor {
  constructor() {
    this.processedFiles = new Set();
  }

  // Инициализация обработчика
  async init() {
    try {
      // Создаем выходные папки, если они не существуют
      for (const supplier of Object.values(config.suppliers)) {
        await fs.mkdir(supplier.output, { recursive: true });
      }
      
      // Загружаем список уже обработанных файлов
      await this.loadProcessedFiles();
      
      console.log('FileProcessor инициализирован');
    } catch (error) {
      console.error('Ошибка инициализации FileProcessor:', error);
      throw error;
    }
  }

  // Загрузка списка уже обработанных файлов
  async loadProcessedFiles() {
    try {
      for (const [supplierKey, supplier] of Object.entries(config.suppliers)) {
        try {
          const files = await fs.readdir(supplier.output);
          files.forEach(file => {
            this.processedFiles.add(`${supplierKey}_${file}`);
          });
        } catch (error) {
          // Если папка не существует, это нормально
          if (error.code !== 'ENOENT') {
            console.error(`Ошибка чтения папки ${supplier.output}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки обработанных файлов:', error);
    }
  }

  // Основной метод обработки файлов
  async processFiles() {
    try {
      console.log('Начинаем обработку файлов...');
      
      for (const [supplierKey, supplier] of Object.entries(config.suppliers)) {
        await this.processSupplierFiles(supplierKey, supplier);
      }
      
      console.log('Обработка файлов завершена');
    } catch (error) {
      console.error('Ошибка обработки файлов:', error);
    }
  }

  // Обработка файлов конкретного поставщика
  async processSupplierFiles(supplierKey, supplier) {
    try {
      const files = await fs.readdir(supplier.input);
      
      for (const file of files) {
        const fileKey = `${supplierKey}_${file}`;
        
        // Пропускаем уже обработанные файлы
        if (this.processedFiles.has(fileKey)) {
          console.log(`Файл уже обработан, пропускаем: ${file}`);
          continue;
        }
        
        // Обрабатываем файл
        await this.processFile(supplierKey, supplier, file);
        
        // Добавляем в список обработанных
        this.processedFiles.add(fileKey);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Папка поставщика ${supplierKey} не существует или пуста`);
      } else {
        console.error(`Ошибка обработки файлов поставщика ${supplierKey}:`, error);
      }
    }
  }

  // Обработка отдельного файла
  async processFile(supplierKey, supplier, filename) {
    try {
      const inputPath = path.join(supplier.input, filename);
      const outputPath = path.join(supplier.output, filename);
      
      console.log(`Обрабатываем файл: ${filename}`);
      
      // Читаем файл
      const fileBuffer = await fs.readFile(inputPath);
      
      // Парсим XLS в JS объект
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Обрабатываем данные с помощью соответствующей функции
      const processedData = await supplier.processor(data);
      
      // Преобразуем обработанные данные обратно в XLS
      const newWorkbook = xlsx.utils.book_new();
      const newWorksheet = xlsx.utils.aoa_to_sheet(processedData);
      xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Processed Data');
      
      // Сохраняем файл
      const outputBuffer = xlsx.write(newWorkbook, { type: 'buffer', bookType: 'xls' });
      await fs.writeFile(outputPath, outputBuffer);
      
      console.log(`Файл сохранен: ${outputPath}`);
    } catch (error) {
      console.error(`Ошибка обработки файла ${filename}:`, error);
    }
  }

  // Получение статистики обработки
  getStats() {
    return {
      processed: this.processedFiles.size
    };
  }
}

// Создаем и экспортируем экземпляр процессора
const fileProcessor = new FileProcessor();

// Функция для запуска обработки
export async function processFiles() {
  await fileProcessor.init();
  await fileProcessor.processFiles();
  return fileProcessor.getStats();
}

// Для запуска напрямую
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processFiles()
    .then(stats => {
      console.log(`Обработка завершена. Обработано файлов: ${stats.processed}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Ошибка при обработке файлов:', error);
      process.exit(1);
    });
}