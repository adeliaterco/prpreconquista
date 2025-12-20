import { useState, useEffect, useRef } from 'react';
import { tracking } from '../utils/tracking';
import { storage } from '../utils/storage';
import { playKeySound, getHotmartUrl } from '../utils/animations';
import { QuizAnswer } from '../types/quiz';
import { ga4Tracking } from '../utils/ga4Tracking';

import { 
  getTitle, 
  getLoadingMessage, 
  getCopy, 
  getVentana72Copy,
  getOfferTitle,
  getFeatures, 
  getCTA,
  getFaseText
} from '../utils/contentByGender';
import { getEmotionalValidation } from '../utils/emotionalValidation';

interface ResultProps {
  onNavigate: (page: string) => void;
}

export default function Result({ onNavigate }: ResultProps) {
  // --- ESTADO UNIFICADO E CONTROLE DE FLUXO ---
  const [currentPhase, setCurrentPhase] = useState(0); // 0: Loading, 1: Diagnosis, 2: Video, 3: Ventana, 4: Offer
  
  // --- PERSISTÊNCIA DO TIMER NO LOCALSTORAGE ---
  const getInitialTime = () => {
    const savedTimestamp = localStorage.getItem('quiz_timer_start');
    if (savedTimestamp) {
      const startTime = parseInt(savedTimestamp);
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = (47 * 60) - elapsed;
      return remaining > 0 ? remaining : 0;
    }
    localStorage.setItem('quiz_timer_start', Date.now().toString());
    return 47 * 60;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTime());
  const [spotsLeft, setSpotsLeft] = useState(storage.getSpotsLeft());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [peopleBuying, setPeopleBuying] = useState(Math.floor(Math.random() * 5) + 1);

  const quizData = storage.getQuizData();
  const diagnosticoSectionRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const ventana72SectionRef = useRef<HTMLDivElement>(null);
  const offerSectionRef = useRef<HTMLDivElement>(null);

  const gender = quizData.gender || 'HOMBRE';

  // Loading steps (2 steps - 2.5s total)
  const loadingSteps = [
    { icon: '📊', text: 'Respuestas procesadas', duration: 0 },
    { icon: '🧠', text: 'Generando tu diagnóstico personalizado...', duration: 1000 }
  ];

  // --- SISTEMA DE PRESERVAÇÃO DE UTMs ---
  const getUTMs = (): Record<string, string> => {
    try {
      const storedUTMs = localStorage.getItem('quiz_utms');
      return storedUTMs ? JSON.parse(storedUTMs) : {};
    } catch (error) {
      return {};
    }
  };

  const ensureUTMs = () => {
    const utms = getUTMs();
    if (Object.keys(utms).length > 0 && window.location.search === '') {
      const utmString = Object.entries(utms)
        .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
        .join('&');
      window.history.replaceState({}, '', `${window.location.pathname}?${utmString}`);
    }
  };

  const appendUTMsToHotmartURL = (): string => {
    const baseURL = getHotmartUrl();
    const utms = getUTMs();
    if (Object.keys(utms).length === 0) return baseURL;
    const url = new URL(baseURL);
    Object.entries(utms).forEach(([key, value]) => url.searchParams.set(key, value as string));
    return url.toString();
  };

  // --- EFEITO PRINCIPAL DE PROGRESSÃO AUTOMÁTICA ---
  useEffect(() => {
    ensureUTMs();
    tracking.pageView('resultado');
    ga4Tracking.resultPageView();

    // Loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    // Loading steps
    loadingSteps.forEach((step, index) => {
      setTimeout(() => setLoadingStep(index), step.duration);
    });

    // PROGRESSÃO AUTOMÁTICA POR TEMPO
    // Fase 1: Diagnóstico em 2.5s
    const timerPhase1 = setTimeout(() => {
      setCurrentPhase(1);
      playKeySound();
      tracking.revelationViewed('why_left');
      ga4Tracking.revelationViewed('Por qué te dejó', 1);
      setTimeout(() => {
        diagnosticoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }, 2500);

    // Fase 2: Vídeo em 8s
    const timerPhase2 = setTimeout(() => {
      setCurrentPhase(2);
      playKeySound();
      tracking.vslEvent('started');
      ga4Tracking.videoStarted();
      setTimeout(() => {
        videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }, 8000);

    // Fase 3: Ventana 72h em 78s (8s + 70s após vídeo)
    const timerPhase3 = setTimeout(() => {
      setCurrentPhase(3);
      playKeySound();
      tracking.revelationViewed('72h_window');
      ga4Tracking.revelationViewed('Ventana 72 Horas', 2);
      setTimeout(() => {
        ventana72SectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }, 78000);

    // Fase 4: Oferta em 98s (8s + 70s + 20s)
    const timerPhase4 = setTimeout(() => {
      setCurrentPhase(4);
      playKeySound();
      tracking.revelationViewed('offer');
      ga4Tracking.revelationViewed('Oferta Revelada', 3);
      ga4Tracking.offerRevealed();
      setTimeout(() => {
        offerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }, 98000);

    // Countdown timer
    const countdownInterval = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);

    // Spots interval
    const spotsInterval = setInterval(() => {
      setSpotsLeft(prev => {
        if (prev > 15) {
          const newSpots = prev - 1;
          storage.setSpotsLeft(newSpots);
          ga4Tracking.spotsUpdated(newSpots);
          return newSpots;
        }
        return prev;
      });
    }, 45000);

    // Gamificação: Contador de pessoas comprando
    const buyingInterval = setInterval(() => {
      setPeopleBuying(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        let newCount = prev + change;
        if (newCount < 1) newCount = 1;
        if (newCount > 7) newCount = 7;
        return newCount;
      });
    }, Math.floor(Math.random() * 10000) + 5000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timerPhase1);
      clearTimeout(timerPhase2);
      clearTimeout(timerPhase3);
      clearTimeout(timerPhase4);
      clearInterval(countdownInterval);
      clearInterval(spotsInterval);
      clearInterval(buyingInterval);
    };
  }, []);

  // Redirecionamento por expiração
  useEffect(() => {
    if (timeLeft <= 0 && currentPhase > 0) {
      alert('Tu análisis ha expirado. Por favor, completa el quiz nuevamente.');
      localStorage.removeItem('quiz_timer_start');
      window.location.href = '/';
    }
  }, [timeLeft, currentPhase]);

  // Injeção VTurb
  useEffect(() => {
    if (currentPhase !== 2 || !videoSectionRef.current) return;
    const timer = setTimeout(() => {
      if (videoSectionRef.current) {
        videoSectionRef.current.innerHTML = `
          <div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
            <vturb-smartplayer id="vid-6946ae0a8fd5231b631d81f0" style="display: block; margin: 0 auto; width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></vturb-smartplayer>
          </div>
        `;
        if (!document.querySelector('script[src*="player.js"]')) {
          const s = document.createElement("script");
          s.src = "https://scripts.converteai.net/ea3c2dc1-1976-40a2-b0fb-c5055f82bfaf/players/6946ae0a8fd5231b631d81f0/v4/player.js";
          s.async = true;
          document.head.appendChild(s);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCTAClick = () => {
    tracking.ctaClicked('result_buy');
    ga4Tracking.ctaBuyClicked('result_buy_main');
    window.open(appendUTMsToHotmartURL(), '_blank');
  };

  const phases = ['Diagnóstico', 'Vídeo', 'Ventana 72h', 'Solución'];

  return (
    <div className="result-container">
      <div className="result-header">
        <h1 className="result-title">Tu Plan Personalizado Está Listo</h1>
        <div className="urgency-bar">
          <span className="urgency-icon">⚠️</span>
          <span className="urgency-text">Tu análisis expira en: {formatTime(timeLeft)}</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: '8px' }}>
          Por seguridad, tu diagnóstico personalizado estará disponible solo por 47 minutos.
        </p>
      </div>

      {/* BARRA DE PROGRESSO */}
      {currentPhase > 0 && (
        <div className="progress-bar-container fade-in">
          {phases.map((label, index) => (
            <div key={index} className={`progress-step ${currentPhase > index + 1 ? 'completed' : ''} ${currentPhase === index + 1 ? 'active' : ''}`}>
              <div className="step-circle">{currentPhase > index + 1 ? '✅' : index + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="revelations-container">
        
        {/* LOADING */}
        {currentPhase === 0 && (
          <div className="revelation fade-in loading-box-custom">
            <div className="loading-inner">
              <div className="spin-brain">🧠</div>
              <h2>ANALIZANDO TU CASO</h2>
              <p>{getLoadingMessage(gender)}</p>
              <div className="loading-steps-list">
                {loadingSteps.map((step, i) => (
                  <div key={i} className={`loading-step-item ${i <= loadingStep ? 'active' : ''}`}>
                    {i < loadingStep ? '✅' : step.icon} {step.text}
                  </div>
                ))}
              </div>
              <div className="progress-outer"><div className="progress-inner" style={{ width: `${loadingProgress}%` }}></div></div>
              <div className="progress-labels"><span>{loadingProgress}%</span><span>⏱️ {Math.ceil((100 - loadingProgress) / 10)}s...</span></div>
            </div>
          </div>
        )}

        {/* FASE 1: DIAGNÓSTICO */}
        {currentPhase >= 1 && (
          <div ref={diagnosticoSectionRef} className={`revelation fade-in ${currentPhase === 1 ? 'diagnostic-pulse' : ''}`}>
            <div className="revelation-header">
              <div className="revelation-icon">💔</div>
              <h2>{getTitle(gender)}</h2>
            </div>
            
            <p className="revelation-text" style={{ whiteSpace: 'pre-line' }}>{getCopy(quizData)}</p>

            <div className="emotional-validation">
              <p><strong>Tu situación específica:</strong><br />{getEmotionalValidation(quizData)}</p>
            </div>
          </div>
        )}

        {/* FASE 2: VÍDEO */}
        {currentPhase >= 2 && (
          <div ref={videoSectionRef} className="revelation fade-in vsl-revelation">
            <div className="revelation-header">
              <div className="revelation-icon">🎥</div>
              <h2>Cómo Reactivar Los Interruptores Emocionales En 72 Horas</h2>
            </div>
            <div className="vsl-container">
              <div ref={videoSectionRef} className="vsl-placeholder"></div>
            </div>
          </div>
        )}

        {/* FASE 3: VENTANA 72H */}
        {currentPhase >= 3 && (
          <div ref={ventana72SectionRef} className="revelation fade-in ventana-box-custom">
            <div className="ventana-header-custom">
              <span>⚡</span>
              <h2>LA VENTANA DE 72 HORAS</h2>
            </div>
            <p className="ventana-intro">{getVentana72Copy(gender)}</p>
            <div className="fases-list">
              {[1, 2, 3].map(f => (
                <div key={f} className="fase-item-custom">
                  <strong>FASE {f} ({f === 1 ? '0-24h' : f === 2 ? '24-48h' : '48-72h'})</strong>
                  <p>{getFaseText(gender, f)}</p>
                </div>
              ))}
            </div>
            <img 
              src="https://comprarplanseguro.shop/wp-content/uploads/2025/10/imagem3-nova.webp" 
              alt="Ventana 72h" 
              className="ventana-img"
            />
          </div>
        )}

        {/* FASE 4: OFERTA COMPLETA */}
        {currentPhase >= 4 && (
          <div ref={offerSectionRef} className="revelation fade-in offer-section-custom">
            <div className="offer-badge">OFERTA EXCLUSIVA</div>
            <h2 className="offer-title-main">{getOfferTitle(gender)}</h2>

            {/* BOX DE DADOS DO QUIZ */}
            <div className="quiz-summary-box" style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '2px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <p style={{
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                color: 'rgb(253, 224, 71)',
                marginBottom: 'clamp(12px, 3vw, 16px)',
                fontWeight: 'bold'
              }}>
                Basado en tu situación específica:
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                color: 'white',
                lineHeight: '1.8'
              }}>
                <li>✓ <strong>Tiempo:</strong> {quizData.timeSeparation || 'No especificado'}</li>
                <li>✓ <strong>Quién terminó:</strong> {quizData.whoEnded || 'No especificado'}</li>
                <li>✓ <strong>Contacto:</strong> {quizData.currentSituation || 'No especificado'}</li>
                <li>✓ <strong>Compromiso:</strong> {quizData.commitmentLevel || 'No especificado'}</li>
              </ul>
            </div>

            {/* FEATURES COM CHECKMARKS */}
            <div className="offer-features" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(12px, 3vw, 16px)',
              marginBottom: 'clamp(24px, 5vw, 32px)'
            }}>
              {getFeatures(gender).map((feature, index) => (
                <div key={index} className="feature" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(10px, 3vw, 12px)',
                  padding: 'clamp(8px, 2vw, 12px) 0'
                }}>
                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{
                    minWidth: 'clamp(20px, 5vw, 24px)',
                    width: 'clamp(20px, 5vw, 24px)',
                    height: 'clamp(20px, 5vw, 24px)',
                    marginTop: '2px',
                    color: '#4ade80'
                  }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style={{
                    fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
                    lineHeight: '1.5',
                    flex: 1
                  }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* PREÇO E DESCONTO */}
            <div className="price-box">
              <p className="price-old">Precio regular: R$ 297</p>
              <p className="price-new">R$ 97</p>
              <p className="price-discount">💰 67% de descuento HOY</p>
            </div>

            <button className="cta-buy-final" onClick={handleCTAClick}>
              🎯 {getCTA(gender)}
            </button>

            {/* PROVA SOCIAL REAL */}
            <div className="real-proof-box">
              <p>⭐ <strong>4.8/5 estrellas</strong> (2.341 avaliações verificadas)</p>
              <p>📱 Última compra hace 4 minutos</p>
            </div>

            <div className="trust-icons">
              <span>🔒 Compra segura</span>
              <span>✅ Acceso instantáneo</span>
              <span>↩️ 7 días de garantía</span>
            </div>

            {/* URGÊNCIA COM JUSTIFICATIVA */}
            <div className="final-urgency-grid">
              <div className="urgency-item">
                <span>Tiempo restante:</span>
                <strong>{formatTime(timeLeft)}</strong>
              </div>
              <div className="urgency-item">
                <span>Vacantes VIP hoy:</span>
                <strong>{spotsLeft}/50</strong>
                <small>(Limitado para soporte personalizado)</small>
              </div>
            </div>

            {/* GAMIFICAÇÃO: PESSOAS COMPRANDO */}
            <p className="people-buying-counter" style={{
              textAlign: 'center',
              color: 'rgb(74, 222, 128)',
              fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
              marginTop: 'clamp(16px, 4vw, 20px)',
              marginBottom: 'clamp(12px, 3vw, 16px)',
              lineHeight: '1.5',
              fontWeight: '600'
            }}>
              ✨ {peopleBuying} personas están comprando ahora mismo
            </p>

            {/* PROVA SOCIAL +12.847 */}
            <p className="social-proof-count" style={{
              textAlign: 'center',
              color: 'rgb(74, 222, 128)',
              fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
              marginBottom: 'clamp(12px, 3vw, 16px)',
              lineHeight: '1.5',
              fontWeight: '600'
            }}>
              ✓ +12.847 reconquistas exitosas
            </p>

            {/* EXCLUSIVIDADE */}
            <p className="guarantee-text" style={{
              textAlign: 'center',
              fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.9)',
              padding: '0 8px'
            }}>
              Exclusivo para quien completó el análisis personalizado
            </p>
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      {currentPhase >= 4 && (
        <div className="sticky-footer-urgency fade-in-up">
          ⏰ {formatTime(timeLeft)} • {spotsLeft} spots restantes
        </div>
      )}

      <style jsx>{`
        .result-container { padding-bottom: 100px; }
        .diagnostic-pulse { animation: diagnosticPulse 1s ease-in-out 2; }
        @keyframes diagnosticPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(234, 179, 8, 0.3); }
          50% { transform: scale(1.02); box-shadow: 0 12px 48px rgba(234, 179, 8, 0.5); }
        }
        .loading-box-custom { background: rgba(234, 179, 8, 0.1); border: 2px solid #eab308; border-radius: 16px; padding: 40px; text-align: center; }
        .price-box { text-align: center; margin-bottom: 25px; }
        .price-old { text-decoration: line-through; opacity: 0.6; margin: 0; }
        .price-new { font-size: 3rem; color: #facc15; font-weight: 900; margin: 5px 0; }
        .price-discount { color: #4ade80; font-weight: bold; }
        .cta-buy-final { width: 100%; background: #eab308; color: black; font-weight: 900; padding: 20px; border-radius: 12px; font-size: 1.5rem; border: 3px solid white; cursor: pointer; }
        .real-proof-box { background: rgba(74, 222, 128, 0.1); border: 2px solid rgba(74, 222, 128, 0.3); border-radius: 12px; padding: 15px; text-align: center; color: #4ade80; margin: 20px 0; }
        .trust-icons { display: flex; justify-content: center; gap: 15px; color: #4ade80; font-size: 0.85rem; margin-bottom: 20px; }
        .final-urgency-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .urgency-item { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; text-align: center; }
        .urgency-item strong { display: block; font-size: 1.5rem; }
        .sticky-footer-urgency { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.95); padding: 15px; color: #fde047; text-align: center; z-index: 1000; border-top: 2px solid #eab308; font-weight: bold; }
        .progress-bar-container { display: flex; justify-content: space-between; margin: 20px auto; max-width: 800px; padding: 15px; background: rgba(0,0,0,0.4); border-radius: 12px; position: sticky; top: 0; z-index: 999; backdrop-filter: blur(5px); }
        .progress-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; color: rgba(255,255,255,0.5); font-size: 0.8rem; }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; justify-content: center; align-items: center; margin-bottom: 5px; }
        .progress-step.active .step-circle { background: #eab308; color: black; }
        .progress-step.completed .step-circle { background: #4ade80; color: white; }
        .ventana-img { width: 100%; max-width: 600px; border-radius: 12px; margin: 20px auto; display: block; }
        .emotional-validation { background: rgba(74, 222, 128, 0.1); border: 2px solid rgba(74, 222, 128, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px; color: #4ade80; }
        .fade-in { animation: fadeIn 0.6s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}