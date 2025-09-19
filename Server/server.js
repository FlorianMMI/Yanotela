import { createServer } from 'http';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

try {
    if (prisma) {
        console.log('Import Prisma OK');
        
        console.log('User created');
    }
} catch (error) {
    console.error('Erreur import Prisma:', error);
}

const httpServer = createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    res.end('Hello, World!');
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
