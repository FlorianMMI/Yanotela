import { createServer } from 'http';


const httpServer = createServer(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    
    res.end('Hello, World!');
});

const PORT = 300;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});