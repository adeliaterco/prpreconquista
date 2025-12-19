// ========================================
// SISTEMA DE TRACKING GA4
// ========================================

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

class GA4Tracking {
  
  // ✅ Verifica se o gtag está disponível
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  }

  // ✅ Envia evento genérico
  private sendEvent(eventName: string, params?: Record<string, any>) {
    if (this.isAvailable()) {
      window.gtag('event', eventName, params);
      console.log(`📊 GA4 Event: ${eventName}`, params);
    } else {
      console.warn('⚠️ GA4 não disponível ainda');
    }
  }

  // ========================================
  // LANDING PAGE
  // ========================================

  landingPageView() {
    this.sendEvent('page_view', {
      page_title: 'Landing Page',
      page_location: window.location.href,
      page_path: '/'
    });
  }

  landingCTAClick() {
    this.sendEvent('cta_click', {
      button_name: 'Iniciar Análisis',
      button_location: 'landing_primary',
      page: 'landing'
    });
  }

  landingScrollDepth(depth: number) {
    this.sendEvent('scroll_depth', {
      depth_percentage: depth,
      page: 'landing'
    });
  }

  // ========================================
  // CHAT
  // ========================================

  chatPageView() {
    this.sendEvent('page_view', {
      page_title: 'Chat Analysis',
      page_location: window.location.href,
      page_path: '/chat'
    });
  }

  chatStarted() {
    this.sendEvent('chat_started', {
      page: 'chat'
    });
  }

  questionAnswered(questionId: number, questionText: string, answer: string) {
    this.sendEvent('question_answered', {
      question_id: questionId,
      question_text: questionText,
      answer: answer,
      page: 'chat'
    });
  }

  chatCompleted() {
    this.sendEvent('chat_completed', {
      page: 'chat'
    });
  }

  chatCTAClick() {
    this.sendEvent('cta_click', {
      button_name: 'Ver Mi Plan Personalizado',
      button_location: 'chat_complete',
      page: 'chat'
    });
  }

  // ========================================
  // RESULTADO
  // ========================================

  resultPageView() {
    this.sendEvent('page_view', {
      page_title: 'Result Page',
      page_location: window.location.href,
      page_path: '/resultado'
    });
  }

  revelationViewed(revelationName: string) {
    this.sendEvent('revelation_viewed', {
      revelation_name: revelationName,
      page: 'resultado'
    });
  }

  videoStarted() {
    this.sendEvent('video_started', {
      video_name: 'VSL Plan Personalizado',
      page: 'resultado'
    });
  }

  offerRevealed() {
    this.sendEvent('offer_revealed', {
      page: 'resultado'
    });
  }

  offerViewed() {
    this.sendEvent('offer_viewed', {
      page: 'resultado'
    });
  }

  ctaBuyClicked(buttonLocation: string) {
    this.sendEvent('cta_buy_click', {
      button_name: 'Comprar Ahora',
      button_location: buttonLocation,
      page: 'resultado',
      value: 1 // Você pode adicionar o valor do produto aqui
    });
  }

  // ========================================
  // CONVERSÃO (IMPORTANTE!)
  // ========================================

  purchase(value: number, currency: string = 'BRL') {
    this.sendEvent('purchase', {
      transaction_id: `TXN-${Date.now()}`,
      value: value,
      currency: currency,
      items: [{
        item_name: 'Plan de Reconquista 21 Días',
        item_category: 'Digital Product',
        price: value,
        quantity: 1
      }]
    });
  }

  // ========================================
  // COUNTDOWN & URGÊNCIA
  // ========================================

  spotsUpdated(spotsLeft: number) {
    if (spotsLeft === 20 || spotsLeft === 10 || spotsLeft === 5) {
      this.sendEvent('spots_alert', {
        spots_remaining: spotsLeft,
        page: 'resultado'
      });
    }
  }
}

// ✅ Exporta instância única
export const ga4Tracking = new GA4Tracking();