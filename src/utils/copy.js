import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Для работы __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Копирует папку output из корня проекта в C:\share.
 * Если папка output уже существует в C:\share, заменяет её содержимое.
 */
export async function copyOutputFolder() {
    try {
        const sourceDir = path.join(process.cwd(), 'output');
        const targetDir = path.join('C:', 'share', 'output');

        // Проверяем доступность исходной папки
        await fs.access(sourceDir);
        console.log(`✓ Исходная папка найдена: ${sourceDir}`);

        // Гарантируем существование C:\share
        await fs.mkdir(path.dirname(targetDir), { recursive: true });
        console.log(`✓ Родительская папка ${path.dirname(targetDir)} готова`);

        // Копируем с перезаписью всего содержимого
        await fs.cp(sourceDir, targetDir, { recursive: true, force: true });
        console.log(`✓ Папка успешно скопирована в ${targetDir}`);
    } catch (err) {
        // Различные типы ошибок
        if (err.code === 'ENOENT') {
            console.error(`❌ Исходная папка не существует: ${err.path}`);
        } else if (err.code === 'EACCES') {
            console.error(`❌ Нет прав доступа: ${err.message}`);
        } else {
            console.error(`❌ Ошибка при копировании: ${err.message}`);
        }
    }
}
