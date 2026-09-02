import { Router } from 'express';
import prisma from '../prismaClient';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

// GET all receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({
      include: { items: true },
      orderBy: { date: 'desc' },
    });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// POST new receipt
router.post('/', async (req, res) => {
  const { storeName, date, totalAmount, items, currency } = req.body;
  try {
    const receipt = await prisma.receipt.create({
      data: {
        storeName,
        date: new Date(date),
        totalAmount: Number(totalAmount),
        currency: currency || 'LAK',
        items: {
          create: items.map((item: any) => ({
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
          }))
        }
      },
      include: { items: true },
    });
    res.status(201).json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create receipt' });
  }
});

// DELETE receipt
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.receipt.delete({ where: { id } });
    res.json({ message: 'Receipt deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

// GET aggregated products for comparison
router.get('/products/compare', async (req, res) => {
  try {
    const items = await prisma.receiptItem.findMany({
      include: { receipt: true }
    });
    
    // Group by item name
    const grouped: Record<string, any[]> = {};
    items.forEach(item => {
      const name = item.name.trim();
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push({
        storeName: item.receipt.storeName,
        price: item.price,
        date: item.receipt.date,
        currency: item.receipt.currency
      });
    });

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product comparison' });
  }
});

// DELETE receipt
router.delete('/:id', async (req, res) => {
  try {
    await prisma.receipt.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

// GET exchange rate from Naver
router.get('/exchange-rate', async (req, res) => {
  try {
    const { data } = await axios.get('https://m.search.naver.com/p/csearch/content/qapirender.nhn?key=calculator&pkid=141&q=%ED%99%98%EC%9C%A8&where=m&u1=keb&u6=standardUnit&u7=0&u3=USD&u4=KRW&u8=down&u2=1', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const krwObj = data.country.find((c: any) => c.currencyUnit === '원');
    if (krwObj && krwObj.value) {
      const rate = parseFloat(krwObj.value.replace(/,/g, ''));
      res.json({ usdToKrw: rate });
    } else {
      res.status(500).json({ error: 'Failed to parse rate from Naver API' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

export default router;
