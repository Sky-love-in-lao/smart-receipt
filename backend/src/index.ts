import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scanRoutes from './routes/scan';
import receiptRoutes from './routes/receipt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/scan', scanRoutes);
app.use('/api/receipts', receiptRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
