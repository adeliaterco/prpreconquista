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
import { getEmotionalValidation, getSituationInsight } from '../utils/emotionalValidation';

interface ResultProps {
  onNavigate: (page: string) => void;
}

export default function Result({ onNavigate }: ResultProps) {
  // --- ESTADOS ORIGINAIS PRESERVADOS ---
  const [currentPhase, setCurrentPhase] = useState(0); 
  const [headerActivePhase, setHeaderActivePhase] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(47 * 60); 
  const [spotsLeft, setSpotsLeft] = useState(storage.getSpotsLeft());
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [peopleBuying, setPeopleBuying] = useState(Math.floor(Math.random() * 5) + 1);
  const [timeOnPage, setTimeOnPage] = useState(0); // Para controle da barra de retenção

  const quizData = storage.getQuizData();
  const diagnosticoSectionRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const ventana72SectionRef = useRef<HTMLDivElement>(null);
  const offerSectionRef = useRef<HTMLDivElement>(null);

  const gender = quizData.gender || 'HOMBRE';

  // MELHORIA #1: Loading acelerado para 3s (Evita drop-off no tráfego pago)
  const loadingSteps = [
    { icon: '📊', text: 'Respuestas procesadas', duration: 0 },
    { icon: '🔍', text: 'Identificando patrones...', duration: 1000 },
    { icon: '🧠', text: 'Generando diagnóstico...', duration: 2000 },
    { icon: '📋', text: getLoadingMessage(gender), duration: 3000 }
  ];

  // --- SISTEMA DE UTMs (ORIGINAL E INTACTO) ---
  const getUTMs = (): Record<string, string> => {
    try {
      const storedUTMs = localStorage.getItem('quiz_utms');
      return storedUTMs ? JSON.parse(storedUTMs) : {};
    } catch (error) { return {}; }
  };

  const ensureUTMs = () => {
    const utms = getUTMs();
    if (Object.keys(utms).length > 0 && window.location.search === '') {
      const utmString = Object.entries(utms).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
      window.history.replaceState({}, '', `${window.location.pathname}?${utmString}`);
    }
  };

  const appendUTMsToHotmartURL = (): string => {
    const baseURL = getHotmartUrl();
    const utms = getUTMs();
    if (Object.keys(utms).length === 0) return baseURL;
    const url = new URL(baseURL);
    Object.entries(utms).forEach(([k, v]) => url.searchParams.set(k, v as string));
    return url.toString();
  };

  // --- EFEITO PRINCIPAL DE PROGRESSÃO ---
  useEffect(() => {
    ensureUTMs();
    tracking.pageView('resultado');
    ga4Tracking.resultPageView();

    const timeInterval = setInterval(() => setTimeOnPage(prev => prev + 1), 1000);

    // Loading Progress (Ajustado para 3s)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => (prev >= 100 ? 100 : prev + 4));
    }, 120);

    loadingSteps.forEach((step, index) => {
      setTimeout(() => setLoadingStep(index), step.duration);
    });

    // Fase 1: Diagnóstico (3s)
    const timerPhase1 = setTimeout(() => {
      setCurrentPhase(1);
      setHeaderActivePhase(1);
      playKeySound();
    }, 3000);

    // Fase 2: Vídeo (5s após diagnóstico)
    const timerPhase2 = setTimeout(() => {
      setCurrentPhase(2);
      setHeaderActivePhase(2);
      playKeySound();
      tracking.vslEvent('started');
    }, 8000);

    // Fase 3 e 4: Liberação por tempo (Fallback de segurança)
    const timerPhase3 = setTimeout(() => {
      if (currentPhase < 3) {
        setCurrentPhase(3);
        setHeaderActivePhase(3);
      }
    }, 180000); // 3 minutos

    const countdownInterval = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(progressInterval);
      clearTimeout(timerPhase1);
      clearTimeout(timerPhase2);
      clearTimeout(timerPhase3);
      clearInterval(countdownInterval);
    };
  }, []);

  // --- INJEÇÃO VTURB (ORIGINAL) ---
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

  // --- DETECÇÃO DE SCROLL PARA HEADER (ORIGINAL) ---
  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      let newHeaderActivePhase = headerActivePhase;
      if (offerSectionRef.current && offerSectionRef.current.getBoundingClientRect().top < viewportCenter) newHeaderActivePhase = 4;
      else if (ventana72SectionRef.current && ventana72SectionRef.current.getBoundingClientRect().top < viewportCenter) newHeaderActivePhase = 3;
      else if (videoSectionRef.current && videoSectionRef.current.getBoundingClientRect().top < viewportCenter) newHeaderActivePhase = 2;
      else if (diagnosticoSectionRef.current && diagnosticoSectionRef.current.getBoundingClientRect().top < viewportCenter) newHeaderActivePhase = 1;
      if (newHeaderActivePhase !== headerActivePhase) setHeaderActivePhase(newHeaderActivePhase);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headerActivePhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const phases = ['Diagnóstico', 'Vídeo', 'Ventana 72h', 'Solución'];

  return (
    <div className="result-container">
      <div className="result-header">
        <h1 className="result-title">Tu Plan Personalizado Está Listo</h1>
        <div className="urgency-bar">
          <span className="urgency-icon">⚠</span>
          <span className="urgency-text">Tiempo para acceder: {formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* BARRA DE PROGRESSO (CABEÇALHO) */}
      {currentPhase > 0 && (
        <div className="progress-bar-container fade-in">
          {phases.map((label, index) => (
            <div key={index} className={`progress-step ${headerActivePhase > index + 1 ? 'completed' : ''} ${headerActivePhase === index + 1 ? 'active' : ''}`}>
              <div className="step-circle">{headerActivePhase > index + 1 ? '✅' : index + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="revelations-container">
        {/* LOADING ACELERADO */}
        {currentPhase === 0 && (
          <div className="revelation fade-in loading-box-custom">
            <div className="loading-content">
              <div className="spin-brain">🧠</div>
              <h2>ANALIZANDO TU CASO</h2>
              <p>{getLoadingMessage(gender)}</p>
              <div className="loading-steps-list">
                {loadingSteps.map((step, i) => (
                  <div key={i} className={`step-item ${i <= loadingStep ? 'active' : ''}`}>
                    {i < loadingStep ? '✅' : step.icon} {step.text}
                  </div>
                ))}
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${loadingProgress}%` }}></div></div>
            </div>
          </div>
        )}

        {/* FASE 1: DIAGNÓSTICO */}
        {currentPhase >= 1 && (
          <div ref={diagnosticoSectionRef} className="revelation fade-in">
            <div className="revelation-header">💔 <h2>{getTitle(gender)}</h2></div>
            <p className="revelation-text" style={{ whiteSpace: 'pre-line' }}>{getCopy(quizData)}</p>
            <div className="emotional-box">
              <p><strong>Tu situación específica:</strong><br />{getEmotionalValidation(quizData)}</p>
            </div>
          </div>
        )}

        {/* FASE 2: VÍDEO + AVISO DE RETENÇÃO */}
        {currentPhase >= 2 && (
          <div ref={videoSectionRef} className="revelation fade-in vsl-revelation">
            <div className="revelation-header">🎥 <h2>Cómo Reactivar Los Interruptores Emocionales</h2></div>
            <div className="vsl-container"><div ref={videoSectionRef} className="vsl-placeholder"></div></div>
            
            {/* MELHORIA #2: Aviso de Retenção abaixo do vídeo */}
            {currentPhase < 4 && (
              <div className="retention-notice">
                <div className="retention-loader">
                  <div className="loader-dot"></div>
                  <span>GENERANDO TU PROTOCOLO DE 21 DÍAS...</span>
                </div>
                <div className="retention-progress-bar">
                  <div className="retention-progress-fill" style={{ width: `${Math.min(timeOnPage * 0.4, 98)}%` }}></div>
                </div>
                <p className="retention-text">
                  {timeOnPage < 40 ? "🔍 Analizando patrones de comportamiento..." : 
                   timeOnPage < 80 ? "⚡ Calculando ventana de 72 horas..." : 
                   "🎁 Finalizando tu oferta especial de $9,90..."}
                </p>
                <p className="retention-sub">No cierres esta página. El resto del contenido se liberará automáticamente en unos instantes.</p>
              </div>
            )}
          </div>
        )}

        {/* FASE 3: VENTANA 72H */}
        {currentPhase >= 3 && (
          <div ref={ventana72SectionRef} className="revelation fade-in ventana-box">
            <div className="ventana-card">
              <div className="ventana-icon">⚡</div>
              <h2>LA VENTANA DE 72 HORAS</h2>
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
          </div>
        )}

        {/* FASE 4: OFERTA IMPECÁVEL (ROADMAP 21 DIAS) */}
        {currentPhase >= 4 && (
          <div ref={offerSectionRef} className="revelation fade-in offer-section">
            <div className="offer-tag">OFERTA EXCLUSIVA</div>
            <h2 className="offer-title-main">{getOfferTitle(gender)}</h2>

            {/* MELHORIA #3: Roadmap Visual Passo a Passo */}
            <div className="roadmap-21-days">
              <div className="roadmap-step">
                <div className="step-day">DÍAS 1-7</div>
                <div className="step-info">
                  <strong>Fase de Conexión Subconsciente</strong>
                  <p>Protocolos para derribar las barreras defensivas de {gender === 'HOMBRE' ? 'ella' : 'él'}.</p>
                </div>
              </div>
              <div className="roadmap-step">
                <div className="step-day">DÍAS 8-14</div>
                <div className="step-info">
                  <strong>Reactivación de la Atracción</strong>
                  <p>El paso a paso para el primer encuentro y reencender la chispa.</p>
                </div>
              </div>
              <div className="roadmap-step">
                <div className="step-day">DÍAS 15-21</div>
                <div className="step-info">
                  <strong>Consolidación del Regreso</strong>
                  <p>Cómo sellar el compromiso y asegurar que la relación sea inquebrantable.</p>
                </div>
              </div>
            </div>

            {/* MELHORIA #4: Preço $9,90 e Garantia 30 Dias */}
            <div className="price-container-final">
              <p className="price-anchor">Precio regular: $67</p>
              <p className="price-main">$9,90</p>
              <p className="price-save">💰 AHORRAS $57,10 HOY</p>
            </div>

            <button className="cta-buy-final" onClick={() => window.open(appendUTMsToHotmartURL(), '_blank')}>
              {getCTA(gender)}
            </button>

            <div className="guarantee-badge-30">
              <img src="https://cdn-icons-png.flaticon.com/512/3503/3503458.png" alt="Garantia" />
              <div>
                <strong>GARANTÍA TOTAL DE 30 DÍAS</strong>
                <p>Si no recuperas a tu pareja en 30 días, te devolvemos el 100% de tu dinero.</p>
              </div>
            </div>

            <div className="social-proof-footer">
              ⭐ <strong>4.8/5</strong> (+12.847 reconquistas exitosas)
            </div>
          </div>
        )}
      </div>

      {/* STICKY BAR */}
      {currentPhase >= 4 && (
        <div className="sticky-urgency-bar fade-in-up">
          ⏰ {formatTime(timeLeft)} • {spotsLeft} spots restantes
        </div>
      )}

      <style jsx>{`
        .result-container { padding-bottom: 100px; max-width: 650px; margin: 0 auto; font-family: sans-serif; }
        .loading-box-custom { background: rgba(234, 179, 8, 0.1); border: 2px solid #eab308; border-radius: 16px; padding: 40px; text-align: center; }
        .spin-brain { font-size: 4rem; animation: spin 2s linear infinite; margin-bottom: 20px; }
        .progress-track { width: 100%; height: 10px; background: #222; border-radius: 10px; margin-top: 25px; overflow: hidden; }
        .progress-fill { height: 100%; background: #eab308; transition: width 0.3s; }
        
        .retention-notice { background: rgba(234, 179, 8, 0.05); border: 1px solid #eab30844; border-radius: 12px; padding: 20px; margin-top: 20px; text-align: center; }
        .retention-loader { display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: bold; color: #eab308; font-size: 0.9rem; }
        .loader-dot { width: 8px; height: 8px; background: #eab308; border-radius: 50%; animation: pulse 1.5s infinite; }
        .retention-progress-bar { width: 100%; height: 6px; background: #111; border-radius: 10px; margin: 15px 0; overflow: hidden; }
        .retention-progress-fill { height: 100%; background: #eab308; transition: width 1s linear; }
        .retention-text { color: #fde047; font-weight: bold; margin: 10px 0; font-size: 0.95rem; }
        .retention-sub { font-size: 0.8rem; opacity: 0.7; color: white; }

        .roadmap-21-days { margin: 30px 0; display: flex; flex-direction: column; gap: 15px; }
        .roadmap-step { display: flex; gap: 15px; background: #111; padding: 18px; border-radius: 12px; border-left: 5px solid #eab308; align-items: center; }
        .step-day { font-weight: 900; color: #eab308; min-width: 85px; font-size: 1.1rem; }
        .step-info p { margin: 5px 0 0; font-size: 0.9rem; opacity: 0.8; line-height: 1.4; }

        .price-container-final { text-align: center; margin: 35px 0; }
        .price-anchor { text-decoration: line-through; opacity: 0.5; margin: 0; font-size: 1.1rem; }
        .price-main { font-size: 4.5rem; color: #facc15; font-weight: 900; margin: 5px 0; }
        .price-save { color: #4ade80; font-weight: bold; font-size: 1.1rem; }

        .cta-buy-final { width: 100%; background: #eab308; color: black; font-weight: 900; padding: 22px; border-radius: 14px; font-size: 1.5rem; border: 4px solid white; cursor: pointer; transition: transform 0.2s; }
        .cta-buy-final:active { transform: scale(0.98); }

        .guarantee-badge-30 { display: flex; gap: 15px; align-items: center; margin-top: 30px; background: rgba(6, 78, 59, 0.2); padding: 20px; border-radius: 12px; border: 1px solid #05966955; }
        .guarantee-badge-30 img { width: 45px; }
        .guarantee-badge-30 p { font-size: 0.85rem; margin: 5px 0 0; opacity: 0.8; }

        .progress-bar-container { display: flex; justify-content: space-between; padding: 15px; background: rgba(0,0,0,0.8); position: sticky; top: 0; z-index: 1000; backdrop-filter: blur(8px); border-bottom: 1px solid #333; }
        .progress-step { flex: 1; display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; color: rgba(255,255,255,0.5); }
        .step-circle { width: 30px; height: 30px; border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; font-weight: bold; }
        .progress-step.active { color: #eab308; }
        .progress-step.active .step-circle { background: #eab308; color: black; }
        .progress-step.completed .step-circle { background: #4ade80; color: white; }

        .emotional-box { background: rgba(74, 222, 128, 0.1); border: 1px solid #4ade8044; border-radius: 12px; padding: 20px; margin-top: 20px; color: #4ade80; }
        .sticky-urgency-bar { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.95); padding: 15px; color: #fde047; text-align: center; z-index: 1001; border-top: 2px solid #eab308; font-weight: bold; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}