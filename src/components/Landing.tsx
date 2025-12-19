import { useEffect, useState } from 'react';
import { tracking } from '../utils/tracking';
import { storage } from '../utils/storage';
import { ga4Tracking } from '../utils/ga4Tracking';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  const [userCount, setUserCount] = useState(storage.getUserCount());

  // ========================================
  // ✅ SISTEMA DE CAPTURA DE UTMs
  // ========================================
  const captureUTMs = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utms: Record<string, string> = {};

      // Captura UTMs padrão
      const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
      utmParams.forEach(param => {
        const value = urlParams.get(param);
        if (value) utms[param] = value;
      });

      // Captura Click IDs
      const clickIds = ['fbclid', 'gclid', 'ttclid'];
      clickIds.forEach(param => {
        const value = urlParams.get(param);
        if (value) utms[param] = value;
      });

      // Armazena no localStorage
      if (Object.keys(utms).length > 0) {
        localStorage.setItem('quiz_utms', JSON.stringify(utms));
        console.log('✅ UTMs capturadas:', utms);
      } else {
        console.log('ℹ️ Nenhuma UTM encontrada na URL');
      }
    } catch (error) {
      console.error('❌ Erro ao capturar UTMs:', error);
    }
  };

  useEffect(() => {
    // ✅ CAPTURA UTMs ASSIM QUE A PÁGINA CARREGA
    captureUTMs();

    tracking.pageView('landing');
    ga4Tracking.landingPageView();

    const interval = setInterval(() => {
      setUserCount(prev => {
        const newCount = prev + Math.floor(Math.random() * 3) + 1;
        storage.setUserCount(newCount);
        return newCount;
      });
    }, 5000);

    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            tracking.scrollDepth(50);
            ga4Tracking.landingScrollDepth(50);
          }
        });
      },
      { threshold: 0.5 }
    );

    const ctaElement = document.querySelector('.cta-section');
    if (ctaElement) scrollObserver.observe(ctaElement);

    return () => {
      clearInterval(interval);
      scrollObserver.disconnect();
    };
  }, []);

  const handleCTAClick = () => {
    tracking.ctaClicked('landing_primary');
    ga4Tracking.landingCTAClick();
    onNavigate('chat');
  };

  return (
    <div className="landing-container">
      <div className="matrix-bg"></div>
      <div className="scanlines"></div>

      <div className="content-wrapper">
        <header className="landing-header">
          <div className="avatar-container">
            <div className="avatar-placeholder">RA</div>
            <p className="avatar-label">Ricardo Abreu</p>
          </div>
        </header>

        <main className="landing-main">
          <h1 className="headline">
            Descubre la Verdad Sobre Tu Ex: Análisis Psicológico en Tiempo Real por el Especialista
          </h1>

          <p className="subheadline">
            En minutos, revela el plan personalizado que ya ayudó a +12.847 personas a reconquistar el amor perdido. ¡No pierdas la Ventana de 72 Horas!
          </p>

          <div className="user-counter">
            <div className="counter-pulse"></div>
            <span className="counter-text">
              <span className="counter-number">{userCount}</span> usuarios siendo analizados ahora
            </span>
          </div>

          <div className="social-proof">
            <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Basado en psicología conductual comprobada</span>
          </div>

          <div className="cta-section">
            <button className="cta-button" onClick={handleCTAClick}>
              <span className="cta-glow"></span>
              INICIAR ANÁLISIS AHORA
            </button>
          </div>
        </main>

        <footer className="landing-footer">
          <p className="disclaimer">
            Sistema desarrollado con psicología conductual y neurociencia aplicada
          </p>
        </footer>
      </div>
    </div>
  );
}