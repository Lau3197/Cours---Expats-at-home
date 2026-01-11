
import { CoursePackage, UserProfile, VocabItem, Course } from '../types';
import { A1_1_LESSONS } from './courses/a1_1_content';
import { A1_2_LESSONS } from './courses/a1_2_content';
import { A2_1_LESSONS } from './courses/a2_1_content';

const instructorImage = "https://i.ibb.co/s9XpSqzq/Moi-profil.jpg";

export const currentUser: UserProfile = {
  name: "Sophie Bennett",
  email: "sophie.b@expatsathome.be",
  avatar: instructorImage,
  role: 'student',
  bio: "Expat living in Brussels, aiming to master French.",
  levelGoal: 'B2',
  hasFullAccess: true
};

export const mockCourses: Course[] = [
  {
    id: 'a1-mastery',
    title: 'Beginner (A1) - Home Mastery',
    thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200',
    instructor: 'Sophie Bennett',
    studentsCount: 1240,
    rating: 4.9,
    earnings: 12500,
    progress: 15
  }
];

// Common Vocab for A1
const vocabA1: VocabItem[] = [
  { id: 'v1', french: 'Bonjour', translation: 'Hello', pronunciation: '/bɔ̃.ʒuʁ/', example: "Bonjour Sophie!" },
  { id: 'v2', french: 'Merci', translation: 'Thank you', pronunciation: '/mɛʁ.si/', example: "Merci beaucoup." },
  { id: 'v3', french: 'S\'il vous plaît', translation: 'Please', pronunciation: '/sil vu plɛ/' },
  { id: 'v4', french: 'Oui', translation: 'Yes', pronunciation: '/wi/' },
  { id: 'v5', french: 'Non', translation: 'No', pronunciation: '/nɔ̃/' },
  { id: 'v6', french: 'Bruxelles', translation: 'Brussels', pronunciation: '/bʁy.sɛl/' },
];

export const masterCurriculum: CoursePackage[] = [
  // --- LEVEL A1.1 ---
  {
    id: 'a1-1',
    title: 'Niveau A1.1 - Premiers Pas en Belgique',
    level: 'A1',
    description: 'The foundational course for new expats. Master greetings, self-introduction, and daily essentials in the Belgian context.',
    resources: [
      { id: 'r1', name: 'Belgian_Greeting_Guide.pdf', type: 'pdf', url: '#' },
      { id: 'r2', name: 'A1_Essential_CheatSheet.pdf', type: 'pdf', url: '#' },
      { id: 'r3', name: 'Brussels_Metro_French_Guide.pdf', type: 'pdf', url: '#' }
    ],
    sections: [
      {
        id: 's1',
        title: 'Module 1: Bases et Identité',
        lessons: [
          {
            id: 'l1',
            title: 'Leçon 01: Se présenter en Belgique',
            duration: '15:00',
            type: 'video',
            completed: true,
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l1,
            transcript: "Bienvenue dans cette première leçon. Aujourd'hui, nous allons apprendre à nous présenter..."
          },
          {
            id: 'l2',
            title: 'Leçon 02: Salutations et Politesse',
            duration: '12:30',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l2
          },
          {
            id: 'l3',
            title: 'Leçon 03: Les nombres et l\'âge',
            duration: '14:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l3
          },
          {
            id: 'l4',
            title: 'Leçon 04: La famille',
            duration: '10:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l4
          }
        ]
      },
      {
        id: 's2',
        title: 'Module 2: Vie Sociale & Environnement',
        lessons: [
          {
            id: 'l5',
            title: 'Leçon 05: Nationalités et Pays',
            duration: '15:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l5
          },
          {
            id: 'l6',
            title: 'Leçon 06: Les professions',
            duration: '18:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l6
          },
          {
            id: 'l7',
            title: 'Leçon 07: Découvrir Bruxelles',
            duration: '20:00',
            type: 'video',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', // Placeholder
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l7
          },
          {
            id: 'l8',
            title: 'Leçon 08: La Belgique (Régions)',
            duration: '12:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l8
          }
        ]
      },
      {
        id: 's3',
        title: 'Module 3: Le Temps et les Goûts',
        lessons: [
          {
            id: 'l9',
            title: 'Leçon 09: Jours et Mois',
            duration: '10:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l9
          },
          {
            id: 'l10',
            title: 'Leçon 10: Parler de ses goûts',
            duration: '15:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l10
          },
          {
            id: 'l11',
            title: 'Leçon 11: Couleurs et Descriptions',
            duration: '14:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l11
          },
          {
            id: 'l12',
            title: 'Leçon 12: Révision A1.1',
            duration: '30:00',
            type: 'quiz',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_1_LESSONS.l12
          }
        ]
      }
    ]
  },

  // --- LEVEL A1.2 ---
  {
    id: 'a1-2',
    title: 'Niveau A1.2 - Vie Quotidienne à Bruxelles',
    level: 'A2', // Slightly higher A1
    description: 'Level up your daily interactions. Learn to order food, shop at markets, and navigate social situations.',
    resources: [
      { id: 'r_a2_1', name: 'Restaurant_Cheatsheet.pdf', type: 'pdf', url: '#' },
      { id: 'r_a2_2', name: 'Belgian_Beer_Guide.pdf', type: 'pdf', url: '#' }
    ],
    sections: [
      {
        id: 's4',
        title: 'Module 1: Sorties et Courses',
        lessons: [
          {
            id: 'l13',
            title: 'Leçon 01: Au Restaurant',
            duration: '20:00',
            type: 'video',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l1
          },
          {
            id: 'l14',
            title: 'Leçon 02: Au Marché',
            duration: '15:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l2
          },
          {
            id: 'l15',
            title: 'Leçon 03: La Météo',
            duration: '10:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l3
          }
        ]
      },
      {
        id: 's5',
        title: 'Module 2: Routine et Loisirs',
        lessons: [
          {
            id: 'l16',
            title: 'Leçon 04: Activités Quotidiennes',
            duration: '18:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l4
          },
          {
            id: 'l17',
            title: 'Leçon 05: Loisirs et Hobbies',
            duration: '15:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l5
          },
          {
            id: 'l18',
            title: 'Leçon 06: Vêtements et Saisons',
            duration: '12:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l6
          }
        ]
      },
      {
        id: 's6',
        title: 'Module 3: Culture Belge',
        lessons: [
          {
            id: 'l19',
            title: 'Leçon 07: Gastronomie Belge',
            duration: '20:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l7
          },
          {
            id: 'l20',
            title: 'Leçon 08: Les Bières Belges',
            duration: '15:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l8
          }
        ]
      },
      {
        id: 's7',
        title: 'Module 4: Précision et Grammaire',
        lessons: [
          {
            id: 'l21',
            title: 'Leçon 09: Préférences',
            duration: '15:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l9
          },
          {
            id: 'l22',
            title: 'Leçon 10: Heure et Horaires',
            duration: '15:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l10
          },
          {
            id: 'l23',
            title: 'Leçon 11: Verbes Pronominaux',
            duration: '20:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l11
          },
          {
            id: 'l24',
            title: 'Leçon 12: Révision A1.2',
            duration: '30:00',
            type: 'quiz',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A1_2_LESSONS.l12
          }
        ]
      }
    ]
  },

  // --- LEVEL A2.1 ---
  {
    id: 'a2-1',
    title: 'Niveau A2.1 - Raconter au Passé',
    level: 'A2',
    description: 'Maîtrisez les temps du passé pour raconter vos souvenirs, votre arrivée en Belgique et vos voyages.',
    resources: [
      { id: 'r_a21_1', name: 'Imparfait_Cheatsheet.pdf', type: 'pdf', url: '#' },
      { id: 'r_a21_2', name: 'PC_vs_Imparfait_Guide.pdf', type: 'pdf', url: '#' }
    ],
    sections: [
      {
        id: 's_a21_1',
        title: 'Module 1: L\'imparfait',
        lessons: [
          {
            id: 'a21_l1',
            title: 'Leçon 01: Souvenirs d\'enfance',
            duration: '20:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A2_1_LESSONS.l1
          },
          {
            id: 'a21_l2',
            title: 'Leçon 02: La vie avant la Belgique',
            duration: '20:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A2_1_LESSONS.l2
          }
        ]
      },
      {
        id: 's_a21_2',
        title: 'Module 2: Imparfait vs Passé Composé',
        lessons: [
          {
            id: 'a21_l3',
            title: 'Leçon 03: Mon arrivée en Belgique',
            duration: '25:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A2_1_LESSONS.l3
          },
          {
            id: 'a21_l4',
            title: 'Leçon 04: Un voyage mémorable',
            duration: '25:00',
            type: 'text',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A2_1_LESSONS.l4
          },
          {
            id: 'a21_l5',
            title: 'Leçon 05: Raconter au passé (Consolidation)',
            duration: '30:00',
            type: 'quiz',
            completed: false,
            vocabulary: vocabA1,
            comments: [],
            content: A2_1_LESSONS.l5
          }
        ]
      }
    ]
  }
];

