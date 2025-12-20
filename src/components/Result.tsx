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
  // --- ESTADOS DE CONTROLE ---
  const [currentPhase, setCurrentPhase] = useState(0); 
  const [offerRevealed, setOfferRevealed] = useState(false);
  const [ventanaRevealed, setVentanaRevealed] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  // --- PERSISTÊNCIA DO TIMER (47 MINUTOS) ---
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
  const quizData = storage.getQuizData();
  const gender = quizData.gender || 'HOMBRE';

  // REFS PARA SCROLL E VÍDEO
  const diagnosticoSectionRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const ventana72SectionRef = useRef<HTMLDivElement>(null);
  const offerSectionRef = useRef<HTMLDivElement>(null);

  // ACELERAÇÃO DO FUNIL: Loading de 2.5s
  const loadingSteps = [
    { icon: '📊', text: 'Procesando respuestas...', duration: 0 },
    { icon: '🧠', text: 'Generando diagnóstico personalizado...', duration: 1200 }
  ];

  // --- SISTEMA DE UTMs ---
  const getUTMs = (): Record<string, string> => {
    try {
      const storedUTMs = localStorage.getItem('quiz_utms');
      return storedUTMs ? JSON.parse(storedUTMs) : {};
    } catch (error) { return {}; }
  };

  const appendUTMsToHotmartURL = (): string => {
    const baseURL = getHotmartUrl();
    const utms = getUTMs();
    if (Object.keys(utms).length === 0) return baseURL;
    const url = new URL(baseURL);
    Object.entries(utms).forEach(([key, value]) => url.searchParams.set(key, value as string));
    return url.toString();
  };

  // --- LÓGICAS DE REVELAÇÃO ---
  const revealOffer = () => {
    if (offerRevealed) return;
    setOfferRevealed(true);
    setCurrentPhase(4);
    playKeySound();
    ga4Tracking.offerRevealed();
    setTimeout(() => offerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
  };

  const revealVentana = () => {
    if (ventanaRevealed) return;
    setVentanaRevealed(true);
    setCurrentPhase(3);
    playKeySound();
  };

  // --- EFEITO PRINCIPAL ---
  useEffect(() => {
    tracking.pageView('resultado');
    ga4Tracking.resultPageView();

    const timeInterval = setInterval(() => setTimeOnPage(prev => prev + 1), 1000);

    // Loading Acelerado (2.5s)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => (prev >= 100 ? 100 : prev + 4));
    }, 100);

    loadingSteps.forEach((step, index) => {
      setTimeout(() => setLoadingStep(index), step.duration);
    });

    // Fase 1: Diagnóstico (2.5s)
    setTimeout(() => {
      setCurrentPhase(1);
      playKeySound();
    }, 2500);

    // Fase 2: Vídeo (8s totais)
    setTimeout(() => {
      setCurrentPhase(2);
      playKeySound();
      tracking.vslEvent('started');
    }, 8000);

    const countdownInterval = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(progressInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  // Monitor de Scroll para Revelação
  useEffect(() => {
    const checkReveals = () => {
      if (currentPhase >= 2 && !ventanaRevealed) {
        const videoBottom = videoSectionRef.current?.getBoundingClientRect().bottom || 0;
        if (videoBottom < -100 || timeOnPage >= 128) revealVentana();
      }
      if (!offerRevealed) {
        if (timeOnPage >= 300) revealOffer();
        else if (videoSectionRef.current && videoSectionRef.current.getBoundingClientRect().bottom < 0 && currentPhase >= 2) revealOffer();
      }
    };
    window.addEventListener('scroll', checkReveals);
    return () => window.removeEventListener('scroll', checkReveals);
  }, [timeOnPage, currentPhase, offerRevealed, ventanaRevealed]);

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

  const phases = ['Diagnóstico', 'Vídeo', 'Ventana 72h', 'Solución'];

  return (
    <div className="result-container">
      {/* HEADER E BARRA DE PROGRESSO */}
      <div className="result-header">
        <h1 className="result-title">Tu Plan Personalizado Está Listo</h1>
        <div className="urgency-bar">
          <span className="urgency-text">⏱️ Tu análisis expira en: {formatTime(timeLeft)}</span>
        </div>
      </div>

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
        {/* 0. LOADING ACELERADO */}
        {currentPhase === 0 && (
          <div className="revelation fade-in loading-box">
            <div className="spin-brain">🧠</div>
            <h2>ANALIZANDO TU CASO</h2>
            <p>{getLoadingMessage(gender)}</p>
            <div className="loading-steps">
              {loadingSteps.map((step, i) => (
                <div key={i} className={`step-item ${i <= loadingStep ? 'active' : ''}`}>
                  {i < loadingStep ? '✅' : step.icon} {step.text}
                </div>
              ))}
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${loadingProgress}%` }}></div></div>
          </div>
        )}

        {/* 1. DIAGNÓSTICO COM DADOS REAIS */}
        {currentPhase >= 1 && (
          <div ref={diagnosticoSectionRef} className="revelation fade-in">
            <div className="revelation-header">💔 <h2>{getTitle(gender)}</h2></div>
            <div className="quiz-data-summary">
              <p className="summary-title">📋 RESUMEN DE TU SITUACIÓN</p>
              <div className="data-grid">
                <div><span>✓</span> <strong>Tiempo:</strong> {quizData.timeSeparation}</div>
                <div><span>✓</span> <strong>Ruptura:</strong> {quizData.whoEnded}</div>
                <div><span>✓</span> <strong>Contacto:</strong> {quizData.currentSituation}</div>
              </div>
            </div>
            <p className="revelation-text">{getCopy(quizData)}</p>
          </div>
        )}

        {/* 2. VÍDEO + COMPONENTE DE RETENÇÃO */}
        {currentPhase >= 2 && (
          <div ref={videoSectionRef} className="revelation fade-in vsl-revelation">
            <div className="revelation-header">🎥 <h2>Cómo Reactivar Los Interruptores Emocionales</h2></div>
            <div className="vsl-container"><div className="vsl-placeholder"></div></div>
            
            {/* COMPONENTE DE RETENÇÃO INTELIGENTE */}
            {!offerRevealed && (
              <div className="retention-box">
                <div className="retention-header">
                  <div className="pulse-dot"></div>
                  <span>GENERANDO TU PROTOCOLO DE 21 DÍAS...</span>
                </div>
                <div className="retention-progress-track">
                  <div className="retention-progress-fill" style={{ width: `${Math.min(timeOnPage * 0.5, 98)}%` }}></div>
                </div>
                <p className="retention-msg">
                  {timeOnPage < 60 ? "🔍 Analizando patrones de comportamiento..." : 
                   timeOnPage < 120 ? "⚡ Calculando ventana de 72 horas..." : 
                   "🎁 Finalizando tu oferta especial de $9,90..."}
                </p>
                <p className="retention-subtext">No cierres esta página para no perder tu lugar.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. VENTANA 72H */}
        {currentPhase >= 3 && (
          <div ref={ventana72SectionRef} className="revelation fade-in ventana-box">
            <h2>⚡ LA VENTANA DE 72 HORAS</h2>
            <p>{getVentana72Copy(gender)}</p>
            <div className="fases-grid">
              {[1, 2, 3].map(f => (
                <div key={f} className="fase-card">
                  <strong>FASE {f}</strong>
                  <p>{getFaseText(gender, f)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTÃO DE REVELAÇÃO MANUAL */}
        {currentPhase >= 3 && !offerRevealed && (
          <div className="manual-reveal">
            <button onClick={revealOffer} className="btn-reveal">🎯 VER MI PLAN DE 21 DÍAS AHORA</button>
          </div>
        )}

        {/* 4. OFERTA IMPECÁVEL (ROADMAP 21 DIAS) */}
        {currentPhase >= 4 && (
          <div ref={offerSectionRef} className="revelation fade-in offer-section">
            <div className="offer-badge">OFERTA ÚNICA Y EXCLUSIVA</div>
            <h2 className="offer-title">{getOfferTitle(gender)}</h2>

            {/* ROADMAP VISUAL DE 21 DIAS */}
            <div className="roadmap-container">
              <div className="roadmap-item">
                <div className="roadmap-day">DÍAS 1-7</div>
                <div className="roadmap-content">
                  <strong>Fase de Conexión Subconsciente</strong>
                  <p>Cómo hablar con {gender === 'HOMBRE' ? 'ella' : 'él'} para derribar sus barreras defensivas.</p>
                </div>
              </div>
              <div className="roadmap-item">
                <div className="roadmap-day">DÍAS 8-14</div>
                <div className="roadmap-content">
                  <strong>Reactivación de la Atracción</strong>
                  <p>El protocolo exacto para el primer encuentro tras la separación.</p>
                </div>
              </div>
              <div className="roadmap-item">
                <div className="roadmap-day">DÍAS 15-21</div>
                <div className="roadmap-content">
                  <strong>Consolidación y Regreso</strong>
                  <p>Cómo sellar el compromiso y asegurar que no se vuelva a ir.</p>
                </div>
              </div>
            </div>

            {/* PREÇO E ANCORAGEM */}
            <div className="price-container">
              <p className="old-price">Precio regular: $67</p>
              <p className="new-price">$9,90</p>
              <p className="discount-tag">💰 AHORRAS $57,10 HOY</p>
            </div>

            <button className="cta-buy pulse" onClick={() => window.open(appendUTMsToHotmartURL(), '_blank')}>
              {getCTA(gender)}
            </button>

            <div className="guarantee-box">
              <img src="https://cdn-icons-png.flaticon.com/512/3503/3503458.png" alt="Garantia" />
              <div>
                <strong>GARANTÍA TOTAL DE 30 DÍAS</strong>
                <p>Si no ves resultados en 30 días, te devolvemos cada centavo.</p>
              </div>
            </div>

            <div className="social-proof-static">
              ⭐ <strong>4.8/5</strong> (2.341 personas ya recuperaron su relación)
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .result-container { padding-bottom: 80px; max-width: 600px; margin: 0 auto; }
        .loading-box { background: rgba(234, 179, 8, 0.1); border: 2px solid #eab308; border-radius: 16px; padding: 40px; text-align: center; }
        .spin-brain { font-size: 4rem; animation: spin 2s linear infinite; }
        .progress-track { width: 100%; height: 10px; background: #222; border-radius: 10px; margin-top: 20px; overflow: hidden; }
        .progress-fill { height: 100%; background: #eab308; transition: width 0.3s; }
        
        .quiz-data-summary { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #eab30833; }
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; }
        .data-grid span { color: #4ade80; }

        .retention-box { background: rgba(234, 179, 8, 0.05); border: 1px solid #eab30855; border-radius: 12px; padding: 20px; margin-top: 20px; text-align: center; }
        .pulse-dot { width: 8px; height: 8px; background: #eab308; border-radius: 50%; display: inline-block; margin-right: 10px; animation: pulse 1.5s infinite; }
        .retention-progress-track { width: 100%; height: 6px; background: #222; border-radius: 10px; margin: 15px 0; }
        .retention-progress-fill { height: 100%; background: #eab308; transition: width 1s linear; }
        .retention-msg { color: #fde047; font-weight: bold; font-size: 0.9rem; }

        .roadmap-container { margin: 30px 0; display: flex; flexDirection: column; gap: 15px; }
        .roadmap-item { display: flex; gap: 15px; background: #111; padding: 15px; border-radius: 10px; border-left: 4px solid #eab308; }
        .roadmap-day { font-weight: 900; color: #eab308; min-width: 80px; }

        .price-container { text-align: center; margin: 30px 0; }
        .old-price { text-decoration: line-through; opacity: 0.5; margin: 0; }
        .new-price { font-size: 4rem; color: #facc15; font-weight: 900; margin: 0; }
        .discount-tag { color: #4ade80; font-weight: bold; }

        .cta-buy { width: 100%; background: #eab308; color: black; font-weight: 900; padding: 22px; border-radius: 12px; font-size: 1.4rem; border: 3px solid white; cursor: pointer; }
        .guarantee-box { display: flex; gap: 15px; align-items: center; margin-top: 25px; background: #064e3b33; padding: 15px; border-radius: 10px; border: 1px solid #05966944; }
        .guarantee-box img { width: 40px; }
        .guarantee-box p { font-size: 0.8rem; margin: 0; opacity: 0.8; }

        .progress-bar-container { display: flex; justify-content: space-between; padding: 15px; background: #000; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #333; }
        .step-circle { width: 28px; height: 28px; border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        .progress-step.active .step-circle { background: #eab308; color: black; }
        .progress-step.completed .step-circle { background: #4ade80; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}