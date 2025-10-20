const fs = require('fs');
const path = require('path');

class ConsoleLogRemover {
  constructor() {
    this.filesProcessed = 0;
    this.consolesRemoved = 0;
  }

  removeConsoleLogs(directory) {
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];

    console.log(`🔍 Scanning: ${directory}\n`);

    const processFile = (filePath) => {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;

        // Compter les console.log avant suppression
        const logMatches = content.match(/console\.log\([^)]*\);?\s*/g);
        const debugMatches = content.match(/console\.debug\([^)]*\);?\s*/g);
        const infoMatches = content.match(/console\.info\([^)]*\);?\s*/g);
        
        const count = (logMatches?.length || 0) + (debugMatches?.length || 0) + (infoMatches?.length || 0);

        // Supprimer console.log, console.debug, console.info
        content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
        content = content.replace(/console\.debug\([^)]*\);?\s*/g, '');
        content = content.replace(/console\.info\([^)]*\);?\s*/g, '');

        // Nettoyer les lignes vides multiples
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ ${filePath} (${count} console statements removed)`);
          this.filesProcessed++;
          this.consolesRemoved += count;
        }

      } catch (error) {
        console.error(`❌ Error: ${filePath} - ${error.message}`);
      }
    };

    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (!excludeDirs.includes(item)) {
              scanDirectory(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(fullPath);
            if (extensions.includes(ext)) {
              processFile(fullPath);
            }
          }
        });
      } catch (error) {
        console.error(`❌ Error scanning: ${dir} - ${error.message}`);
      }
    };

    scanDirectory(directory);

    console.log('\n📊 Summary:');
    console.log(`   Files modified: ${this.filesProcessed}`);
    console.log(`   Console statements removed: ${this.consolesRemoved}`);
  }
}

// Exécution
const targetDir = process.argv[2] || './src';

if (!fs.existsSync(targetDir)) {
  console.error(`❌ Directory not found: ${targetDir}`);
  process.exit(1);
}

const remover = new ConsoleLogRemover();
remover.removeConsoleLogs(targetDir);

console.log('\n✨ Done!');