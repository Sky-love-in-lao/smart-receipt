import { Router } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('receipt'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `당신은 영수증 분석 전문가입니다. 주어진 영수증 이미지는 라오스어(Laos, 킵) 또는 태국어(Thai, 바트)로 작성되어 있을 수 있습니다.
언어를 파악하여 상점명과 개별 상품들의 정보를 추출하고, 상품명은 한국어로 번역해서 알려주세요.
특히, 영수증이 태국(Thai) 영수증이거나 바트(Baht) 단위를 사용한다면 currency 필드를 무조건 "THB"로 작성하세요.
영수증이 라오스(Laos) 영수증이거나 킵(Kip) 단위를 사용한다면 currency 필드를 무조건 "LAK"로 작성하세요.
응답은 반드시 유효한 JSON 객체여야 합니다. (마크다운 코드 블록이나 다른 텍스트를 포함하지 마세요)

{
  "storeName": "상점 이름 (한국어 번역 또는 영문)",
  "date": "YYYY-MM-DD (영수증에 적힌 날짜)",
  "currency": "반드시 'THB' 또는 'LAK' 중 하나만 입력",
  "totalAmount": 숫자(총 결제 금액),
  "items": [
    {
      "name": "한국어로 번역된 상품명 (최대한 직관적으로 표기, 예: 펩시 콜라, 생수, 화장지 등)",
      "price": 숫자(상품 1개의 단가),
      "quantity": 숫자(구매 수량)
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      res.json(parsed);
    } else {
      throw new Error('No text in response');
    }
  } catch (error: any) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to process receipt', details: error.message });
  }
});

export default router;
