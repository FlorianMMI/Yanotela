import { createServer } from 'http';
import pkg from "@prisma/client";
const { PrismaClient } = pkg;


const prisma = new PrismaClient();

try {
    if (prisma) {
        console.log('Import Prisma OK');
    }
} catch (error) {
    console.error('Erreur import Prisma:', error);
}

const httpServer = createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    
    res.end('Hello, World!');
});

const PORT = 300;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});