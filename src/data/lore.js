// ============================================================
//  "ANTES DE OLVIDARTE" — Lore, diálogos y narrativa
//  Un juego 3D sobre la memoria, el tiempo y el amor.
// ============================================================

export const CHAPTERS = [
  {
    id: 'prologo',
    title: 'Prólogo',
    subtitle: 'El Laboratorio de la Memoria',
    location: 'Ciudad de Veraluna — Año 2147',
    color: '#6ea8ff',
  },
  {
    id: 'cap1',
    title: 'Capítulo I',
    subtitle: 'La Última Chispa',
    location: 'Sector Residencial 7 — El apartamento',
    color: '#ffb36e',
  },
  {
    id: 'cap2',
    title: 'Capítulo II',
    subtitle: 'El Jardín de los Recuerdos',
    location: 'Parque Meridiana — Zona de proyección mnémica',
    color: '#7dff9e',
  },
  {
    id: 'cap3',
    title: 'Capítulo III',
    subtitle: 'La Torre del Olvido',
    location: 'Núcleo Central — Archivo de Sinapsis',
    color: '#c07dff',
  },
  {
    id: 'final',
    title: 'Epílogo',
    subtitle: 'Antes de Olvidarte',
    location: 'Azotea — Amanecer sobre Veraluna',
    color: '#ffd76e',
  },
];

export const LORE_TEXTS = {
  world: `En el año 2147, la humanidad aprendió a extraer, almacenar y hasta borrar recuerdos.\n\nLa ciudad de Veraluna brilla bajo un cielo de neón, gobernada por Mnemosyne Corp., dueña del "Archivo de Sinapsis": una torre donde se guardan las memorias de millones de personas.\n\nPero hay un precio. Cada recuerdo copiado se debilita en su dueño. La gente empieza a olvidar… nombres, rostros, promesas.`,
  disease: `El "Síndrome del Espejo Roto" consume a quienes vivieron cerca de la Torre.\n\nL —la chica de la que todo depende— padece esta enfermedad. Cada amanecer olvida un poco más.\n\nKai, un ingeniero de memorias, trabaja en el Laboratorio 7 reconstruyendo recuerdos ajenos. Nadie sabe que él también está perdiendo los suyos… y que se niega a borrar el rostro de L, aunque eso lo esté destruyendo.`,
  promise: `Hay una promesa que Kai repite cada noche frente al reloj de arena:\n\n"No importa cuántas veces me olvides. Yo voy a recordarnos por los dos, antes de olvidarte."\n\nEsa frase es la llave maestra del Archivo. Fue grabada en la primera sinapsis que ambos compartieron, el día que se conocieron bajo el gran árbol de luz del Parque Meridiana.`,
};

// ------------------------------------------------------------
// Diálogos por capítulo. speaker: KAI | L | DR_VEGA | NARRADOR
// portrait: color de acento para el avatar
// ------------------------------------------------------------

export const DIALOGUES = {
  intro: [
    { s: 'NARRADOR', t: 'Veraluna, año 2147. Una ciudad que aprendió a vender recuerdos… y a cobrarlos en almas.' },
    { s: 'NARRADOR', t: 'En el Laboratorio 7, un ingeniero llamado Kai revisa una última sinapsis dañada.' },
    { s: 'KAI', t: 'Otro día borrando el dolor de desconocidos… mientras yo no puedo borrar el mío.' },
    { s: 'DR_VEGA', t: 'Kai. Tu expediente dice que llevas 214 días sin purgar tu propia memoria. Eso te está matando.' },
    { s: 'KAI', t: 'Lo sé, doctora. Pero si purgo mi archivo… pierdo a L. Para siempre.' },
    { s: 'DR_VEGA', t: 'L lleva meses sin pronunciar tu nombre. ¿Qué vas a defender?' },
    { s: 'KAI', t: 'Defiendo que alguien recuerde. Aunque tenga que ser solo uno de los dos.' },
    { s: 'NARRADOR', t: 'Esa noche, el sistema del Laboratorio emitió una alerta roja: "Sinapsis crítica encontrada — Origen: L-0". Era el primer recuerdo de ambos. Y estaba colapsando.' },
  ],

  cap1: [
    { s: 'NARRADOR', t: 'El apartamento. Sector Residencial 7. Las paredes proyectan fotos que ya nadie reconoce.' },
    { s: 'L', t: '¿Quién… quién vive aquí? Hay dos tazas en la cocina. Dos cepillos de dientes.' },
    { s: 'KAI', t: 'Tranquila. Estás segura. Este era… este es nuestro lugar.' },
    { s: 'L', t: 'Tu voz me suena a canción de cuna. Pero no logro recordar la letra.' },
    { s: 'KAI', t: 'Entonces cántala conmigo. Empieza así: "bajo el árbol de luz…".' },
    { s: 'L', t: '"…te encontré." ¡Kai! ¡Me acuerdo de tu nombre!' },
    { s: 'NARRADOR', t: 'Dura tres segundos. Tres segundos de eternidad. Kai recoge el fragmento de luz: el Recuerdo del Nombre.' },
    { s: 'DR_VEGA', t: '(por comunicador) Fragmento estabilizado. Faltan cuatro para reconstruir la sinapsis completa. No los busques todos, Kai. Algunos recuerdos caídos hieren.' },
    { s: 'KAI', t: 'Si hiere, que hiera. Prefiero cicatrices con ella, que paz sin nada.' },
  ],

  cap2: [
    { s: 'NARRADOR', t: 'El Parque Meridiana. Aquí los árboles proyectan los recuerdos que la ciudad tira a la basura.' },
    { s: 'L', t: 'Mira… ese árbol está mostrando una boda. ¿De quién será?' },
    { s: 'KAI', t: 'De alguien que todavía cree que el futuro no roba nada.' },
    { s: 'L', t: 'Yo soñé anoche con un reloj de arena lleno de luciérnagas. Me desperté llorando y sin saber por qué.' },
    { s: 'KAI', t: 'Porque el sueño era real. Nuestro primer aniversario. Se me cayó un grano adentro y reímos media hora.' },
    { s: 'L', t: 'Ríe ahora, entonces. Que se quede el cuerpo, si la mente no puede.' },
    { s: 'NARRADOR', t: 'Entre las raíces del gran árbol, Kai encuentra el Recuerdo del Primer Día. Brilla como una brasa tibia.' },
    { s: 'L', t: 'Kai… siento que te conozco de toda la vida. ¿Es posible querer a alguien antes de recordarlo?' },
    { s: 'KAI', t: 'No solo es posible. Es exactamente lo que me pasa contigo todos los días.' },
  ],

  cap3: [
    { s: 'NARRADOR', t: 'La Torre del Olvido. El Archivo de Sinapsis respira como un animal de cristal.' },
    { s: 'DR_VEGA', t: 'Detente, Kai. Si conectas la sinapsis de L al núcleo, el sistema elegirá: o se guarda en el Archivo… o vuelve a ella. No admite copias.' },
    { s: 'KAI', t: 'Que vuelva a ella. Ese fue siempre el trato.' },
    { s: 'DR_VEGA', t: '¿Y sabes el costo? La copia original vive en TU cabeza. Borrarla de ti es borrar la razón por la que sigues de pie.' },
    { s: 'L', t: '¡No! Prométeme que no lo harás. Prefiero olvidarme mil veces y que tú me recuerdes una…' },
    { s: 'KAI', t: 'Te prometo algo mejor: que no hará falta. Confía en la llave.' },
    { s: 'NARRADOR', t: 'Kai susurra la frase grabada en la primera sinapsis. El núcleo titubea. Millones de recuerdos robados se levantan como estrellas dentro de la torre.' },
    { s: 'SYSTEM', t: '«NO IMPORTA CUÁNTAS VECES ME OLVIDES…» — Protocolo Ítaca aceptado. Devolución masiva autorizada.' },
    { s: 'DR_VEGA', t: 'Imposible… Estás devolviendo TODAS las memorias a TODA la ciudad. Kai, vas a quedar vacío.' },
    { s: 'KAI', t: 'No. Quedaré lleno. De ella.' },
  ],

  final: [
    { s: 'NARRADOR', t: 'Amanecer. Azotea del Laboratorio 7. Veraluna despierta recordando.' },
    { s: 'L', t: 'Soñé con un chico, un árbol de luz y un reloj de arena con luciérnagas. Hoy… hoy supe que eras tú. Te vi en la calle y corrí.' },
    { s: 'L', t: 'Me llamo L. Y creo que te quiero desde antes de acordarme.' },
    { s: 'KAI', t: 'Yo me llamo Kai. Y tengo algo que devolverte: nosotros.' },
    { s: 'L', t: 'Prométeme una cosa. Si algún amanecer me borro otra vez…' },
    { s: 'KAI', t: 'Te busco. Bajo el árbol, con dos tazas y una canción de cuna a medio terminar.' },
    { s: 'NARRADOR', t: 'Dicen que en Veraluna los relojes de arena dejaron de caer hacia abajo esa mañana. Dicen que el amor, cuando se archiva en el corazón, no ocupa espacio en la memoria… se vuelve memoria.' },
    { s: 'NARRADOR', t: 'Gracias por jugar ANTES DE OLVIDARTE. Para L, dondequiera que esté. ❤' },
  ],
};

export const GAME_LINES = {
  hintStart: 'Usa W A S D para caminar · MAYÚS para correr · E para interactuar',
  hintFragment: 'Un recuerdo brilla cerca. Acércate y presiona E.',
  collected: (n, total) => `Recuerdo recuperado: ${n} / ${total}`,
  allDone: 'Todos los fragmentos están en tu mano. Presiona E junto al portal para continuar.',
};

export const CREDITS = [
  ['ANTES DE OLVIDARTE', 'un juego en 3D sobre recordar'],
  ['Dirección y código', 'Abraham & tú'],
  ['Historia y Lore', 'El Archivo de Sinapsis'],
  ['Kai', 'el que recuerda'],
  ['L', 'la que vuelve'],
  ['Dra. Vega', 'la voz del sistema'],
  ['Motor', 'Three.js · GSAP · Tween.js'],
  ['Para L,', 'con quien quiero recordarnos por siempre.'],
];
