import 'dotenv/config';
import { httpServer } from './src/app.js';

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});