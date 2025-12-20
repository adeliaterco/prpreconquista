import { QuizData } from '../types/quiz';

// 
// FUNÇÕES DE PERSONALIZAÇÃO POR GÊNERO
// 

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
  const exPronoun = quizData.gender === 'HOMBRE' ? 'Ella' : 'Él';
  
  const whoEnded = quizData.whoEnded || 'No especificado';
  const timeSeparation = quizData.timeSeparation || 'No especificado';
  const currentSituation = quizData.currentSituation || 'No especificado';
  const reason = quizData.reason || 'No especificado';

  // 1. Lógica de Introducción (Quem terminó) - Curta (máx 3 linhas)
  let intro = '';
  if (whoEnded.includes('Ella') || whoEnded.includes('Él')) {
    intro = `${exPronoun} decidió terminar la relación, lo que indica un desgaste en su percepción de tu valor.`;
  } else {
    intro = `Fuiste tú quien terminó, ahora el desafío es revertir el sentimiento de rechazo y crear una nueva oportunidad.`;
  }

  // 2. Lógica de Urgencia (Tempo de separação) - Curta (máx 3 linhas)
  let urgency = '';
  if (timeSeparation.includes('Menos de 1 mes') || timeSeparation.includes('1-3 meses')) {
    urgency = `Estás en la **ventana de tiempo IDEAL**. Su cerebro aún tiene rastros químicos de tu presencia.`;
  } else {
    urgency = `Aunque ha pasado tiempo (${timeSeparation}), las memorias emocionales pueden reactivarse con los estímulos correctos.`;
  }

  // 3. Lógica de Contato (Situação atual) - Curta (máx 3 linhas)
  let insight = '';
  if (currentSituation.includes('No hay contacto')) {
    insight = `La falta de contacto es, irónicamente, tu mayor ventaja. Preparamos el terreno para un regreso impactante.`;
  } else {
    insight = `El contacto actual indica que el hilo emocional no se ha cortado. Debemos evitar saturar su sistema de dopamina.`;
  }

  // 4. Motivo da Ruptura - Curta (máx 3 linhas)
  let reasonInsight = '';
  if (reason && reason !== 'No especificado') {
    reasonInsight = `El motivo principal fue "${reason}". El protocolo se enfocará en neutralizar esa objeción específica.`;
  }

  // Construir os bullet points para os dados do quiz
  const quizDataBullets = `
**Tu situación específica:**
- **Tiempo de separación:** ${timeSeparation}
- **Quién terminó:** ${whoEnded}
- **Situación actual:** ${currentSituation}${reason !== 'No especificado' ? `\n- **Motivo principal:** ${reason}` : ''}
`;

  // Montar a string final, garantindo quebras de linha duplas entre blocos lógicos
  let finalCopy = `No fue por falta de amor.

${intro}

${quizDataBullets}

${urgency}

${insight}`;

  if (reasonInsight) { // Adiciona o parágrafo do motivo apenas se houver um motivo especificado
    finalCopy += `\n\n${reasonInsight}`;
  }

  finalCopy += `\n\nLa clave no es rogar, sino entender la psicología de ${pronoun} y actuar de forma estratégica. En el siguiente paso, voy a revelar EXACTAMENTE el paso a paso científico para que ${pronoun} sienta que SÍ eres la persona correcta.`;

  return finalCopy;
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