import { createServer } from 'http';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

try {
    if (prisma) {

    }
} catch (error) {
    
}

const httpServer = createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    res.end('Hello World');
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    
});
