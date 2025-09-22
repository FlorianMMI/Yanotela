import { createServer } from 'http';
import { PrismaClient } from "@prisma/client";
import url from 'url';
import app from './app.js';

const prisma = new PrismaClient();

try {
    if (prisma) {
        console.log('Import Prisma OK');
        console.log('User created');
    }
} catch (error) {
    console.error('Erreur import Prisma:', error);
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

