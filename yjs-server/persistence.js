const fs = require('fs');
const path = require('path');
const Y = require('yjs');

class FilePersistence {
  constructor(location) {
    this.location = location;
    if (!fs.existsSync(location)) {
      fs.mkdirSync(location, { recursive: true });
    }
  }

  getFilePath(docName) {
    return path.join(this.location, `${encodeURIComponent(docName)}.yjs`);
  }

  async storeUpdate(docName, update) {
    const filePath = this.getFilePath(docName);
    
    try {
      let updates = [];
      
      // Lire les updates existants
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        if (data.length > 0) {
          updates = JSON.parse(data.toString());
        }
      }
      
      // Ajouter le nouvel update
      updates.push(Array.from(update));
      
      // Sauvegarder
      fs.writeFileSync(filePath, JSON.stringify(updates));
      console.log(`[PERSIST] Saved update for document: ${docName}`);
    } catch (error) {
      console.error(`[PERSIST] Error storing update for ${docName}:`, error);
    }
  }

  async getYDoc(docName) {
    const filePath = this.getFilePath(docName);
    const doc = new Y.Doc();

    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        if (data.length > 0) {
          const updates = JSON.parse(data.toString());
          updates.forEach(update => {
            Y.applyUpdate(doc, new Uint8Array(update));
          });
          console.log(`[PERSIST] Loaded document: ${docName}`);
        }
      } else {
        console.log(`[PERSIST] No existing data for: ${docName}`);
      }
    } catch (error) {
      console.error(`[PERSIST] Error loading document ${docName}:`, error);
    }

    return doc;
  }

  async clearDocument(docName) {
    const filePath = this.getFilePath(docName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[PERSIST] Cleared document: ${docName}`);
    }
  }
}

module.exports = FilePersistence;