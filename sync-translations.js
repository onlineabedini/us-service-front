import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseLang = 'en';
const baseLocalePath = path.join(__dirname, 'public', 'locales');
const baseLangPath = path.join(baseLocalePath, baseLang);

function deepMerge(base, target) {
  for (const key in base) {
    if (
      typeof base[key] === 'object' &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      target[key] = deepMerge(base[key], target[key] || {});
    } else {
      if (!(key in target)) {
        target[key] = ''; // Leave empty for translators
      }
    }
  }
  return target;
}

function syncTranslations() {
  const locales = fs
    .readdirSync(baseLocalePath)
    .filter((lang) => lang !== baseLang);

  const baseFiles = fs
    .readdirSync(baseLangPath)
    .filter((file) => file.endsWith('.json'));

  baseFiles.forEach((filename) => {
    const baseFilePath = path.join(baseLangPath, filename);
    const baseData = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));

    locales.forEach((lang) => {
      const targetPath = path.join(baseLocalePath, lang, filename);

      let targetData = {};
      if (fs.existsSync(targetPath)) {
        targetData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      }

      const merged = deepMerge(baseData, targetData);

      fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2), 'utf-8');
      
    });
  });
}

syncTranslations();
