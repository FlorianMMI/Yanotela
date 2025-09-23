import 'dotenv/config';
import app from './src/app.js';

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

