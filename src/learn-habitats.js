// Contenido educativo de "Aprende" (secundaria, 12–17 años).
// Los valores son típicos o de diseños conceptuales, solo para orientarse.
// No es un modelo validado de incendios: cada parte enlaza a investigaciones
// reales del catálogo para revisar la evidencia original.

export const learnDisclaimer = 'Herramienta educativa: no es una simulación validada de incendios. Las condiciones son valores típicos o de diseños conceptuales de NASA. Revisa las investigaciones enlazadas antes de usar cualquier dato.';

export const learnHabitats = [
 {
  id:'station',
  name:'Módulo orbital',
  kind:'Nave espacial',
  intro:'Un laboratorio presurizado que orbita la Tierra a unos 400 km de altura, con una nave de carga acoplada. Aquí todo flota: el aire caliente no sube, así que los ventiladores deciden hacia dónde van el oxígeno y el humo.',
  environment:[
   ['Gravedad','Microgravedad (casi 0 g)'],
   ['Presión','101,3 kPa (igual que al nivel del mar)'],
   ['Oxígeno','Alrededor de 21 %'],
   ['Aire','Solo se mueve con ventiladores'],
  ],
  components:[
   {
    id:'quarters',name:'Cabina de la tripulación',
    what:'Un pequeño “dormitorio” del tamaño de una cabina telefónica. Cada astronauta duerme en un saco sujeto a la pared y guarda sus cosas personales.',
    materials:[['Nomex','Tela resistente al fuego, la misma familia que usan los bomberos'],['Tela de algodón y fibra de vidrio (SIBAL)','Se usó como muestra de prueba en BASS y Saffire'],['Espuma','Aísla el ruido y hace más cómodo el espacio'],['Velcro y correas','Plásticos que sujetan los objetos para que no floten']],
    conditions:[['Gravedad','Casi 0 g'],['Aire','Un ventilador pequeño; flujo bajo'],['Volumen','Unos 2 m³, cerrado']],
    fire:['Con poco flujo de aire, una llama puede avanzar lento y quedarse pequeña: es más difícil notarla a tiempo.','BASS comparó cómo arden estas telas en órbita frente a las pruebas que se hacen en la Tierra.'],
    related:['PSI-26','PSI-25','PSI-98'],
    question:'¿Las telas como Nomex arden distinto en microgravedad que en las pruebas en la Tierra?',
   },
   {
    id:'avionics',name:'Rack de electrónica',
    what:'Un armario con computadoras, fuentes de energía y cientos de cables. Un cable que se sobrecalienta es una de las formas clásicas en que podría empezar un incendio en una nave.',
    materials:[['Aislante de cables','Teflón (PTFE), Kapton y silicona'],['Placas de circuito','Fibra de vidrio con resina epóxica'],['Conectores','Plásticos técnicos']],
    conditions:[['Gravedad','Casi 0 g'],['Aire','Flujo de enfriamiento dentro del rack'],['Calor','Corriente eléctrica; posible sobrecalentamiento']],
    fire:['Antes de que haya llama, el aislante caliente se descompone y suelta humo. El tamaño de esas partículas decide si el detector las “ve”.','En órbita el humo no sube al techo: lo arrastra la ventilación.'],
    related:['PSI-102','PSI-101','PSI-115'],
    question:'¿Qué humo producen los cables sobrecalentados en microgravedad y lo detectan los sensores?',
   },
   {
    id:'research',name:'Cámara de experimentos de combustión',
    what:'Una cámara de acero sellada donde los científicos encienden llamas diminutas a propósito: gotas de combustible, chorros de gas y llamas esféricas.',
    materials:[['Combustibles de prueba','Gotas de heptano, metanol y dodecano; gas metano y etileno'],['Cámara','Recipiente de acero sellado'],['Instrumentos','Cámaras, radiómetros y sensores de gases']],
    conditions:[['Gravedad','Casi 0 g'],['Presión','Se elige en cada prueba (0,5–3 atm en FLEX-2)'],['Oxígeno','Se elige en cada prueba (17–40 %)']],
    fire:['Una gota encendida forma una llama casi perfectamente esférica, porque nada empuja el gas caliente hacia arriba.','FLEX descubrió “llamas frías”: algunas gotas siguen reaccionando a baja temperatura después de que la llama visible se apaga.'],
    related:['PSI-69','PSI-68','PSI-39','PSI-23','PSI-107'],
    question:'¿Qué son las llamas frías y por qué se descubrieron en microgravedad?',
   },
   {
    id:'ventilation',name:'Ductos y ventiladores',
    what:'Los ventiladores mueven todo el aire del módulo. En órbita, ese flujo reemplaza a la “corriente de aire caliente que sube” de la Tierra.',
    materials:[['Paredes del ducto','Aluminio y plástico'],['Filtros','Filtros HEPA'],['Carcasas','Metal y plásticos']],
    conditions:[['Gravedad','Casi 0 g'],['Velocidad del aire','Unos 8–20 cm/s en la cabina'],['Dirección','La deciden los ventiladores, no el calor']],
    fire:['La velocidad y la dirección del aire cambian qué tan rápido avanza una llama: no es lo mismo avanzar a favor del viento que en contra.','Apagar los ventiladores es una respuesta estándar ante un incendio: la llama deja de recibir oxígeno fresco.'],
    related:['PSI-25','PSI-100','PSI-62'],
    question:'¿Cómo cambia la velocidad del aire la propagación de una llama sobre sólidos en microgravedad?',
   },
   {
    id:'stowage',name:'Bolsas de carga',
    what:'Bolsas blandas sujetas a las paredes con ropa, toallitas, empaques y repuestos.',
    materials:[['Bolsas de Nomex','Tela resistente al fuego'],['Empaques','Polietileno y espuma'],['Toallitas y papel','Celulosa']],
    conditions:[['Gravedad','Casi 0 g'],['Aire','Bajo, en parte bloqueado por las bolsas'],['Combustible','Muchos objetos pequeños juntos']],
    fire:['Muchos objetos blandos juntos son “combustible” disponible. Los experimentos a gran escala muestran qué tan rápido crece un fuego cuando los alcanza.'],
    related:['PSI-98','PSI-99','PSI-26'],
    question:'¿Qué tan rápido crece un incendio sobre telas grandes en microgravedad?',
   },
   {
    id:'cargo',name:'Nave de carga acoplada',
    what:'Una nave sin tripulación que trae suministros. Cuando se desacopla y se aleja, se convierte en un lugar seguro para hacer incendios grandes a propósito.',
    materials:[['Muestras de prueba','Tela SIBAL, acrílico (PMMA), Nomex, silicona'],['Instrumentos','Termopares, radiómetros, sensores de O₂ y CO₂'],['Exterior','Mantas térmicas doradas y paneles solares circulares']],
    conditions:[['Gravedad','Casi 0 g'],['Presión','Cerca de 1 atm'],['Aire','Controlado, unos 20–30 cm/s en Saffire']],
    fire:['Saffire quemó muestras mucho más grandes de lo que estaría permitido dentro de una nave con personas, y las comparó con pruebas en la Tierra.'],
    related:['PSI-98','PSI-99','PSI-100'],
    question:'¿Qué aprendieron los experimentos Saffire sobre incendios grandes en microgravedad?',
   },
   {
    id:'hull',name:'Casco y exterior',
    what:'La “piel” de aluminio que mantiene el aire adentro, cubierta con mantas térmicas y un escudo contra micrometeoritos. Afuera hay vacío: ahí nada puede arder.',
    materials:[['Casco de aluminio','Aguanta la presión del aire interior'],['Aislamiento multicapa','Láminas de Kapton y poliéster'],['Tela Beta','Fibra de vidrio recubierta de teflón (la capa blanca)'],['Escudo','Capas de aluminio, Kevlar y Nextel']],
    conditions:[['Dentro','101,3 kPa · ~21 % O₂'],['Fuera','Vacío, sin oxígeno'],['Temperatura exterior','De −150 °C a +120 °C']],
    fire:['El Kapton y el teflón sobrecalentados sueltan partículas de humo aunque no haya llama; SAME las midió en órbita.'],
    related:['PSI-102','PSI-101'],
    question:'¿Cómo producen humo el Kapton y el teflón cuando se calientan en microgravedad?',
   },
  ],
 },
 {
  id:'lunar',
  name:'Base lunar',
  kind:'Hábitat de superficie',
  intro:'Un pequeño puesto en la Luna, protegido por una barrera de regolito (suelo lunar). La gravedad es un sexto de la terrestre: el aire caliente sí sube, pero mucho más despacio. Los diseños proponen un aire con más oxígeno y menos presión.',
  environment:[
   ['Gravedad','0,17 g (un sexto de la Tierra)'],
   ['Presión','Diseño propuesto: 56,5 kPa'],
   ['Oxígeno','Diseño propuesto: 34 %'],
   ['Aire','Convección débil + ventiladores'],
  ],
  components:[
   {
    id:'habitat',name:'Módulo habitable',
    what:'Donde vive la tripulación. Un aire con menos presión y más oxígeno facilita salir a caminar por la Luna, pero cambia cómo arden los materiales.',
    materials:[['Paneles interiores','Nomex y paneles plásticos'],['Muebles y objetos blandos','Telas y espumas'],['Casco','Aluminio o capas inflables (Kevlar, Vectran)']],
    conditions:[['Gravedad','0,17 g'],['Presión','~56,5 kPa (propuesta)'],['Oxígeno','~34 % (propuesta)']],
    fire:['Con más oxígeno, en general los materiales se encienden más fácil y arden más rápido, aunque la presión total sea menor.','ACME BRE imitó sólidos ardiendo con 21 % a 40 % de oxígeno.'],
    related:['PSI-20','PSI-23','PSI-99'],
    question:'¿Cómo cambia la inflamabilidad de los materiales con 34 % de oxígeno y baja presión?',
   },
   {
    id:'airlock',name:'Esclusa',
    what:'Por aquí entran y salen los astronautas. El polvo lunar, fino y filoso, se pega a los trajes y queda flotando en el aire.',
    materials:[['Polvo lunar','Partículas minerales muy finas'],['Sellos de la escotilla','Silicona'],['Telas del traje','Capas con recubrimiento de teflón']],
    conditions:[['Gravedad','0,17 g'],['Presión','Pasa de vacío a presión de cabina'],['Partículas','Mucho polvo después de cada salida']],
    fire:['El polvo y el humo son partículas en el aire: un detector tiene que distinguirlos para no dar falsas alarmas.','DAFT probó el contador de partículas de SAME usando polvo de prueba en vez de humo.'],
    related:['PSI-47','PSI-179','PSI-102'],
    question:'¿El polvo en el aire puede confundir a los detectores de humo?',
   },
   {
    id:'atmosphere',name:'Control de atmósfera',
    what:'Tanques y reguladores que ajustan cuánto oxígeno y nitrógeno hay, y que quitan el CO₂. Definen las condiciones que enfrentaría cualquier fuego.',
    materials:[['Tanques de O₂ y N₂','Recipientes a presión de material compuesto'],['Tuberías y reguladores','Acero inoxidable y aluminio'],['Filtros de CO₂','Zeolitas y aminas']],
    conditions:[['Gravedad','0,17 g'],['Presión','Regulada (~56,5 kPa propuesta)'],['Oxígeno','Regulado (~34 % propuesta)']],
    fire:['BASS-II bajó el oxígeno agregando nitrógeno para encontrar el punto en que los sólidos dejan de arder.','FLEX estudió cómo gases como el CO₂ y el helio apagan llamas de gotas a distintas presiones.'],
    related:['PSI-68','PSI-69','PSI-25'],
    question:'¿Cómo deciden el oxígeno y la presión si un combustible puede arder en baja gravedad?',
   },
   {
    id:'lab',name:'Laboratorio',
    what:'Un módulo con mesas de trabajo, solventes y botellas de gas que usa la tripulación para sus experimentos.',
    materials:[['Solventes','Alcoholes e hidrocarburos'],['Botellas de gas','Gases de calibración y combustibles'],['Mesas','Policarbonato y metal']],
    conditions:[['Gravedad','0,17 g'],['Presión','La del hábitat'],['Aire','Extractores y ventiladores']],
    fire:['La gravedad lunar está entre la de órbita y la de la Tierra: los experimentos en esos dos extremos ayudan a imaginar qué pasaría aquí.'],
    related:['PSI-39','PSI-142','PSI-69'],
    question:'¿Cómo arden y se apagan las gotas de combustible en baja gravedad?',
   },
   {
    id:'power',name:'Energía y baterías',
    what:'Paneles solares en un mástil cargan baterías que mantienen viva la base durante la noche lunar, que dura unas dos semanas.',
    materials:[['Celdas de ion-litio','Contienen un electrolito inflamable'],['Cables','Conductores con aislante plástico'],['Paneles solares','Vidrio, silicio y marco de aluminio']],
    conditions:[['Gravedad','0,17 g'],['Ubicación','Afuera o en una bóveda separada'],['Temperatura','Cambios extremos entre día y noche']],
    fire:['Ninguna investigación del catálogo estudia directamente el incendio de baterías: es una pregunta abierta.','Los estudios de humo son lo más cercano para detectar a tiempo un cable que se calienta.'],
    related:['PSI-102','PSI-101'],
    question:'¿Qué evidencia existe sobre aislantes eléctricos sobrecalentados en baja gravedad?',
   },
   {
    id:'shielding',name:'Barrera de regolito',
    what:'Suelo lunar amontonado que protege la base de la radiación y de los micrometeoritos.',
    materials:[['Regolito','Minerales: silicatos, hierro, titanio']],
    conditions:[['Gravedad','0,17 g'],['Atmósfera','Vacío'],['¿Arde?','No: no es combustible']],
    fire:['Fuera del hábitat no hay oxígeno, así que el riesgo de incendio está solo dentro del volumen presurizado.'],
    related:[],
    question:'',
   },
  ],
 },
 {
  id:'rover',
  name:'Rover presurizado',
  kind:'Vehículo de superficie',
  intro:'Un vehículo cerrado para viajes de varios días por la Luna. Tripulación, baterías y soporte vital comparten un espacio muy pequeño.',
  environment:[
   ['Gravedad','0,17 g (superficie lunar)'],
   ['Presión','Diseño propuesto: ~55 kPa'],
   ['Oxígeno','Diseño propuesto: 32–34 %'],
   ['Volumen libre','Unos 10 m³'],
  ],
  components:[
   {
    id:'cabin',name:'Cabina',
    what:'Dos astronautas viven, conducen y duermen aquí. Cada asiento y cada bolsa está al alcance de la mano.',
    materials:[['Asientos','Tela Nomex sobre espuma'],['Paneles interiores','Materiales compuestos'],['Almacenamiento','Bolsas de tela y empaques']],
    conditions:[['Gravedad','0,17 g'],['Presión','~55 kPa (propuesta)'],['Volumen','Muy pequeño: el humo se esparce rápido']],
    fire:['En un espacio pequeño, un fuego pequeño cambia rápido el oxígeno, el CO₂ y la visibilidad.','Los datos de Saffire muestran qué tan rápido puede crecer un fuego sobre telas.'],
    related:['PSI-26','PSI-25','PSI-98'],
    question:'¿Qué tan rápido puede crecer un fuego en telas dentro de un espacio cerrado y pequeño?',
   },
   {
    id:'battery',name:'Baterías',
    what:'Baterías bajo el piso que mueven las ruedas y alimentan el soporte vital.',
    materials:[['Celdas de ion-litio','Electrolito inflamable'],['Barras y cables','Cobre con aislante plástico'],['Caja','Aluminio']],
    conditions:[['Gravedad','0,17 g'],['Ubicación','Fuera de la cabina presurizada'],['Temperatura','Cambios día/noche; calor al conducir']],
    fire:['El incendio de baterías no está cubierto por las investigaciones del catálogo: es una pregunta abierta.','El humo de aislantes calentados es la evidencia más cercana disponible.'],
    related:['PSI-102','PSI-101'],
    question:'¿Qué investigaciones midieron el humo de materiales eléctricos calentados?',
   },
   {
    id:'lifesupport',name:'Soporte vital y radiador',
    what:'Ventiladores, filtros de CO₂ y un radiador en el techo que expulsa el calor al espacio.',
    materials:[['Ventiladores y ductos','Metal y plásticos'],['Filtro de CO₂','Aminas o zeolitas'],['Radiador','Paneles de aluminio con recubrimiento']],
    conditions:[['Gravedad','0,17 g'],['Aire','Ventiladores + convección débil'],['Oxígeno','Regulado (~32–34 % propuesta)']],
    fire:['En baja gravedad, el aire que mueven los ventiladores sigue siendo clave para “alimentar” una llama.'],
    related:['PSI-25','PSI-100'],
    question:'¿Cómo afecta la velocidad del aire a la propagación de una llama en baja gravedad?',
   },
   {
    id:'suitports',name:'Puertos de traje',
    what:'Los trajes espaciales se acoplan a la parte trasera del rover: los astronautas entran y salen por la espalda del traje sin meter polvo a la cabina.',
    materials:[['Capas exteriores del traje','Telas recubiertas de teflón'],['Sellos','Silicona'],['Polvo','Regolito lunar fino']],
    conditions:[['Gravedad','0,17 g'],['Presión','Sello entre la cabina y el vacío'],['Partículas','Polvo alrededor de la escotilla']],
    fire:['La silicona fue uno de los materiales quemados en Saffire-II y una de las fuentes de humo medidas en SAME.'],
    related:['PSI-99','PSI-102','PSI-47'],
    question:'¿Cómo se comportan los materiales de silicona en pruebas de fuego y humo en órbita?',
   },
   {
    id:'window',name:'Ventanas y escotilla',
    what:'Ventanas de varias capas para manejar y una escotilla delantera para acoplarse al hábitat.',
    materials:[['Vidrios','Sílice fundida y policarbonato'],['Marcos y sellos','Aluminio y silicona']],
    conditions:[['Gravedad','0,17 g'],['Presión','Cabina adentro, vacío afuera']],
    fire:['Los plásticos y sellos están entre los materiales cuyo humo e inflamabilidad se probaron en órbita.'],
    related:['PSI-99','PSI-102'],
    question:'¿Qué materiales de naves se quemaron en los experimentos Saffire?',
   },
  ],
 },
];

/* ---------- Misión guiada ---------- */
export const mission = {
 title:'¡Humo en el módulo!',
 intro:'Eres parte de la tripulación de un módulo orbital. Suena la alarma de humo en el laboratorio. Toma decisiones paso a paso; después de cada una verás por qué funciona o no.',
 note:'Versión simplificada con fines educativos. Los procedimientos reales de las agencias espaciales son más detallados.',
 steps:[
  {
   prompt:'Suena la alarma de humo. ¿Qué haces primero?',
   options:[
    ['Aviso a toda la tripulación y a Control de Misión, y nos reunimos en un punto seguro.',true,'¡Bien! Lo primero es que todos sepan y estén a salvo. Ninguna alarma se ignora.'],
    ['Abro la escotilla al exterior para sacar el humo.',false,'¡Peligro! Afuera hay vacío: perderías el aire de la nave. Nunca se abre al exterior.'],
    ['La ignoro: seguramente es polvo.',false,'El polvo puede activar detectores (por eso existió DAFT), pero siempre se revisa. No se ignora una alarma.'],
   ],
   related:['PSI-47'],
  },
  {
   prompt:'¿Qué haces con los ventiladores del módulo?',
   options:[
    ['Los apago.',true,'Correcto. En órbita el aire caliente no sube: sin ventiladores, la llama recibe menos oxígeno fresco y el humo no se reparte por toda la estación.'],
    ['Los pongo al máximo para limpiar el aire.',false,'Más flujo de aire puede alimentar la llama con oxígeno y llevar el humo a otros módulos. BASS-II y Saffire-III estudiaron cómo el flujo cambia el fuego.'],
    ['No los toco.',false,'Dejar el aire circulando sigue alimentando la llama y esparciendo el humo.'],
   ],
   related:['PSI-25','PSI-100'],
  },
  {
   prompt:'Hay olor a quemado, pero no ves humo en el techo. ¿Cómo buscas la fuente?',
   options:[
    ['Miro el techo: el humo siempre sube.',false,'¡En microgravedad no! El humo no sube; se queda cerca de donde nace o lo mueve el aire.'],
    ['Uso un sensor portátil de gases y partículas y reviso los equipos con energía.',true,'Exacto. Con un sensor portátil se rastrea la fuente equipo por equipo. Los estudios SAME midieron cómo es el humo en órbita para diseñar mejores detectores.'],
    ['Espero a ver llamas.',false,'Esperar deja crecer el problema. En órbita, una llama puede ser pequeña, azul y difícil de ver.'],
   ],
   related:['PSI-102','PSI-101'],
  },
  {
   prompt:'El sensor indica que el humo sale del rack de electrónica. ¿Qué haces primero?',
   options:[
    ['Corto la energía eléctrica de ese rack.',true,'Correcto: quitas la fuente de calor. Muchas veces eso basta para que el aislante deje de quemarse.'],
    ['Le echo agua directamente.',false,'El agua y la electricidad no se mezclan, y en órbita el agua flota en burbujas. Primero se corta la energía.'],
    ['Abro el rack con las manos para mirar.',false,'Podrías quemarte o dar más aire al fuego. Primero se corta la energía y te proteges.'],
   ],
   related:['PSI-102'],
  },
  {
   prompt:'Aún sale un poco de humo. ¿Cómo lo apagas?',
   options:[
    ['Me pongo la máscara de respiración y uso el extintor portátil apuntando a la fuente.',true,'Muy bien: primero te proteges y luego apagas. Los extintores de CO₂ reducen el oxígeno alrededor de la llama; FLEX estudió qué tan bien apagan gases como el CO₂.'],
    ['Soplo para apagarlo, como una vela.',false,'Soplar le da más oxígeno. Además respirarías humo tóxico.'],
    ['Lo tapo con una toalla de tela.',false,'La tela es combustible y en órbita no queda “aplastando” la llama como en la Tierra.'],
   ],
   related:['PSI-69','PSI-68'],
  },
  {
   prompt:'El fuego se apagó. ¿Ya puedes quitarte la máscara?',
   options:[
    ['Todavía no: primero medimos el aire (CO, partículas) y lo limpiamos con los filtros.',true,'¡Misión cumplida! El humo puede dejar gases tóxicos como el monóxido de carbono aunque no se vean.'],
    ['Sí, ya no se ve humo.',false,'Que no se vea humo no significa que el aire sea seguro. Hay gases invisibles y peligrosos.'],
    ['Enciendo todos los ventiladores y abro las escotillas a otros módulos.',false,'Esparcirías el aire contaminado por toda la estación. Primero se mide y se limpia.'],
   ],
   related:['PSI-179'],
  },
 ],
};

/* ---------- Laboratorio de llama ---------- */
export const flameGravities = [
 {id:'earth',label:'Tierra',g:1,detail:'1 g'},
 {id:'mars',label:'Marte',g:.38,detail:'0,38 g'},
 {id:'moon',label:'Luna',g:.17,detail:'0,17 g'},
 {id:'orbit',label:'Órbita',g:0,detail:'≈ 0 g'},
];
export const flamePresets = [
 {label:'Vela en la Tierra',g:'earth',o2:21,flow:0,fuel:'candle'},
 {label:'Vela en la Luna',g:'moon',o2:21,flow:0,fuel:'candle'},
 {label:'Vela en órbita, sin viento',g:'orbit',o2:21,flow:0,fuel:'candle'},
 {label:'Órbita con ventilación',g:'orbit',o2:21,flow:15,fuel:'candle'},
 {label:'Gota en órbita (FLEX)',g:'orbit',o2:21,flow:0,fuel:'droplet'},
 {label:'Aire lunar propuesto (34 % O₂)',g:'moon',o2:34,flow:0,fuel:'candle'},
];
