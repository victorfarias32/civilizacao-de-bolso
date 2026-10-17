import {
  type Game,
  type PathKey,
  type Ending,
  type HistoryEvent,
  PATHS,
  living,
  mean,
  demand,
  capacity,
  clamp,
} from "./model";

export const PATH_INFO: Record<
  PathKey,
  { name: string; color: string; scene: string }
> = {
  nature: {
    name: "Natureza",
    color: "#47945b",
    scene: "Bosques luminosos, raízes e jardins entre as casas.",
  },
  knowledge: {
    name: "Conhecimento",
    color: "#398cce",
    scene: "Observatório, engrenagens e instrumentos de luz azul.",
  },
  spirit: {
    name: "Consciência",
    color: "#a26bd0",
    scene: "Santuário, pedras suspensas e ecos violeta.",
  },
  order: {
    name: "Ordem",
    color: "#c79b35",
    scene: "Torres, muralhas e caminhos organizados.",
  },
  voyage: {
    name: "Exploração",
    color: "#dc873b",
    scene: "Porto, embarcações e caravanas de partida.",
  },
  memory: {
    name: "Memória",
    color: "#3f9e9a",
    scene: "Arquivo, inscrições e monumentos às gerações.",
  },
};
export interface DecisionOption {
  id: string;
  title: string;
  consequence: string;
  paths: Partial<Record<PathKey, number>>;
  cost: { food?: number; wood?: number };
  effects: {
    food?: number;
    wood?: number;
    confidence?: number;
    fertility?: number;
    forest?: number;
    energy?: number;
  };
}
export interface Decision {
  id: string;
  title: string;
  body: string;
  minCycle: number;
  when?: (g: Game) => boolean;
  options: DecisionOption[];
}
const option = (
  id: string,
  title: string,
  consequence: string,
  paths: DecisionOption["paths"],
  cost: DecisionOption["cost"] = {},
  effects: DecisionOption["effects"] = {},
): DecisionOption => ({ id, title, consequence, paths, cost, effects });
export const DECISIONS: Decision[] = [
  {
    id: "roots",
    title: "Que tipo de povo queremos ser?",
    body: "A primeira fogueira reúne doze opiniões. O que merece os primeiros esforços além da sobrevivência?",
    minCycle: 4,
    options: [
      option(
        "grove",
        "Cultivar um bosque comum",
        "Um jardim coletivo recupera a terra, mas consome parte das reservas.",
        { nature: 12, memory: 4 },
        { food: 120 },
        { fertility: 7, forest: 5, confidence: 3 },
      ),
      option(
        "study",
        "Construir instrumentos",
        "Um instrumento de observação nasce da madeira que serviria aos abrigos.",
        { knowledge: 12, voyage: 4 },
        { wood: 60 },
        { confidence: 1 },
      ),
      option(
        "charter",
        "Estabelecer uma carta comum",
        "A carta organiza o trabalho, mas limita a autonomia dos habitantes.",
        { order: 12, memory: 4 },
        {},
        { confidence: -4, energy: 6 },
      ),
    ],
  },
  {
    id: "echoes",
    title: "As vozes do rio",
    body: "À noite, o rio devolve sons que ninguém reconhece. Alguns querem compreender; outros querem partir.",
    minCycle: 12,
    options: [
      option(
        "listen",
        "Escutar em conjunto",
        "A escuta coletiva inspira um santuário e fortalece os vínculos.",
        { spirit: 12, nature: 4 },
        { food: 80 },
        { confidence: 5, energy: -4 },
      ),
      option(
        "record",
        "Registrar cada som",
        "As primeiras tábuas guardam os sons para que outros possam estudá-los.",
        { memory: 12, knowledge: 4 },
        { wood: 30 },
        { confidence: 2 },
      ),
      option(
        "scout",
        "Seguir o curso do rio",
        "A expedição retorna com madeira e notícias de outros vales.",
        { voyage: 12, knowledge: 4 },
        { food: 100 },
        { wood: 90, energy: -5 },
      ),
    ],
  },
  {
    id: "hunger",
    title: "Uma mesa menor",
    body: "As reservas não cobrem uma estação. A comunidade precisa decidir como atravessar a escassez.",
    minCycle: 12,
    when: (g) => g.resources.food < demand(g),
    options: [
      option(
        "forage",
        "Buscar nas encostas",
        "A busca traz alimento imediato, mas desgasta o solo e os corpos.",
        { voyage: 12, order: 4 },
        {},
        { food: 350, fertility: -8, energy: -8 },
      ),
      option(
        "share",
        "Abrir as reservas de madeira para troca",
        "A troca com viajantes traz alimento e uma história para lembrar.",
        { memory: 12, nature: 4 },
        { wood: 50 },
        { food: 400, confidence: 4 },
      ),
      option(
        "ration",
        "Organizar um jejum coletivo",
        "O grupo aceita a disciplina e recolhe provisões de emergência.",
        { order: 12, spirit: 4 },
        {},
        { food: 200, confidence: -5, energy: -5 },
      ),
    ],
  },
  {
    id: "relic",
    title: "A pedra que lembra o céu",
    body: "Sob as raízes, uma placa antiga reage à luz. Há sinais de uma inteligência anterior à comunidade.",
    minCycle: 20,
    options: [
      option(
        "decode",
        "Decifrar os mecanismos",
        "A placa abre um caminho de pesquisa sobre energia e matéria.",
        { knowledge: 12, voyage: 4 },
        { wood: 40 },
        { fertility: -3 },
      ),
      option(
        "dream",
        "Observar seus efeitos nos sonhos",
        "O grupo explora a relação entre a placa, a memória e a consciência.",
        { spirit: 12, memory: 6 },
        { food: 100 },
        { confidence: 3, energy: -3 },
      ),
      option(
        "preserve",
        "Preservar a descoberta",
        "Uma casa de registros protege a placa e a história de sua descoberta.",
        { memory: 12, knowledge: 6 },
        { wood: 25 },
        { confidence: 2 },
      ),
    ],
  },
  {
    id: "river",
    title: "O direito de mudar o rio",
    body: "Uma alteração na margem facilitaria o trabalho. Ela também mudaria os lugares onde os habitantes encontram alimento.",
    minCycle: 28,
    options: [
      option(
        "roots",
        "Restaurar a mata ciliar",
        "As raízes protegem o rio; a coleta passa a respeitar suas margens.",
        { nature: 12, spirit: 4 },
        { wood: 30 },
        { fertility: 10, forest: 6 },
      ),
      option(
        "wheels",
        "Instalar uma roda de observação",
        "A água move instrumentos e ensina novos princípios de trabalho.",
        { knowledge: 12, order: 4 },
        { wood: 45 },
        { fertility: -4 },
      ),
      option(
        "boats",
        "Preparar um pequeno ancoradouro",
        "O rio passa a conectar a vila a caminhos mais distantes.",
        { voyage: 12, memory: 4 },
        { food: 80 },
        { wood: 60 },
      ),
    ],
  },
  {
    id: "farewell",
    title: "O que fica de quem partiu?",
    body: "Uma despedida recente deixa perguntas sobre a memória, a morte e a continuidade da comunidade.",
    minCycle: 20,
    when: (g) => g.metrics.deaths > 0,
    options: [
      option(
        "archive",
        "Guardar nomes e histórias",
        "As famílias reúnem lembranças num arquivo comum.",
        { memory: 12, order: 4 },
        { wood: 20 },
        { confidence: 4 },
      ),
      option(
        "chorus",
        "Compartilhar as lembranças em vigília",
        "A vigília aproxima as experiências individuais e os estudos da consciência.",
        { spirit: 12, memory: 6 },
        { food: 80 },
        { confidence: 5 },
      ),
      option(
        "plant",
        "Plantar um bosque de memória",
        "A vida de cada pessoa passa a ser lembrada por uma árvore.",
        { nature: 12, memory: 4 },
        {},
        { forest: 8, fertility: 4 },
      ),
    ],
  },
  {
    id: "visitors",
    title: "Visitantes além da colina",
    body: "Viajantes oferecem mapas, ferramentas e um pacto. Aceitá-los muda a relação da vila com o desconhecido.",
    minCycle: 36,
    options: [
      option(
        "maps",
        "Trocar provisões por mapas",
        "Novas rotas e madeira chegam à comunidade.",
        { voyage: 12, knowledge: 6 },
        { food: 120 },
        { wood: 100 },
      ),
      option(
        "learn",
        "Receber seus estudiosos",
        "O encontro transforma perguntas antigas em experimentos.",
        { knowledge: 12, memory: 4 },
        { wood: 30 },
        { confidence: 3 },
      ),
      option(
        "pact",
        "Firmar um pacto com regras claras",
        "O pacto organiza os encontros, mas impõe novas exigências à vila.",
        { order: 12, voyage: 4 },
        {},
        { confidence: -3, wood: 40 },
      ),
    ],
  },
  {
    id: "pact",
    title: "Progresso ou pertencimento?",
    body: "O conhecimento da placa permite modificar o ambiente. Alguns pedem cautela; outros defendem uma transformação maior.",
    minCycle: 44,
    options: [
      option(
        "living",
        "Integrar os instrumentos às árvores",
        "A pesquisa aprende com o bosque e recupera o terreno.",
        { nature: 12, knowledge: 6 },
        { wood: 35 },
        { fertility: 8, forest: 4 },
      ),
      option(
        "engine",
        "Montar um núcleo experimental",
        "O núcleo amplia a pesquisa, exigindo matéria-prima e espaço.",
        { knowledge: 12, order: 6 },
        { wood: 45 },
        { fertility: -5 },
      ),
      option(
        "commons",
        "Criar uma assembleia permanente",
        "A assembleia organiza decisões e registra seus conflitos.",
        { order: 12, memory: 6 },
        { food: 60 },
        { confidence: 2 },
      ),
    ],
  },
  {
    id: "dreams",
    title: "Quando duas pessoas têm o mesmo sonho",
    body: "Duas pessoas descrevem a mesma lembrança que não viveram. A placa parece responder à presença do grupo.",
    minCycle: 52,
    options: [
      option(
        "connect",
        "Investigar uma consciência compartilhada",
        "O grupo investiga como preservar a identidade dentro da experiência coletiva.",
        { spirit: 12, knowledge: 6 },
        { food: 100 },
        { confidence: 4, energy: -5 },
      ),
      option(
        "test",
        "Medir e comparar as experiências",
        "Experimentos registram o fenômeno sem exigir uma interpretação única.",
        { knowledge: 12, spirit: 6 },
        { wood: 30 },
        { confidence: 1 },
      ),
      option(
        "voices",
        "Registrar as diferenças entre os relatos",
        "O arquivo guarda as divergências, preservando as vozes individuais.",
        { memory: 12, spirit: 6 },
        { wood: 20 },
        { confidence: 3 },
      ),
    ],
  },
  {
    id: "boundaries",
    title: "Onde termina nossa casa?",
    body: "Novos caminhos foram encontrados. Parte da comunidade quer estabilidade; outra parte teme confundir segurança com confinamento.",
    minCycle: 60,
    options: [
      option(
        "walls",
        "Erguer uma proteção comum",
        "A proteção organiza o espaço, mas exige disciplina e madeira.",
        { order: 12, knowledge: 4 },
        { wood: 30 },
        { confidence: -3 },
      ),
      option(
        "horizon",
        "Manter caminhos abertos",
        "Os exploradores voltam com materiais e notícias de um território habitável.",
        { voyage: 12, nature: 4 },
        { food: 100 },
        { wood: 90, energy: -4 },
      ),
      option(
        "corridor",
        "Criar corredores de vegetação",
        "Os caminhos tornam-se parte do ecossistema, em vez de cortá-lo.",
        { nature: 12, voyage: 6 },
        {},
        { forest: 6, fertility: 5 },
      ),
    ],
  },
  {
    id: "school",
    title: "O que ensinar à próxima geração?",
    body: "As crianças herdarão mais que abrigos. A vila precisa escolher o que transmitir primeiro.",
    minCycle: 68,
    options: [
      option(
        "history",
        "Ensinar a história de todos",
        "O arquivo passa a incluir erros, conflitos e decisões difíceis.",
        { memory: 12, spirit: 4 },
        { wood: 20 },
        { confidence: 4 },
      ),
      option(
        "science",
        "Ensinar experimentação",
        "Os instrumentos da placa tornam-se uma linguagem comum de pesquisa.",
        { knowledge: 12, voyage: 4 },
        { wood: 25 },
        { confidence: 2 },
      ),
      option(
        "duty",
        "Ensinar responsabilidades coletivas",
        "A organização melhora, mas as novas gerações recebem obrigações rígidas.",
        { order: 12, memory: 4 },
        {},
        { confidence: -3, energy: 5 },
      ),
    ],
  },
  {
    id: "sky",
    title: "Uma resposta das estrelas",
    body: "O observatório reconhece na placa um mapa do céu. Ele parece indicar uma rota, não apenas uma posição.",
    minCycle: 76,
    options: [
      option(
        "signal",
        "Construir um transmissor",
        "O sinal abre a possibilidade de uma viagem usando a infraestrutura antiga.",
        { knowledge: 12, voyage: 8 },
        { wood: 35 },
        { energy: -3 },
      ),
      option(
        "route",
        "Preparar uma expedição de longo alcance",
        "A comunidade aprende a sustentar pessoas longe do vale.",
        { voyage: 12, knowledge: 8 },
        { food: 120 },
        { wood: 70 },
      ),
      option(
        "meaning",
        "Investigar quem observa o observador",
        "O fenômeno aproxima os estudos do cosmos e da consciência.",
        { spirit: 12, knowledge: 8 },
        { food: 100 },
        { confidence: 3 },
      ),
    ],
  },
  {
    id: "sanctuary",
    title: "Um lugar que não será explorado",
    body: "A sociedade pode reservar parte de sua energia para algo que não produz recursos imediatos.",
    minCycle: 84,
    options: [
      option(
        "forest",
        "Proteger um bosque vivo",
        "O bosque se torna um compromisso duradouro com a terra.",
        { nature: 12, spirit: 6 },
        { food: 100 },
        { forest: 10, fertility: 8 },
      ),
      option(
        "library",
        "Proteger a memória das gerações",
        "Um arquivo de pedra dá continuidade às histórias individuais.",
        { memory: 12, order: 6 },
        { wood: 30 },
        { confidence: 3 },
      ),
      option(
        "silence",
        "Proteger um espaço de consciência",
        "A experiência coletiva ganha um santuário e regras de escuta.",
        { spirit: 12, memory: 6 },
        { food: 80 },
        { confidence: 5 },
      ),
    ],
  },
  {
    id: "dissent",
    title: "O direito de discordar",
    body: "Uma minoria pede para seguir outro caminho. Como preservar a comunidade sem apagar suas diferenças?",
    minCycle: 92,
    options: [
      option(
        "debate",
        "Preservar os relatos e abrir o debate",
        "O arquivo acolhe posições opostas, fortalecendo a confiança.",
        { memory: 12, spirit: 6 },
        { food: 80 },
        { confidence: 6 },
      ),
      option(
        "discipline",
        "Exigir a continuidade do plano",
        "A coordenação cresce, mas a confiança paga o preço do controle.",
        { order: 14, knowledge: 4 },
        {},
        { confidence: -8, energy: 5 },
      ),
      option(
        "departure",
        "Preparar uma partida voluntária futura",
        "Mapas e provisões são separados para uma migração quando houver condições.",
        { voyage: 12, memory: 6 },
        { food: 80 },
        { wood: 70, confidence: 2 },
      ),
    ],
  },
  {
    id: "resonance",
    title: "A matéria responde aos pensamentos",
    body: "Os sinais da placa, dos instrumentos e das vigílias começam a se relacionar. Há uma descoberta maior a compreender.",
    minCycle: 100,
    options: [
      option(
        "bridge",
        "Unir pesquisa e consciência",
        "A investigação aproxima uma passagem que altera a relação com a realidade.",
        { knowledge: 10, spirit: 10 },
        { wood: 30 },
        { energy: -6 },
      ),
      option(
        "biosphere",
        "Testar a ressonância no bosque",
        "Raízes e instrumentos passam a compartilhar o mesmo espaço.",
        { nature: 12, knowledge: 6 },
        { food: 100 },
        { fertility: 7 },
      ),
      option(
        "account",
        "Preservar um relato verificável",
        "O arquivo distingue o que aconteceu das interpretações do fenômeno.",
        { memory: 12, knowledge: 6 },
        { wood: 20 },
        { confidence: 3 },
      ),
    ],
  },
  {
    id: "vessel",
    title: "Um veículo para o amanhã",
    body: "A vila pode concentrar recursos em uma forma de continuidade. Cada projeto responde de modo diferente à pergunta: o que deve partir?",
    minCycle: 108,
    options: [
      option(
        "ark",
        "Preparar uma arca de viagem",
        "A arca combina o conhecimento antigo com a logística de exploração.",
        { voyage: 12, knowledge: 8 },
        { food: 100 },
        { wood: 90 },
      ),
      option(
        "mind",
        "Preparar a continuidade das lembranças",
        "A experiência coletiva recebe limites e registros para preservar identidades.",
        { spirit: 12, memory: 8 },
        { wood: 25 },
        { confidence: 4 },
      ),
      option(
        "seed",
        "Preparar sementes para a paisagem",
        "A comunidade investe na continuidade do ecossistema.",
        { nature: 12, memory: 6 },
        { food: 100 },
        { forest: 9, fertility: 6 },
      ),
    ],
  },
  {
    id: "institutions",
    title: "Quem cuidará do que construímos?",
    body: "As estruturas já não dependem apenas dos fundadores. É preciso decidir como sustentá-las.",
    minCycle: 116,
    options: [
      option(
        "stewards",
        "Criar um conselho de guardiões",
        "O conselho organiza cuidados e conservação, com deveres mais definidos.",
        { order: 12, nature: 6 },
        { wood: 20 },
        { confidence: 2 },
      ),
      option(
        "records",
        "Garantir acesso aos registros",
        "A memória torna-se um bem comum e pode atravessar gerações.",
        { memory: 12, voyage: 6 },
        { wood: 20 },
        { confidence: 4 },
      ),
      option(
        "laboratory",
        "Abrir os instrumentos à comunidade",
        "A pesquisa se torna compartilhada e aprende com a vida coletiva.",
        { knowledge: 12, spirit: 6 },
        { wood: 20 },
        { confidence: 3 },
      ),
    ],
  },
  {
    id: "lastwinter",
    title: "Que promessa merece o último esforço?",
    body: "O horizonte desta geração se aproxima. A comunidade escolhe o que pretende entregar aos sucessores.",
    minCycle: 124,
    options: [
      option(
        "home",
        "Uma terra capaz de se renovar",
        "O último esforço protege a vida que permanecerá no vale.",
        { nature: 14, memory: 4 },
        { food: 80 },
        { fertility: 8, forest: 8 },
      ),
      option(
        "agreement",
        "Uma cidade que cumpre seus pactos",
        "As instituições se consolidam, com o risco de tornar a mudança difícil.",
        { order: 14, memory: 4 },
        {},
        { confidence: -3 },
      ),
      option(
        "beyond",
        "Um caminho para além das fronteiras",
        "A preparação de uma partida amplia as possibilidades de continuidade.",
        { voyage: 14, knowledge: 6 },
        { food: 100 },
        { wood: 80 },
      ),
    ],
  },
  {
    id: "testament",
    title: "O testamento dos fundadores",
    body: "As experiências acumuladas pedem uma última interpretação. O destino não apaga os caminhos que ficaram misturados.",
    minCycle: 132,
    options: [
      option(
        "voices",
        "Guardar todas as vozes",
        "O arquivo preserva a história sem reduzir as pessoas a uma única narrativa.",
        { memory: 14, spirit: 6 },
        { wood: 15 },
        { confidence: 5 },
      ),
      option(
        "threshold",
        "Compreender o outro lado",
        "Pesquisa e consciência fazem uma última tentativa de compreender a passagem.",
        { knowledge: 10, spirit: 12 },
        { food: 80 },
        { energy: -4 },
      ),
      option(
        "living",
        "Entregar a vila ao mundo vivo",
        "A sociedade aceita ser parte de um sistema maior.",
        { nature: 12, spirit: 8 },
        {},
        { fertility: 6, forest: 5 },
      ),
    ],
  },
];

export function decisionById(id: string | null) {
  return DECISIONS.find((d) => d.id === id);
}
export function canAfford(g: Game, o: DecisionOption) {
  return (
    g.resources.food >= (o.cost.food || 0) &&
    g.resources.wood >= (o.cost.wood || 0)
  );
}
export function consequenceText(o: DecisionOption) {
  const costs = [
    o.cost.food ? `−${o.cost.food} alimento` : null,
    o.cost.wood ? `−${o.cost.wood} madeira` : null,
  ].filter(Boolean);
  const effects = Object.entries(o.effects)
    .filter(([, n]) => n !== 0)
    .map(
      ([k, n]) =>
        `${n! > 0 ? "+" : ""}${n} ${({ food: "alimento", wood: "madeira", confidence: "confiança", fertility: "fertilidade", forest: "floresta", energy: "energia" } as Record<string, string>)[k]}`,
    );
  return [...costs, ...effects].join(" · ") || "Sem custo imediato de recursos";
}
function note(
  g: Game,
  cycle: number,
  type: HistoryEvent["type"],
  title: string,
  text: string,
  evidence: HistoryEvent["evidence"],
) {
  g.history.push({
    id: g.nextEvent++,
    cycle,
    type,
    title,
    text,
    actorIds: [],
    evidence,
    relatedEventIds: [],
  });
}
export function applyDecision(g: Game, value: string, cycle: number): boolean {
  const [id, choice, ...extra] = value.split("/"),
    d = decisionById(id),
    o = d?.options.find((o) => o.id === choice);
  if (
    extra.length ||
    !d ||
    !o ||
    g.destiny.pending !== id ||
    g.destiny.resolved.some((r) => r.id === id) ||
    !canAfford(g, o)
  )
    return false;
  g.resources.food -= o.cost.food || 0;
  g.resources.wood -= o.cost.wood || 0;
  for (const [key, amount] of Object.entries(o.paths) as [PathKey, number][])
    g.destiny.scores[key] = clamp(g.destiny.scores[key] + amount);
  const e = o.effects;
  g.resources.food = Math.max(0, g.resources.food + (e.food || 0));
  g.resources.wood = Math.max(0, g.resources.wood + (e.wood || 0));
  g.confidence = clamp(g.confidence + (e.confidence || 0));
  g.environment.fertility = clamp(g.environment.fertility + (e.fertility || 0));
  g.environment.forest = clamp(g.environment.forest + (e.forest || 0));
  if (e.energy)
    living(g).forEach((p) => (p.energy = clamp(p.energy + e.energy!)));
  g.destiny.pending = null;
  g.destiny.nextAt = Math.min(168, cycle + 8);
  g.destiny.resolved.push({ id, option: choice, cycle });
  note(g, cycle, "decision", d.title, `${o.title}. ${o.consequence}`, {
    decision: id,
    option: choice,
    ...Object.fromEntries(
      Object.entries(o.paths).map(([k, n]) => [`path_${k}`, n!]),
    ),
  });
  for (const path of PATHS)
    for (const mark of [24, 48]) {
      const key = `${path}:${mark}`;
      if (g.destiny.scores[path] >= mark && !g.destiny.unlocked.includes(key)) {
        g.destiny.unlocked.push(key);
        note(
          g,
          cycle,
          "discovery",
          `${PATH_INFO[path].name}: ${mark === 24 ? "os primeiros sinais" : "uma transformação"}`,
          PATH_INFO[path].scene,
          { path, score: g.destiny.scores[path], milestone: mark },
        );
      }
    }
  return true;
}
export function offerDecision(g: Game) {
  if (
    g.destiny.pending ||
    g.cycle < g.destiny.nextAt ||
    g.cycle >= 152 ||
    g.status === "ended"
  )
    return;
  const eligible = DECISIONS.filter(
    (d) =>
      g.cycle >= d.minCycle &&
      !g.destiny.resolved.some((r) => r.id === d.id) &&
      (!d.when || d.when(g)),
  );
  const d = eligible.find((d) => d.when) || eligible[0];
  if (d) g.destiny.pending = d.id;
}
export interface EndingDefinition {
  id: Ending;
  title: string;
  short: string;
  story: string;
  paths: Partial<Record<PathKey, number>>;
  requirements: (g: Game) => { label: string; ok: boolean }[];
}
const pop = (g: Game) => living(g).length;
export const DESTINATIONS: EndingDefinition[] = [
  {
    id: "symbiosis",
    title: "O jardim que sonha",
    short: "Uma sociedade integrada ao ecossistema.",
    story:
      "As raízes atravessaram a vila sem derrubá-la. A comunidade aprendeu a viver como parte de um organismo maior: a floresta passou a guardar suas casas, e as casas passaram a cuidar da floresta.",
    paths: { nature: 48 },
    requirements: (g) => [
      {
        label: "Fertilidade de pelo menos 65%",
        ok: g.environment.fertility >= 65,
      },
      { label: "Floresta de pelo menos 55%", ok: g.environment.forest >= 55 },
      { label: "Confiança de pelo menos 50%", ok: g.confidence >= 50 },
    ],
  },
  {
    id: "stellar",
    title: "As sementes das estrelas",
    short: "A primeira partida para além do planeta.",
    story:
      "Os sinais da placa revelaram uma antiga rota entre as estrelas. A comunidade construiu sua arca com o que aprendeu no vale e partiu levando pessoas, sementes e perguntas. O planeta de origem tornou-se o primeiro capítulo, não a casa definitiva.",
    paths: { knowledge: 48, voyage: 24 },
    requirements: (g) => [
      { label: "120 de madeira para a arca", ok: g.resources.wood >= 120 },
      {
        label: "Alimento para duas estações",
        ok: g.resources.food >= demand(g) * 2,
      },
    ],
  },
  {
    id: "ascension",
    title: "O coro além dos corpos",
    short: "Uma continuidade construída a partir de consciências e lembranças.",
    story:
      "A passagem foi preparada por anos de escuta e registros. As lembranças entraram numa consciência compartilhada, preservadas como vozes distintas. Ninguém no vale poderia provar se aquilo era uma nova forma de vida ou uma despedida cuidadosamente lembrada.",
    paths: { spirit: 48, memory: 24 },
    requirements: (g) => [
      { label: "Confiança de pelo menos 55%", ok: g.confidence >= 55 },
    ],
  },
  {
    id: "utopia",
    title: "A cidade imóvel",
    short: "Uma sociedade que busca a perfeição — e enfrenta seu preço.",
    story:
      "As instituições finalmente funcionavam sem a presença dos fundadores. O abrigo, a produção e os deveres tinham um lugar definido. A cidade encontrara estabilidade; sua última pergunta era se ainda saberia aceitar uma mudança.",
    paths: { order: 48 },
    requirements: (g) => [
      { label: "Abrigo para todos", ok: capacity(g) >= pop(g) },
      { label: "Confiança de pelo menos 40%", ok: g.confidence >= 40 },
      { label: "Alimento para uma estação", ok: g.resources.food >= demand(g) },
    ],
  },
  {
    id: "migration",
    title: "Povos do horizonte",
    short:
      "Uma partida voluntária para continuar a história em outros lugares.",
    story:
      "A comunidade não esperou que o vale se tornasse uma prisão. As caravanas e os barcos partiram por rotas estudadas, levando ferramentas, tradições e a liberdade de fundar outras comunidades. As casas vazias ficaram como um começo que soube terminar.",
    paths: { voyage: 48 },
    requirements: (g) => [
      { label: "60 de madeira para a viagem", ok: g.resources.wood >= 60 },
      { label: "Alimento para uma estação", ok: g.resources.food >= demand(g) },
    ],
  },
  {
    id: "archive",
    title: "O arquivo das eras",
    short: "Uma civilização que escolhe preservar a experiência de existir.",
    story:
      "Nomes, vozes e decisões foram inscritos em estruturas feitas para atravessar gerações. A comunidade entregou seu legado a um arquivo vivo: não uma lista de vitórias, mas um conjunto de vidas que futuros povos poderiam compreender, questionar e continuar.",
    paths: { memory: 48 },
    requirements: (g) => [
      {
        label: "80 de madeira para proteger os registros",
        ok: g.resources.wood >= 80,
      },
    ],
  },
  {
    id: "cosmic",
    title: "O horizonte impossível",
    short: "Uma transformação rara na relação entre matéria e consciência.",
    story:
      "A pesquisa da placa e a experiência das consciências deixaram de ser assuntos separados. A passagem alterou a geometria do mundo e a comunidade atravessou um horizonte que os seus mapas não poderiam conter. O que continuou existindo carregava vestígios das pessoas que haviam escolhido chegar até ali.",
    paths: { knowledge: 48, spirit: 40, memory: 16 },
    requirements: (g) => [
      { label: "Confiança de pelo menos 55%", ok: g.confidence >= 55 },
      {
        label: "Saúde média de pelo menos 60%",
        ok: mean(living(g).map((p) => p.health)) >= 60,
      },
    ],
  },
  {
    id: "legacy",
    title: "O legado dos fundadores",
    short: "A vida continua nas mãos de quem veio depois.",
    story:
      "Quarenta anos chegaram ao fim. Nem toda comunidade precisava abandonar o mundo para deixar uma história extraordinária: os sobreviventes receberam as casas, os conflitos e as possibilidades construídas pelos fundadores.",
    paths: {},
    requirements: () => [],
  },
  {
    id: "extinction",
    title: "O último silêncio",
    short: "O fim dos habitantes, com seus vestígios no mundo.",
    story:
      "Não restaram habitantes para acender as janelas. A paisagem preservou os sinais das escolhas anteriores: as estruturas, os projetos e as lembranças sobreviveram de outra maneira.",
    paths: {},
    requirements: () => [],
  },
];
export function destination(id: Ending) {
  return DESTINATIONS.find((d) => d.id === id)!;
}
export function destinationChecks(g: Game, id: Ending) {
  const d = destination(id);
  return [
    { label: "Pelo menos 28 anos vividos", ok: g.cycle >= 112 },
    { label: "Pelo menos 4 habitantes vivos", ok: pop(g) >= 4 },
    ...Object.entries(d.paths).map(([key, n]) => ({
      label: `${PATH_INFO[key as PathKey].name}: ${n} de influência`,
      ok: g.destiny.scores[key as PathKey] >= n!,
    })),
    ...d.requirements(g),
  ];
}
export function readyDestinations(g: Game) {
  return DESTINATIONS.filter(
    (d) =>
      !["legacy", "extinction"].includes(d.id) &&
      destinationChecks(g, d.id).every((c) => c.ok),
  );
}
export function chooseEnding(g: Game): Ending {
  if (!pop(g)) return "extinction";
  const ready = readyDestinations(g);
  if (ready.some((d) => d.id === "cosmic")) return "cosmic";
  return (
    ready.sort(
      (a, b) =>
        Math.max(
          ...Object.keys(b.paths).map((k) => g.destiny.scores[k as PathKey]),
        ) -
        Math.max(
          ...Object.keys(a.paths).map((k) => g.destiny.scores[k as PathKey]),
        ),
    )[0]?.id || "legacy"
  );
}
export function mixedPaths(g: Game) {
  return PATHS.filter((k) => g.destiny.scores[k] >= 12).sort(
    (a, b) => g.destiny.scores[b] - g.destiny.scores[a],
  );
}
export function hybridParagraphs(g: Game): string[] {
  const s = g.destiny.scores,
    parts: string[] = [];
  if (s.nature >= 24 && s.knowledge >= 24)
    parts.push(
      "Os instrumentos foram envolvidos por jardins e raízes. A tecnologia não apagou o bosque: os dois caminhos passaram a dividir a mesma paisagem.",
    );
  if (s.spirit >= 24 && s.memory >= 24)
    parts.push(
      "O arquivo guardou mais que registros. As práticas de consciência transformaram as lembranças em encontros com as vozes das gerações anteriores.",
    );
  if (s.voyage >= 24 && s.knowledge >= 24)
    parts.push(
      "O porto e o observatório nasceram de esforços diferentes e acabaram preparando a mesma partida. Cada mapa carregava uma experiência de pesquisa.",
    );
  if (s.order >= 24 && s.nature >= 24)
    parts.push(
      "Entre as estruturas de organização, jardins e corredores vivos conservaram espaço para o imprevisível.",
    );
  if (s.order >= 48 && s.memory + s.spirit + s.nature < 36)
    parts.push(
      "A estabilidade também deixou uma sombra: havia pouco espaço registrado para vozes diferentes. A perfeição podia ser apenas o nome dado ao silêncio.",
    );
  if (!parts.length && mixedPaths(g).length > 1)
    parts.push(
      `A paisagem combinou ${mixedPaths(g)
        .map((k) => PATH_INFO[k].name.toLocaleLowerCase("pt-BR"))
        .join(", ")}. O destino principal não apagou as outras escolhas.`,
    );
  return parts;
}
