export type ProfileActivityOption = {
  specialties: readonly string[];
  sport: string;
};

export const PROFILE_ACTIVITY_CATALOG: readonly ProfileActivityOption[] = [
  {
    sport: "Futebol",
    specialties: [
      "Goleiro",
      "Zagueiro",
      "Lateral",
      "Volante",
      "Meio-campista",
      "Ponta",
      "Centroavante",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "Futsal",
    specialties: [
      "Goleiro",
      "Fixo",
      "Ala",
      "Pivô",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "Vôlei",
    specialties: [
      "Levantador",
      "Ponteiro",
      "Oposto",
      "Central",
      "Líbero",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "Basquete",
    specialties: [
      "Armador",
      "Ala-armador",
      "Ala",
      "Ala-pivô",
      "Pivô",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "Atletismo",
    specialties: [
      "Velocista",
      "Meio-fundista",
      "Fundista",
      "Saltador",
      "Lançador",
      "Marchador",
      "Treinador"
    ]
  },
  {
    sport: "Valorant",
    specialties: [
      "Duelista",
      "Controlador",
      "Iniciador",
      "Sentinela",
      "IGL",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "Counter-Strike 2",
    specialties: [
      "AWPer",
      "Rifler",
      "Entry fragger",
      "Suporte",
      "IGL",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "League of Legends",
    specialties: [
      "Topo",
      "Selva",
      "Meio",
      "Atirador",
      "Suporte",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "Free Fire",
    specialties: [
      "Rushador",
      "Suporte",
      "Granadeiro",
      "Capitão",
      "Treinador",
      "Analista"
    ]
  },
  {
    sport: "EA Sports FC",
    specialties: [
      "Jogador competitivo",
      "Treinador",
      "Criador de conteúdo",
      "Analista"
    ]
  },
  {
    sport: "Handebol",
    specialties: [
      "Goleiro",
      "Ponta",
      "Armador",
      "Central",
      "Pivô",
      "Treinador"
    ]
  },
  {
    sport: "Tênis",
    specialties: ["Simples", "Duplas", "Treinador", "Preparador físico"]
  },
  {
    sport: "Natação",
    specialties: [
      "Livre",
      "Costas",
      "Peito",
      "Borboleta",
      "Medley",
      "Águas abertas",
      "Treinador"
    ]
  },
  {
    sport: "Corrida",
    specialties: [
      "Velocidade",
      "Meia distância",
      "Longa distância",
      "Trail",
      "Treinador"
    ]
  },
  {
    sport: "Ciclismo",
    specialties: [
      "Estrada",
      "Mountain bike",
      "BMX",
      "Pista",
      "Ciclocross",
      "Treinador"
    ]
  },
  {
    sport: "Skate",
    specialties: ["Street", "Park", "Vertical", "Downhill", "Treinador"]
  },
  {
    sport: "Surfe",
    specialties: ["Shortboard", "Longboard", "Bodyboard", "Treinador"]
  },
  {
    sport: "Jiu-jitsu",
    specialties: ["Competidor", "Instrutor", "Preparador físico", "Analista"]
  },
  {
    sport: "Judô",
    specialties: ["Competidor", "Instrutor", "Preparador físico", "Analista"]
  },
  {
    sport: "MMA",
    specialties: [
      "Atleta",
      "Treinador",
      "Preparador físico",
      "Analista",
      "Cutman"
    ]
  },
  {
    sport: "Rugby",
    specialties: [
      "Pilar",
      "Hooker",
      "Segunda linha",
      "Asa",
      "Número 8",
      "Scrum-half",
      "Abertura",
      "Centro",
      "Ponta",
      "Fullback"
    ]
  },
  {
    sport: "Futebol americano",
    specialties: [
      "Quarterback",
      "Running back",
      "Wide receiver",
      "Linha ofensiva",
      "Linha defensiva",
      "Linebacker",
      "Defensive back",
      "Kicker"
    ]
  },
  {
    sport: "Beisebol",
    specialties: [
      "Arremessador",
      "Receptor",
      "Infielder",
      "Outfielder",
      "Rebatedor",
      "Treinador"
    ]
  },
  {
    sport: "Ginástica",
    specialties: [
      "Artística",
      "Rítmica",
      "Trampolim",
      "Aeróbica",
      "Treinador"
    ]
  }
];

function normalizeActivityValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/s+/g, " ");
}

export function findProfileActivity(sport: string) {
  const normalizedSport = normalizeActivityValue(sport);
  if (!normalizedSport) {
    return undefined;
  }

  return PROFILE_ACTIVITY_CATALOG.find(
    (option) => normalizeActivityValue(option.sport) === normalizedSport
  );
}

export function getSportSuggestions(query: string, maximum = 6) {
  const normalizedQuery = normalizeActivityValue(query);
  if (
    normalizedQuery &&
    PROFILE_ACTIVITY_CATALOG.some(
      (option) => normalizeActivityValue(option.sport) === normalizedQuery
    )
  ) {
    return [];
  }

  const options = normalizedQuery
    ? PROFILE_ACTIVITY_CATALOG.filter((option) =>
        normalizeActivityValue(option.sport).includes(normalizedQuery)
      ).sort((left, right) => {
        const leftStarts = normalizeActivityValue(left.sport).startsWith(
          normalizedQuery
        );
        const rightStarts = normalizeActivityValue(right.sport).startsWith(
          normalizedQuery
        );
        return Number(rightStarts) - Number(leftStarts);
      })
    : PROFILE_ACTIVITY_CATALOG;

  return options.slice(0, Math.max(0, maximum)).map((option) => option.sport);
}

export function getSpecialtySuggestions(
  sport: string,
  query: string,
  maximum = 8
) {
  const activity = findProfileActivity(sport);
  if (!activity) {
    return [];
  }

  const normalizedQuery = normalizeActivityValue(query);
  const specialties = normalizedQuery
    ? activity.specialties.filter((specialty) =>
        normalizeActivityValue(specialty).includes(normalizedQuery)
      )
    : activity.specialties;

  return specialties.slice(0, Math.max(0, maximum));
}