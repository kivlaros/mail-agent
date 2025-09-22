import Imap from 'imap';
import { simpleParser } from 'mailparser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// Добавьте в конец emailProcessor.js
import { processFiles as processDownloadedFiles } from './src/fileProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const config = {
  user: 'vsykorea34',
  password:'uydjcyhemnerguth',
  host: 'imap.yandex.ru',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// Настройки обработки писем
const settings = {
  daysToCheck: 3,
  suppliers: {
    as61: {
      domains: ['as61.ru'],
      attachmentPrefix: '_Документ1',
      folder: './attachments/as61'
    },
    stparts: {
      domains: ['stparts.ru'],
      attachmentPrefix: 'УниверсальныйПередаточныйДокумент',
      folder: './attachments/stparts'
    },
    autorus: {
      domains: ['autorus.ru'],
      attachmentPrefix: 'УПД',
      folder: './attachments/autorus'
    },
    autoEuro: {
      domains: ['autoeuro.ru'],
      attachmentPrefix: 'УПД',
      folder: './attachments/autoEuro'
    },
    mparts: {
      domains: ['v01.ru'],
      attachmentPrefix: 'УПД',
      folder: './attachments/MParts'
    },
    forum: {
      domains: ['forum-auto.ru'],
      attachmentPrefix: 'upd',
      folder: './attachments/Forum'
    }

  }
};

class EmailProcessor {
  constructor() {
    this.imap = new Imap(config);
    this.processedUIDs = new Set();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.imap.once('ready', () => this.processEmails());
    this.imap.once('error', err => console.error('IMAP error:', err));
    this.imap.once('end', () => console.log('Connection ended'));
  }

  async processEmails() {
    try {
      const folders = await this.getFolders();
      
      for (const folder of folders) {
        await this.processFolder(folder);
      }

      this.imap.end();
    } catch (error) {
      console.error('Error processing emails:', error);
      this.imap.end();
    }
  }

  async getFolders() {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }

        const allFolders = [];
        const traverse = (boxNode, path = '') => {
          for (const [name, box] of Object.entries(boxNode)) {
            const fullPath = path ? `${path}/${name}` : name;
            
            // Исключаем системные папки
            if (!['INBOX', 'Sent', 'Drafts', 'Trash', 'Spam'].includes(name)) {
              allFolders.push(fullPath);
            }
            
            if (box.children) {
              traverse(box.children, fullPath);
            }
          }
        };

        traverse(boxes);
        resolve(['INBOX', ...allFolders]);
      });
    });
  }

  async processFolder(folder) {
    return new Promise((resolve, reject) => {
      this.imap.openBox(folder, true, (err, box) => {
        if (err) {
          console.error(`Error opening folder ${folder}:`, err);
          return resolve();
        }

        this.searchEmails()
          .then(results => {
            if (results.length === 0) {
              return resolve();
            }
            return this.processEmailMessages(results);
          })
          .then(resolve)
          .catch(reject);
      });
    });
  }

  searchEmails() {
    const date = new Date();
    date.setDate(date.getDate() - settings.daysToCheck);
    const searchDate = date.toISOString().split('T')[0].replace(/-/g, '-');
    
    // Создаем правильный IMAP-запрос с вложенными OR
    const domains = Object.values(settings.suppliers).flatMap(supplier => supplier.domains);
    
    // Строим вложенные OR условия для всех доменов
    let orCondition = [];
    if (domains.length > 0) {
      orCondition = this.buildNestedOrCondition(domains);
    }
    
    return new Promise((resolve, reject) => {
      const searchCriteria = [
        ['SINCE', searchDate],
        ...(orCondition.length > 0 ? [orCondition] : [])
      ];

      this.imap.search(searchCriteria, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Строим вложенные OR условия для IMAP-запроса
  buildNestedOrCondition(domains) {
    if (domains.length === 1) {
      return ['FROM', domains[0]];
    }
    
    // Для двух и более доменов строим вложенные OR
    let condition = ['OR', ['FROM', domains[0]], ['FROM', domains[1]]];
    
    for (let i = 2; i < domains.length; i++) {
      condition = ['OR', condition, ['FROM', domains[i]]];
    }
    
    return condition;
  }

  async processEmailMessages(emailIds) {
    return new Promise((resolve, reject) => {
      const fetch = this.imap.fetch(emailIds, { 
        bodies: '',
        markSeen: false
      });
      
      let processed = 0;

      fetch.on('message', msg => {
        let uid = null;
        
        msg.on('attributes', attrs => {
          uid = attrs.uid;
        });

        msg.on('body', async stream => {
          if (uid && this.processedUIDs.has(uid)) {
            return;
          }

          try {
            const parsed = await simpleParser(stream);
            await this.processAttachments(parsed);
            
            if (uid) {
              this.processedUIDs.add(uid);
            }
          } catch (error) {
            console.error('Error parsing email:', error);
          }
        });

        msg.once('end', () => {
          processed++;
          if (processed === emailIds.length) resolve();
        });
      });

      fetch.once('error', reject);
    });
  }

  async processAttachments(parsedEmail) {
    const from = parsedEmail.from.value[0].address;
    const supplier = this.identifySupplier(from);
    
    if (!supplier || !parsedEmail.attachments || parsedEmail.attachments.length === 0) {
      return;
    }

    // Создаем папку для поставщика, если не существует
    await fs.mkdir(supplier.folder, { recursive: true });
    
    // Обрабатываем вложения
    for (const attachment of parsedEmail.attachments) {
      if (attachment.filename && attachment.filename.includes(supplier.attachmentPrefix)) {
        await this.saveAttachment(attachment, supplier.folder);
      }
    }
  }

  identifySupplier(emailAddress) {
    for (const [key, supplier] of Object.entries(settings.suppliers)) {
      if (supplier.domains.some(domain => emailAddress.includes(domain))) {
        return supplier;
      }
    }
    return null;
  }

  async saveAttachment(attachment, folderPath) {
  const filePath = path.join(folderPath, attachment.filename);
  
  try {
    // Проверяем, существует ли файл
    await fs.access(filePath);
    console.log(`File already exists, skipping: ${filePath}`);
  } catch (error) {
    // Файл не существует, сохраняем
    try {
      await fs.writeFile(filePath, attachment.content);
      console.log(`Saved attachment: ${filePath}`);
      
      // После сохранения файла запускаем его обработку
      try {
        await processDownloadedFiles();
      } catch (processingError) {
        console.error('Error processing files:', processingError);
      }
    } catch (writeError) {
      console.error(`Error saving attachment ${filePath}:`, writeError);
    }
  }
}

  connect() {
    this.imap.connect();
  }
}

// Создаем и запускаем процессор
const processor = new EmailProcessor();
processor.connect();

// Обработка graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  processor.imap.end();
  process.exit(0);
});