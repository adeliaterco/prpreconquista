import { useState, useEffect, useRef, useCallback } from 'react'; // Adicionado useCallback
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
    // currentPhase: 0: Loading, 1: Diagnosis, 2: Video, 3: Ventana, 4: Offer
    const [currentPhase, setCurrentPhase] = useState(0); 
    // Tempo em milissegundos que o usuário está na fase atual
    const [timeInCurrentPhase, setTimeInCurrentPhase] = useState(0); 
    // Timestamp de quando a fase atual começou
    const [phaseStartTime, setPhaseStartTime] = useState(Date.now()); 
    // Delay dinâmico para o VSL em ms
    const [vslUnlockDelay, setVslUnlockDelay] = useState(0); 
    // Estado para controlar se o botão de VSL foi clicado
    const [vslButtonClicked, setVslButtonClicked] = useState(false); 
    // Estado para controlar se o VSL já foi injetado
    const [vslInjected, setVslInjected] = useState(false); 

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

    // --- FUNÇÃO PARA AVANÇAR DE FASE (MANUAL OU AUTOMÁTICO) ---
    const handleContinueClick = useCallback((nextPhase: number, triggeredBy: 'manual' | 'timeout') => {
        const timeSpent = Date.now() - phaseStartTime; // Tempo gasto na fase atual
        
        // Envia evento GA4 de progressão de fase
        ga4Tracking.phaseProgressionClicked(currentPhase, nextPhase, timeSpent);

        // Se for um timeout, envia um evento de warning
        if (triggeredBy === 'timeout') {
            ga4Tracking.phaseTimeoutWarning(currentPhase, Math.round(timeSpent / 1000));
        }

        setCurrentPhase(nextPhase);
        setPhaseStartTime(Date.now()); // Reseta o timer para a nova fase
        setTimeInCurrentPhase(0); // Reseta o contador de tempo na fase
        playKeySound(); // Toca som de transição
        
        // Tracking específico para cada fase
        if (nextPhase === 1) {
            tracking.revelationViewed('why_left');
            ga4Tracking.revelationViewed('Por qué te dejó', 1);
        } else if (nextPhase === 2) {
            tracking.vslEvent('started');
            ga4Tracking.videoStarted();
        } else if (nextPhase === 3) {
            tracking.revelationViewed('72h_window');
            ga4Tracking.revelationViewed('Ventana 72 Horas', 2);
        } else if (nextPhase === 4) {
            tracking.revelationViewed('offer');
            ga4Tracking.revelationViewed('Oferta Revelada', 3);
            ga4Tracking.offerRevealed();
            // Envia evento GA4 quando a seção de oferta é alcançada
            ga4Tracking.offerSectionReached(triggeredBy === 'manual' ? 'manual' : `timeout_phase${currentPhase}`, Date.now() - localStorage.getItem('quiz_timer_start') ? parseInt(localStorage.getItem('quiz_timer_start')!) : 0);
        }
    }, [currentPhase, phaseStartTime]); // Dependências para useCallback

    // --- EFEITO PRINCIPAL DE INICIALIZAÇÃO E LOADING ---
    useEffect(() => {
        ensureUTMs();
        tracking.pageView('resultado');
        ga4Tracking.resultPageView();

        // Inicia o timer de tempo na fase atual
        const interval = setInterval(() => {
            setTimeInCurrentPhase(prev => prev + 100);
        }, 100);

        // Loading acelerado
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    // Após o loading, avança para a Fase 1 (Diagnóstico)
                    handleContinueClick(1, 'timeout'); // Considera como timeout para iniciar a primeira fase
                    return 100;
                }
                return prev + 4;
            });
        }, 100);

        loadingSteps.forEach((step, index) => {
            setTimeout(() => setLoadingStep(index), step.duration);
        });

        // Limpeza dos intervalos e timeouts
        return () => {
            clearInterval(interval);
            clearInterval(progressInterval);
        };
    }, []); // Executa apenas uma vez na montagem

    // --- EFEITO PARA TIMERS DE URGÊNCIA (COUNTDOWN, SPOTS, PEOPLE BUYING) ---
    useEffect(() => {
        const countdownInterval = setInterval(() => setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1)), 1000);

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
            clearInterval(countdownInterval);
            clearInterval(spotsInterval);
            clearInterval(buyingInterval);
        };
    }, []); // Executa apenas uma vez na montagem

    // --- EFEITO PARA LÓGICA DE PROGRESSÃO HÍBRIDA (FALLBACK AUTOMÁTICO) ---
    useEffect(() => {
        let fallbackTimer: NodeJS.Timeout;
        const FALLBACK_TIMEOUT_MS = 15000; // 15 segundos para fases gerais
        const VSL_FALLBACK_TIMEOUT_MS = 20000; // 20 segundos para a fase do vídeo

        if (currentPhase === 1) { // Diagnóstico
            fallbackTimer = setTimeout(() => {
                handleContinueClick(2, 'timeout');
            }, FALLBACK_TIMEOUT_MS);
        } else if (currentPhase === 2 && !vslButtonClicked) { // Vídeo, mas botão de VSL não clicado
            // Se o botão do VSL não foi clicado, o fallback avança para a próxima fase
            fallbackTimer = setTimeout(() => {
                handleContinueClick(3, 'timeout');
            }, VSL_FALLBACK_TIMEOUT_MS);
        } else if (currentPhase === 3) { // Ventana 72h
            fallbackTimer = setTimeout(() => {
                handleContinueClick(4, 'timeout');
            }, FALLBACK_TIMEOUT_MS);
        }

        return () => {
            if (fallbackTimer) clearTimeout(fallbackTimer);
        };
    }, [currentPhase, handleContinueClick, vslButtonClicked]); // Depende de currentPhase e se o botão do VSL foi clicado

    // --- EFEITO PARA CALCULAR DELAY DINÂMICO DO VSL ---
    useEffect(() => {
        if (currentPhase === 2) {
            const timeInPhase1 = Date.now() - phaseStartTime; // Tempo gasto na Fase 1
            // Lógica de delay dinâmico: 3s, 5s, 8s
            const calculatedDelay = timeInPhase1 < 10000 ? 3000 : // Menos de 10s na fase 1 -> 3s de delay
                                    timeInPhase1 < 30000 ? 5000 : // Entre 10s e 30s na fase 1 -> 5s de delay
                                    8000; // Mais de 30s na fase 1 -> 8s de delay
            setVslUnlockDelay(calculatedDelay);
        }
    }, [currentPhase, phaseStartTime]); // Recalcula quando a fase muda para 2 ou phaseStartTime muda

    // --- INJEÇÃO VTURB (VSL) COM DELAY DINÂMICO ---
    useEffect(() => {
        // Só injeta o VSL se estiver na fase 2, o botão de VSL foi clicado e ainda não foi injetado
        if (currentPhase === 2 && vslButtonClicked && !vslInjected && videoSectionRef.current) {
            const timer = setTimeout(() => {
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
                    setVslInjected(true); // Marca que o VSL foi injetado
                    // Envia evento GA4 quando o vídeo é finalmente exibido
                    ga4Tracking.videoUnlockedViewed(0, vslUnlockDelay); // Duração do vídeo pode ser 0 ou obtida via API do VTurb
                }
            }, vslUnlockDelay); // Usa o delay dinâmico

            return () => clearTimeout(timer);
        }
    }, [currentPhase, vslButtonClicked, vslInjected, vslUnlockDelay]); // Depende do estado do VSL e do delay

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

    // Handler para o clique no botão "Desbloquear Vídeo"
    const handleUnlockVideoButtonClick = () => {
        setVslButtonClicked(true); // Marca que o botão foi clicado
        const timeToClick = Date.now() - phaseStartTime; // Tempo desde o início da fase 2
        ga4Tracking.videoButtonUnlocked(timeToClick, 'VSL Plan Personalizado');
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

            {/* BARRA DE PROGRESSO UNIFICADA */}
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
                
                {/* LOADING ACELERADO */}
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

                        {/* BOTÃO "CONTINUAR" PARA FASE 1 */}
                        {currentPhase === 1 && (
                            <button 
                                className="continue-button pulse" 
                                onClick={() => handleContinueClick(2, 'manual')}
                            >
                                CONTINUAR <span className="arrow">→</span>
                            </button>
                        )}
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
                            {/* Placeholder para o VSL ou botão de desbloqueio */}
                            {!vslButtonClicked && (
                                <div className="vsl-unlock-overlay">
                                    <button 
                                        className="unlock-vsl-button pulse" 
                                        onClick={handleUnlockVideoButtonClick}
                                    >
                                        DESBLOQUEAR VÍDEO <span className="arrow">→</span>
                                    </button>
                                    <p className="unlock-vsl-info">Haz clic para revelar el secreto de las 72 horas</p>
                                </div>
                            )}
                            {vslButtonClicked && !vslInjected && (
                                <div className="vsl-loading-spinner">
                                    <div className="spinner"></div>
                                    <p>Cargando vídeo...</p>
                                </div>
                            )}
                            <div className="vsl-placeholder"></div> 
                        </div>

                        {/* BOTÃO "CONTINUAR" PARA FASE 2 */}
                        {currentPhase === 2 && vslInjected && ( // Só mostra o botão se o VSL já foi injetado
                            <button 
                                className="continue-button pulse" 
                                onClick={() => handleContinueClick(3, 'manual')}
                            >
                                CONTINUAR <span className="arrow">→</span>
                            </button>
                        )}
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

                        {/* BOTÃO "CONTINUAR" PARA FASE 3 */}
                        {currentPhase === 3 && (
                            <button 
                                className="continue-button pulse" 
                                onClick={() => handleContinueClick(4, 'manual')}
                            >
                                CONTINUAR <span className="arrow">→</span>
                            </button>
                        )}
                    </div>
                )}

                {/* FASE 4: OFERTA (OTIMIZADA) */}
                {currentPhase >= 4 && (
                    <div ref={offerSectionRef} className="revelation fade-in offer-section-custom">
                        <div className="offer-badge">OFERTA EXCLUSIVA</div>
                        <h2 className="offer-title-main">{getOfferTitle(gender)}</h2>

                        {/* BOX DE DADOS DO QUIZ NA OFERTA */}
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
                            <p className="price-old">Precio regular: $67</p>
                            <p className="price-new">$9.90</p>
                            <p className="price-discount">💰 85% de descuento HOY</p>
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
                            <span>↩️ 30 días de garantía</span>
                        </div>

                        {/* GRID DE URGÊNCIA OTIMIZADO */}
                        <div className="final-urgency-grid-optimized">
                            <div className="urgency-item-compact">
                                <span style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', opacity: 0.8 }}>Tiempo:</span>
                                <strong style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>{formatTime(timeLeft)}</strong>
                            </div>
                            <div className="urgency-item-compact">
                                <span style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', opacity: 0.8 }}>Vacantes:</span>
                                <strong style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>{spotsLeft}/50</strong>
                            </div>
                        </div>

                        {/* CONTADOR DE PESSOAS COMPRANDO (REDUZIDO) */}
                        <p className="people-buying-counter" style={{
                            textAlign: 'center',
                            color: 'rgb(74, 222, 128)',
                            fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                            marginTop: 'clamp(12px, 3vw, 16px)',
                            marginBottom: 'clamp(8px, 2vw, 12px)',
                            lineHeight: '1.5',
                            fontWeight: '500',
                            opacity: 0.85
                        }}>
                            ✨ {peopleBuying} comprando ahora
                        </p>

                        {/* PROVA SOCIAL +12.847 (REDUZIDA) */}
                        <p className="social-proof-count" style={{
                            textAlign: 'center',
                            color: 'rgb(74, 222, 128)',
                            fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                            marginBottom: 'clamp(8px, 2vw, 12px)',
                            lineHeight: '1.5',
                            fontWeight: '500',
                            opacity: 0.85
                        }}>
                            ✓ +12.847 reconquistas exitosas
                        </p>

                        {/* EXCLUSIVIDADE (REDUZIDA) */}
                        <p className="guarantee-text" style={{
                            textAlign: 'center',
                            fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                            lineHeight: '1.6',
                            color: 'rgba(255, 255, 255, 0.7)',
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
                
                /* GRID DE URGÊNCIA OTIMIZADO */
                .final-urgency-grid-optimized { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: clamp(8px, 2vw, 12px);
                    margin: clamp(16px, 4vw, 20px) 0;
                }
                .urgency-item-compact { 
                    background: rgba(0,0,0,0.3); 
                    padding: clamp(10px, 3vw, 12px); 
                    border-radius: 8px; 
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .sticky-footer-urgency { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.95); padding: 15px; color: #fde047; text-align: center; z-index: 1000; border-top: 2px solid #eab308; font-weight: bold; }
                .progress-bar-container { display: flex; justify-content: space-between; margin: 20px auto; max-width: 800px; padding: 15px; background: rgba(0,0,0,0.4); border-radius: 12px; position: sticky; top: 0; z-index: 999; backdrop-filter: blur(5px); }
                .progress-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; color: rgba(255,255,255,0.5); font-size: 0.8rem; }
                .step-circle { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; justify-content: center; align-items: center; margin-bottom: 5px; }
                .progress-step.active .step-circle { background: #eab308; color: black; }
                .progress-step.completed .step-circle { background: #4ade80; color: white; }
                .ventana-img { width: 100%; max-width: 600px; border-radius: 12px; margin: 20px auto; display: block; }
                .emotional-validation { background: rgba(74, 222, 128, 0.1); border: 2px solid rgba(74, 222, 128, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px; color: #4ade80; }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes loadingDots {
                    0%, 20% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }

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

                /* Estilos para o botão "Continuar" */
                .continue-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    max-width: 400px;
                    margin: 30px auto 0;
                    padding: 18px 25px;
                    background: linear-gradient(90deg, #eab308 0%, #facc15 100%);
                    color: black;
                    font-size: 1.4rem;
                    font-weight: 900;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(234, 179, 8, 0.4);
                    transition: all 0.3s ease;
                }
                .continue-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 25px rgba(234, 179, 8, 0.6);
                }
                .continue-button .arrow {
                    margin-left: 10px;
                    font-size: 1.8rem;
                    line-height: 1;
                }
                .pulse {
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.7); }
                    70% { transform: scale(1.02); box-shadow: 0 0 0 15px rgba(234, 179, 8, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); }
                }

                /* Estilos para o overlay e botão de desbloqueio do VSL */
                .vsl-unlock-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    z-index: 10;
                    text-align: center;
                }
                .unlock-vsl-button {
                    background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
                    color: black;
                    font-size: 1.5rem;
                    font-weight: 900;
                    padding: 20px 30px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(74, 222, 128, 0.4);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .unlock-vsl-button:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 25px rgba(74, 222, 128, 0.6);
                }
                .unlock-vsl-button .arrow {
                    margin-left: 10px;
                    font-size: 1.8rem;
                    line-height: 1;
                }
                .unlock-vsl-info {
                    color: rgba(255, 255, 255, 0.8);
                    margin-top: 15px;
                    font-size: 1rem;
                }
                .vsl-loading-spinner {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    z-index: 10;
                    color: white;
                    font-size: 1.2rem;
                }
                .vsl-loading-spinner .spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid #4ade80;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                }
                .vsl-container {
                    position: relative; /* Necessário para o overlay */
                    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
                    height: 0;
                    overflow: hidden;
                    max-width: 100%;
                    background: #000;
                    border-radius: 8px;
                }
                .vsl-container .vsl-placeholder {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
            `}</style>
        </div>
    );
}