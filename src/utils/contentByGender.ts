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

export function getCopy(quizData: QuizData): string {
  const pronoun = quizData.gender === 'HOMBRE' ? 'ella' : 'él';
  
  return `No fue por falta de amor.

Fue porque en algún momento dejaste de ser lo que ${pronoun} necesitaba en ese momento.

Pero aquí está la verdad: eso puede cambiar.

Y en el siguiente paso, voy a revelar EXACTAMENTE qué fue lo que cambió y el paso a paso científico para que ${pronoun} sienta que SÍ eres la persona correcta.`;
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
    '✅ Garantía: 30 días o tu dinero de vuelta'
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