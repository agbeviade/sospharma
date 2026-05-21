// Recherche IA : parse le texte libre de l'utilisateur en filtres structurés.
// Si EXPO_PUBLIC_ANTHROPIC_KEY est défini → appel Claude Haiku.
// Sinon → parsing local rapide (fonctionne hors ligne, sans clé).

export interface SearchIntent {
  commune: string | null;
  onlyOnDuty: boolean;
  useLocation: boolean;
  medication: string | null;
  source: 'ai' | 'local';
}

const COMMUNES = [
  'Abobo','Adjamé','Anyama','Attécoubé','Bingerville',
  'Cocody','Koumassi','Marcory','Plateau','Port-Bouët',
  'Songon','Treichville','Yopougon',
];

// Mots déclencheurs de géolocalisation
const LOCATION_TRIGGERS = ['près de moi','autour','proche','à côté','autour de moi'];

// Mots qui signalent une pharmacie ouverte/de garde
const DUTY_TRIGGERS = ['garde','nuit','urgence','ouvert','disponible','24h'];

// Variantes orthographiques fréquentes
const COMMUNE_ALIASES: Record<string, string> = {
  'pk': 'Abobo',
  'riviera': 'Cocody',
  '2 plateaux': 'Cocody',
  'deux plateaux': 'Cocody',
  'angré': 'Cocody',
  'bonoumin': 'Cocody',
  'zone 4': 'Marcory',
  'wassakara': 'Yopougon',
  'niangon': 'Yopougon',
  'washington': 'Adjamé',
  'treich': 'Treichville',
  'port bouet': 'Port-Bouët',
  'port-bouet': 'Port-Bouët',
  'aéroport': 'Port-Bouët',
};

function removeAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function localParse(query: string): SearchIntent {
  const lower = removeAccents(query.toLowerCase());

  // Commune via alias
  let commune: string | null = null;
  for (const [alias, name] of Object.entries(COMMUNE_ALIASES)) {
    if (lower.includes(removeAccents(alias))) { commune = name; break; }
  }

  // Commune directe
  if (!commune) {
    commune = COMMUNES.find(c => lower.includes(removeAccents(c.toLowerCase()))) ?? null;
  }

  const useLocation = LOCATION_TRIGGERS.some(t => lower.includes(removeAccents(t)));
  const onlyOnDuty = DUTY_TRIGGERS.some(t => lower.includes(t)) || !useLocation;

  // Détection médicament simple : mots longs non-commune non-stopword
  const stopWords = new Set(['pharmacie','garde','de','la','le','les','du','des','une','un',
    'pour','dans','avec','près','moi','ouvert','nuit','urgence']);
  const medCandidate = lower
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopWords.has(w) && !COMMUNES.some(c => removeAccents(c.toLowerCase()) === w))
    .find(Boolean) ?? null;

  return { commune, onlyOnDuty, useLocation, medication: medCandidate, source: 'local' };
}

async function aiParse(query: string): Promise<SearchIntent> {
  const key = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
  if (!key) return localParse(query);

  const system = `Tu es un assistant de recherche de pharmacies à Abidjan, Côte d'Ivoire.
Parse la requête utilisateur et réponds UNIQUEMENT avec du JSON valide, sans markdown.
Communes valides : ${COMMUNES.join(', ')}.
Format strict :
{"commune":"NomOuNull","onlyOnDuty":true,"useLocation":false,"medication":"nomOuNull"}
- commune : null si aucune commune mentionnée
- onlyOnDuty : true par défaut (false seulement si l'utilisateur veut toutes les pharmacies)
- useLocation : true si "près de moi", "autour", "proche"
- medication : nom du médicament si mentionné, sinon null`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system,
      messages: [{ role: 'user', content: query }],
    }),
  });

  if (!res.ok) return localParse(query);

  const json = await res.json();
  const text: string = json.content?.[0]?.text ?? '';
  const parsed = JSON.parse(text.trim());
  return { ...parsed, source: 'ai' as const };
}

export async function parseSearch(query: string): Promise<SearchIntent> {
  const trimmed = query.trim();
  if (!trimmed) return { commune: null, onlyOnDuty: true, useLocation: false, medication: null, source: 'local' };

  try {
    return await aiParse(trimmed);
  } catch {
    return localParse(trimmed);
  }
}
