import { Post } from './posts';

export type { Post, DeliveryFormat, BackgroundSource } from './posts';

const CONCEPT_IMAGES = [
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=600&auto=format&fit=crop',
];

const MOCK_QUOTES = [
  'O segredo do progresso constante é focar apenas no próximo pequeno passo.',
  'A excelência não é um ato isolado, mas um hábito esculpido todos os dias.',
  'Silencie o barulho do mundo para conseguir escutar a sua própria voz.',
  'Grandes jornadas começam com a coragem de dar um passo no escuro.',
  'Sua mente é um jardim. Os pensamentos são as sementes que você cultiva.',
  'A disciplina é a ponte que conecta seus sonhos à sua realidade física.',
  'Não espere as condições perfeitas. Crie a perfeição na imperfeição.',
  'Feito é infinitamente melhor do que perfeito e nunca começado.',
  'Onde há foco e intenção clara, a energia do universo se alinha.',
  'Seja mais forte do que a sua melhor e mais convincente desculpa.',
];

const MOCK_CAPTIONS = [
  'Focar no processo e não no resultado final é a chave para a consistência a longo prazo. Qual é o seu pequeno passo para hoje?\n\nDeixe seu comentário abaixo e salve este post para ler de novo! 👇\n\n#foco #disciplina #constancia #crescimento #inspiracao',
  'A excelência reside nas pequenas escolhas diárias. Os hábitos silenciosos definem para onde estamos caminhando de verdade.\n\nVocê concorda? Marque alguém que precisa ler isso hoje. 🌟\n\n#excelencia #habitos #produtividade #sucesso #inspiracao #desenvolvimentopessoal',
  'No meio do caos diário, tire um momento para respirar e voltar ao seu centro. O seu poder está no seu silêncio interior.\n\nSiga @inspirai para insights diários de reflexão.\n\n#pazinterior #autoconhecimento #mindfulness #saudemental #reflexoes',
  'A incerteza faz parte da jornada de qualquer pessoa extraordinária. Tenha coragem de arriscar e confiar no seu potencial.\n\nSalva este post para não esquecer disso! ↗️\n\n#coragem #lideranca #motivacao #empreendedorismo #confiança',
  'O que você tem plantado na sua mente ultimamente? Lembre-se de regar apenas os pensamentos que te impulsionam para frente.\n\nComente um "🌱" se você está pronto para cultivar o bem.\n\n#mentalidade #positividade #crençaslimitantes #evolucao #inspirai',
];

export function generateMockPostsForMonth(
  year: number,
  month: number
): Record<string, Post> {
  const posts: Record<string, Post> = {};
  const daysToFill = [3, 5, 8, 12, 15, 20, 24, 27];

  daysToFill.forEach((day, index) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    posts[dateStr] = {
      id: `mock-${dateStr}`,
      post_date: dateStr,
      quote: MOCK_QUOTES[index % MOCK_QUOTES.length],
      caption: MOCK_CAPTIONS[index % MOCK_CAPTIONS.length],
      image_url: CONCEPT_IMAGES[index % CONCEPT_IMAGES.length],
      delivery_format: index % 4 === 0 ? 'story' : 'feed',
      active_background_source: 'ai',
      status: index % 3 === 0 ? 'published' : 'ready',
    };
  });

  return posts;
}
