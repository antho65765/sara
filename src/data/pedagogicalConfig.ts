import { StudentProfile, TopicMemory, SubjectKey } from '../types';

export const GRADE_LABELS: Record<string, { title: string; desc: string; ageRange: string }> = {
  primaria: {
    title: 'Primaria (Básica)',
    desc: 'Explicaciones lúdicas, metáforas cotidianas, pasos breves y refuerzo muy positivo.',
    ageRange: '6 a 11 años',
  },
  secundaria: {
    title: 'Secundaria / ESO',
    desc: 'Equilibrio entre rigor y claridad, ejemplos aplicados al mundo real y preguntas reflexivas.',
    ageRange: '12 a 15 años',
  },
  bachillerato: {
    title: 'Bachillerato / Preparatoria',
    desc: 'Conceptos formales, preparación para exámenes, análisis crítico y resolución estructurada.',
    ageRange: '16 a 18 años',
  },
  universidad: {
    title: 'Universidad / Superior',
    desc: 'Profundidad académica, pensamiento crítico avanzado, bibliografía teórica y debate conceptual.',
    ageRange: 'Educación Superior',
  },
  autodidacta: {
    title: 'Autodidacta / Aprendizaje Continuo',
    desc: 'Orientado a la aplicación práctica, autonomía, proyectos y entendimiento conceptual profundo.',
    ageRange: 'Todas las edades',
  },
};

export const LEARNING_STYLE_LABELS: Record<string, { title: string; desc: string; iconName: string }> = {
  visual: {
    title: 'Visual y Esquemas',
    desc: 'Representaciones estructuradas, analogías espaciales, mapas mentales y esquemas paso a paso.',
    iconName: 'Eye',
  },
  practico: {
    title: 'Práctico y Aplicado',
    desc: 'Ejemplos de la vida real, ejercicios inmediatos y resolución práctica de problemas.',
    iconName: 'Wrench',
  },
  teorico: {
    title: 'Teórico y Lógico',
    desc: 'Definiciones rigurosas, principios fundamentales, deducción paso a paso y demostraciones.',
    iconName: 'BookOpen',
  },
  socratico: {
    title: 'Método Socrático',
    desc: 'El tutor te guía con preguntas reflexivas para que tú descubras la respuesta por ti mismo.',
    iconName: 'HelpCircle',
  },
  feynman: {
    title: 'Técnica Feynman (Simple)',
    desc: 'Explicaciones claras y cristalinas como si se las explicaras a un amigo, sin jerga innecesaria.',
    iconName: 'Sparkles',
  },
};

export const SUBJECT_METADATA: Record<SubjectKey, { name: string; icon: string; defaultColor: string; pedagogicalHint: string }> = {
  matematicas: {
    name: 'Matemáticas',
    icon: 'Calculator',
    defaultColor: 'blue',
    pedagogicalHint: 'Desglose algorítmico paso a paso, comprobación de operaciones y detección del origen de errores.',
  },
  ciencias: {
    name: 'Ciencias Naturales / Física / Química / Biología',
    icon: 'Atom',
    defaultColor: 'emerald',
    pedagogicalHint: 'Modelos de causa y efecto, leyes naturales, método científico y analogías con fenómenos diarios.',
  },
  historia: {
    name: 'Historia y Ciencias Sociales',
    icon: 'Landmark',
    defaultColor: 'amber',
    pedagogicalHint: 'Contextualización espacio-temporal, causas, consecuencias y empatía con actores de la época.',
  },
  lengua: {
    name: 'Lengua, Literatura y Redacción',
    icon: 'Feather',
    defaultColor: 'purple',
    pedagogicalHint: 'Estructura sintáctica, riqueza de vocabulario, comprensión lectora y técnicas de argumentación.',
  },
  filosofia: {
    name: 'Filosofía y Ética',
    icon: 'Compass',
    defaultColor: 'indigo',
    pedagogicalHint: 'Mayéutica, dilemas morales, corrientes de pensamiento y justificación de argumentos.',
  },
  programacion: {
    name: 'Programación y Computación',
    icon: 'Terminal',
    defaultColor: 'cyan',
    pedagogicalHint: 'Lógica algorítmica, trazabilidad, descomposición de problemas e identificación de bugs.',
  },
  idiomas: {
    name: 'Idiomas Extranjeros',
    icon: 'Languages',
    defaultColor: 'rose',
    pedagogicalHint: 'Inmersión comunicativa, patrones comunes, fonética y corrección constructiva.',
  },
  otro: {
    name: 'Materia Personalizada',
    icon: 'GraduationCap',
    defaultColor: 'slate',
    pedagogicalHint: 'Adaptación flexible al objetivo específico del estudiante.',
  },
};

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  name: 'Invitado',
  grade: 'secundaria',
  learningStyle: 'socratico',
  currentSubject: 'ciencias',
  customSubjectName: '',
  interests: 'naturaleza, tecnología y deportes',
};

export const INITIAL_TOPIC_MEMORIES: TopicMemory[] = [];
