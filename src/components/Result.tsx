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
  // --- ESTADO UNIFICADO E CONTROLE DE FLUXO (Alteração #4) ---
  const [currentPhase, setCurrentPhase] = useState(0); // 0: Loading, 1: Diagnosis, 2: Video, 3: Ventana, 4: Offer
  const [offerRevealed, setOfferRevealed] = useState(false);
  const [ventanaRevealed, setVentanaRevealed] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);

  // --- PERSISTÊNCIA DO TIMER NO LOCALSTORAGE (Alteração #9) ---
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
  // REMOVIDO: const [spotsLeft, setSpotsLeft] = useState(storage.getSpotsLeft());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  // REMOVIDO: const [peopleBuying, setPeopleBuying] = useState(Math.floor(Math.random() * 5) + 1);

  const quizData = storage.getQuizData();
  const diagnosticoSectionRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const ventana72SectionRef = useRef<HTMLDivElement>(null);
  const offerSectionRef = useRef<HTMLDivElement>(null);

  const gender = quizData.gender || 'HOMBRE';

  // ALTERAÇÃO #1: Redução de steps para 2.5s totais de loading
  const loadingSteps = [
    { icon: '📊', text: 'Respuestas procesadas', duration: 0 },
    { icon: '🧠', text: getLoadingMessage(gender), duration: 2000 } // Mensagem final de loading
  ];

  // --- SISTEMA DE PRESERVAÇÃO DE UTMs (MANTIDO) ---
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

  // --- LÓGICAS DE REVELAÇÃO CONDICIONAL (Alteração #2 e #5) ---
  const revealOffer = () => {
    if (offerRevealed) return;
    setOfferRevealed(true);
    setCurrentPhase(4);
    playKeySound();
    tracking.revelationViewed('offer');
    ga4Tracking.revelationViewed('Oferta Revelada', 3);
    ga4Tracking.offerRevealed();
    
    // REMOVIDO: scrollIntoView para a oferta
  };

  const revealVentana = () => {
    if (ventanaRevealed) return;
    setVentanaRevealed(true);
    setCurrentPhase(3);
    playKeySound();
    tracking.revelationViewed('72h_window');
    ga4Tracking.revelationViewed('Ventana 72 Horas', 2);
  };

  // --- EFEITO PRINCIPAL DE PROGRESSÃO ---
  useEffect(() => {
    ensureUTMs();
    tracking.pageView('resultado');
    ga4Tracking.resultPageView();

    const timeInterval = setInterval(() => setTimeOnPage(prev => prev + 1), 1000);

    // Loading acelerado (Alteração #1)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4; // Incremento de 4 em 4
      });
    }, 100);

    loadingSteps.forEach((step, index) => {
      setTimeout(() => setLoadingStep(index), step.duration);
    });

    // Fase 1: Diagnóstico em 2.5s (Alteração #1 e #10)
    const timerPhase1 = setTimeout(() => {
      setCurrentPhase(1);
      playKeySound();
      setTimeout(() => {
        diagnosticoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }, 2500); // NOVO TEMPO: 2.5s (fim do loading, início do diagnóstico)

    // Fase 2: Vídeo (Alteração #10)
    const timerPhase2 = setTimeout(() => {
      setCurrentPhase(2);
      playKeySound();
      tracking.vslEvent('started');
      setTimeout(() => {
        videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }, 12000); // NOVO TEMPO: 12s (9.5s após o diagnóstico)

    // Ventana 72h aparece 53s após o vídeo, ou 65s do início
    const timerPhase3 = setTimeout(() => {
      setCurrentPhase(3); // Janela 72h
      playKeySound();
      tracking.revelationViewed('72h_window');
      ga4Tracking.revelationViewed('Ventana 72 Horas', 2);
    }, 65000); // NOVO TEMPO: 65s (53s após o vídeo iniciar)

    // Oferta aparece 10s após a Ventana 72h, ou 75s do início
    const timerPhase4 = setTimeout(() => {
      setCurrentPhase(4); // Oferta
      playKeySound();
      tracking.revelationViewed('offer');
      ga4Tracking.revelationViewed('Oferta Revelada', 3);
      ga4Tracking.offerRevealed();
      // REMOVIDO: Scroll automático para a oferta
    }, 75000); // NOVO TEMPO: 75s (10s após a Janela 72h aparecer)

    const countdownInterval = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);

    // REMOVIDO: spotsInterval
    // REMOVIDO: Gamificação: Contador de pessoas comprando

    return () => {
      clearInterval(timeInterval);
      clearInterval(progressInterval);
      clearTimeout(timerPhase1);
      clearTimeout(timerPhase2);
      clearTimeout(timerPhase3); // Adicionado limpeza para timerPhase3
      clearTimeout(timerPhase4); // Adicionado limpeza para timerPhase4
      clearInterval(countdownInterval);
      // REMOVIDO: clearInterval(spotsInterval);
      // REMOVIDO: clearInterval(buyingInterval);
    };
  }, []);

  // Monitor de Interação para Revelação (Alteração #2 e #5)
  useEffect(() => {
    const checkReveals = () => {
      // Ventana 72h: Scroll 100px abaixo do vídeo ou 2 min após vídeo iniciar
      if (currentPhase >= 2 && !ventanaRevealed) {
        const videoBottom = videoSectionRef.current?.getBoundingClientRect().bottom || 0;
        if (videoBottom < -100 || timeOnPage >= 128) {
          revealVentana();
        }
      }

      // Oferta: Scroll abaixo do vídeo ou 5 min total na página
      if (!offerRevealed) {
        if (timeOnPage >= 300) {
          revealOffer();
        } else if (videoSectionRef.current) {
          const videoBottom = videoSectionRef.current.getBoundingClientRect().bottom;
          if (videoBottom < 0 && currentPhase >= 2) {
            revealOffer();
          }
        }
      }
    };

    window.addEventListener('scroll', checkReveals);
    const interval = setInterval(checkReveals, 1000);
    return () => {
      window.removeEventListener('scroll', checkReveals);
      clearInterval(interval);
    };
  }, [timeOnPage, currentPhase, offerRevealed, ventanaRevealed]);

  // Redirecionamento por expiração (Alteração #9)
  useEffect(() => {
    if (timeLeft <= 0 && currentPhase > 0) {
      alert('Tu análisis ha expirado. Por favor, completa el quiz nuevamente.');
      localStorage.removeItem('quiz_timer_start');
      window.location.href = '/';
    }
  }, [timeLeft, currentPhase]);

  // Injeção VTurb (MANTIDO)
  useEffect(() => {
    if (currentPhase !== 2 || !videoSectionRef.current) return;
    const timer = setTimeout(() => {
      if (videoSectionRef.current) {
        // Encontrar o placeholder correto dentro da seção do vídeo
        const vslPlaceholder = videoSectionRef.current.querySelector('.vsl-placeholder');
        if (vslPlaceholder) {
          vslPlaceholder.innerHTML = `
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

      {/* BARRA DE PROGRESSO UNIFICADA (Alteração #4) */}
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
        
        {/* LOADING ACELERADO (Alteração #1) */}
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

        {/* FASE 1: DIAGNÓSTICO (Alteração #6 e #11) */}
        {currentPhase >= 1 && (
          <div ref={diagnosticoSectionRef} className={`revelation fade-in ${currentPhase === 1 ? 'diagnostic-pulse' : ''}`}>
            <div className="revelation-header">
              <div className="revelation-icon">💔</div>
              <h2>{getTitle(gender)}</h2>
            </div>
            
            {/* BOX DE DADOS REAIS (Alteração #6) */}
            <div className="quiz-summary-box">
              <p className="summary-title">📋 TU SITUACIÓN ESPECÍFICA</p>
              <div className="summary-grid">
                <div><span>✓</span> <strong>Tiempo:</strong> {quizData.timeSeparation || 'No especificado'}</div>
                <div><span>✓</span> <strong>Quién terminó:</strong> {quizData.whoEnded || 'No especificado'}</div>
                <div><span>✓</span> <strong>Contacto:</strong> {quizData.currentSituation || 'No especificado'}</div>
                <div><span>✓</span> <strong>Compromiso:</strong> {quizData.commitmentLevel || 'No especificado'}</div>
              </div>
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
              <div className="vsl-placeholder"></div> {/* REMOVIDO: ref={videoSectionRef} */}
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

        {/* BOTÃO REVELAR OFERTA (Alteração #2) */}
        {currentPhase >= 3 && !offerRevealed && (
          <div className="manual-reveal-container">
            <button onClick={revealOffer} className="btn-reveal-offer">🎯 QUIERO VER LA SOLUCIÓN AHORA</button>
            <p>👆 Haz clic para acceder a la oferta exclusiva</p>
          </div>
        )}

        {/* FASE 4: OFERTA (Alteração #3, #7, #8) */}
        {currentPhase >= 4 && (
          <div ref={offerSectionRef} className="revelation fade-in offer-section-custom">
            <div className="offer-badge">OFERTA EXCLUSIVA</div>
            <h2 className="offer-title-main">{getOfferTitle(gender)}</h2>

            {/* PREÇO E DESCONTO (Alteração #7) */}
            <div className="price-box">
              <p className="price-old">Precio regular: R$ 297</p>
              <p className="price-new">R$ 97</p>
              <p className="price-discount">💰 67% de descuento HOY</p>
            </div>

            <button className="cta-buy-final" onClick={handleCTAClick}>
              🎯 ACCEDER AL MÉTODO COMPLETO AHORA
            </button>

            {/* PROVA SOCIAL REAL (Alteração #3) */}
            <div className="real-proof-box">
              <p>⭐ <strong>4.8/5 estrellas</strong> (2.341 avaliações verificadas)</p>
              <p>📱 Última compra hace 4 minutos</p>
            </div>

            <div className="trust-icons">
              <span>🔒 Compra segura</span>
              <span>✅ Acceso instantáneo</span>
              <span>↩️ 30 días de garantía</span> {/* CORRIGIDO: 7 para 30 dias */}
            </div>

            {/* REMOVIDO: JUSTIFICATIVA DE SPOTS (Alteração #8) */}
            <div className="final-urgency-grid">
              <div className="urgency-item">
                <span>Tiempo restante:</span>
                <strong>{formatTime(timeLeft)}</strong>
              </div>
              {/* REMOVIDO: Bloco de spots disponibles */}
            </div>

            {/* REMOVIDO: GAMIFICAÇÃO: CONTADOR DE PESSOAS COMPRANDO */}
            {/* <p className="people-buying-counter" style={{ ... }}> ... </p> */}

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

      {/* STICKY FOOTER (Alteração #9) */}
      {offerRevealed && (
        <div className="sticky-footer-urgency fade-in-up">
          ⏰ {formatTime(timeLeft)} {/* CORRIGIDO: Removido spots restantes */}
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
        .quiz-summary-box { background: rgba(234, 179, 8, 0.1); border: 2px solid rgba(234, 179, 8, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; }
        .summary-grid span { color: #4ade80; }
        .price-box { text-align: center; margin-bottom: 25px; }
        .price-old { text-decoration: line-through; opacity: 0.6; margin: 0; }
        .price-new { font-size: 3rem; color: #facc15; font-weight: 900; margin: 5px 0; }
        .price-discount { color: #4ade80; font-weight: bold; }
        .cta-buy-final { width: 100%; background: #eab308; color: black; font-weight: 900; padding: 20px; border-radius: 12px; font-size: 1.5rem; border: 3px solid white; cursor: pointer; }
        .real-proof-box { background: rgba(74, 222, 128, 0.1); border: 2px solid rgba(74, 222, 128, 0.3); border-radius: 12px; padding: 15px; text-align: center; color: #4ade80; margin: 20px 0; }
        .trust-icons { display: flex; justify-content: center; gap: 15px; color: #4ade80; font-size: 0.85rem; margin-bottom: 20px; }
        .btn-reveal-offer { background: linear-gradient(135deg, #eab308, #facc15); color: black; font-weight: 900; font-size: 1.3rem; padding: 18px 30px; border-radius: 12px; border: 3px solid white; cursor: pointer; }
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
      `}</style>
    </div>
  );
}