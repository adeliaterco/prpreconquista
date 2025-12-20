import { QuizData } from '../types/quiz';

// ========================================
// FUNÇÕES DE PERSONALIZAÇÃO POR GÊNERO
// ========================================

export function getTitle(gender: string): string {
  return gender === 'HOMBRE' 
    ? 'Por Qué Ella Se Fue' 
    : 'Por Qué Él Se Fue';
}

export function getLoadingMessage(gender: string): string {
  return gender === 'HOMBRE'
    ? 'Generando tu protocolo específico para reconquistar a ella...'
    : 'Generando tu protocolo específico para reconquistar a él...';
}

/**
 * ALTERAÇÃO #6: Diagnóstico Ultra-Personalizado
 * Transforma os dados do quiz em uma narrativa de autoridade e empatia.
 */
export function getCopy(quizData: QuizData): string {
  const pronoun = quizData.gender === 'HOMBRE' ? 'ella' : 'él';
  const exPronoun = quizData.gender === 'HOMBRE' ? 'Ella' : 'Él';
  
  const whoEnded = quizData.whoEnded || '';
  const timeSeparation = quizData.timeSeparation || '';
  const currentSituation = quizData.currentSituation || '';
  const reason = quizData.reason || '';

  // 1. Lógica de Introdução (Quem terminou)
  let intro = '';
  if (whoEnded.includes('Ella') || whoEnded.includes('Él')) {
    intro = `Basado en que ${exPronoun} decidió terminar la relación, entendemos que hubo un desgaste en los "interruptores de valor" que ${pronoun} percibía en ti. `;
  } else {
    intro = `Considerando que fuiste tú quien terminó, el desafío ahora es revertir el sentimiento de rechazo que ${pronoun} procesó, transformándolo en una nueva oportunidad. `;
  }

  // 2. Lógica de Urgência (Tempo de separação)
  let urgency = '';
  if (timeSeparation.includes('Menos de 1 mes') || timeSeparation.includes('1-3 meses')) {
    urgency = `Estás en la **ventana de tiempo IDEAL**. El cerebro de ${pronoun} aún tiene rastros químicos de tu presencia, lo que facilita la reconexión si actúas ahora. `;
  } else {
    urgency = `Aunque ha pasado tiempo (${timeSeparation}), la neurociencia explica que las memorias emocionales pueden ser reactivadas mediante los estímulos correctos. `;
  }

  // 3. Lógica de Contato (Situação atual)
  let insight = '';
  if (currentSituation.includes('No hay contacto')) {
    insight = `El hecho de que no haya contacto es, irónicamente, tu mayor ventaja. Estamos en la fase de "limpieza de picos de cortisol", preparando el terreno para un regreso impactante. `;
  } else {
    insight = `El contacto actual indica que el hilo emocional no se ha cortado, pero debemos tener cuidado de no saturar su sistema de dopamina con desesperación. `;
  }

  // 4. Motivo da Ruptura
  let reasonInsight = '';
  if (reason) {
    reasonInsight = `Al analizar que el motivo principal fue "${reason}", el protocolo se enfocará en neutralizar esa objeción específica en el subconsciente de ${pronoun}. `;
  }

  return `No fue por falta de amor.

${intro}

${urgency}

${insight}

${reasonInsight}

La clave no es rogar, sino entender la psicología de ${pronoun} y actuar de forma estratégica. En el siguiente paso, voy a revelar EXACTAMENTE el paso a passo científico para que ${pronoun} sienta que SÍ eres la persona correcta.`;
}

export function getVentana72Copy(gender: string): string {
  const pronoun = gender === 'HOMBRE' ? 'ella' : 'él';
  
  return `Aquí está lo crucial:

En cada una de estas 3 fases, hay acciones CORRECTAS e INCORRECTAS.

Si actúas correcto en cada fase, ${pronoun} te busca.
Si actúas incorrecto, su cerebro borra la atracción.

Tu plan personalizado revela EXACTAMENTE qué hacer en cada fase.`;
}

export function getOfferTitle(gender: string): string {
  return gender === 'HOMBRE'
    ? 'Tu Plan de 21 Días para Reconquistar a Ella'
    : 'Tu Plan de 21 Días para Reconquistar a Él';
}

export function getFeatures(gender: string): string[] {
  const pronoun = gender === 'HOMBRE' ? 'Ella' : 'Él';
  const pronounLower = gender === 'HOMBRE' ? 'ella' : 'él';
  const another = gender === 'HOMBRE' ? 'otro' : 'otra';
  
  return [
    `📱 MÓDULO 1: Cómo Hablar Con ${pronoun} (Días 1-7)`,
    `👥 MÓDULO 2: Cómo Encontrarte Con ${pronoun} (Días 8-14)`,
    `❤️ MÓDULO 3: Cómo Reconquistar${pronounLower === 'ella' ? 'la' : 'lo'} (Días 15-21)`,
    `🚨 MÓDULO 4: Protocolo de Emergencia (Si ${pronounLower} está con ${another})`,
    '⚡ Guía especial: Las 3 Fases de 72 Horas',
    '🎯 Bonos: Scripts de conversación + Planes de acción',
    '✅ Garantía: 30 días o tu dinheiro de vuelta'
  ];
}

export function getCTA(gender: string): string {
  return gender === 'HOMBRE'
    ? 'SÍ, QUIERO MI PLAN PARA RECONQUISTAR A ELLA'
    : 'SÍ, QUIERO MI PLAN PARA RECONQUISTAR A ÉL';
}

export function getCompletionBadge(gender: string): { title: string; subtitle: string } {
  const pronoun = gender === 'HOMBRE' ? 'ella' : 'él';
  
  return {
    title: '¡TU ANÁLISIS ESTÁ LISTO!',
    subtitle: `Descubre exactamente por qué ${pronoun} se fue y el paso a paso científico para que ${pronoun} QUIERA volver`
  };
}

export function getFaseText(gender: string, fase: number): string {
  const pronoun = gender === 'HOMBRE' ? 'Ella' : 'Él';
  
  const fases: Record<number, string> = {
    1: `Dopamina cae 67% → ${pronoun} siente "alivio"`,
    2: `Oxitocina se desconecta → ${pronoun} "olvida" los buenos momentos`,
    3: `Córtex prefrontal reescribe memorias → ${pronoun} te ve diferente`
  };
  
  return fases[fase] || '';
}