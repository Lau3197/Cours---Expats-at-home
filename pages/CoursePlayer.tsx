import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  Play,
  CheckCircle,
  FileText,
  Download,
  BrainCircuit,
  Send,
  MessageCircle,
  Dumbbell,
  PanelRightClose,
  PanelRightOpen,
  Headphones,
  Bell,
  ClipboardList,
  Upload,
  Award,
  Book,
  Volume2,
  Pause,
  Maximize
} from 'lucide-react';
import StyledMarkdown from '../components/StyledMarkdown';
import { CoursePackage, Lesson } from '../types';
import { getTutorHelp } from '../services/gemini';
import { currentUser } from '../data/mockData';
import LessonComments from '../components/LessonComments';
import VocabTrainer from '../components/VocabTrainer';
import LiveTutor from '../components/LiveTutor';
import FloatingNotes from '../components/FloatingNotes';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { sendNotification } from '../services/notifications';
// import { db } from '../services/firebase';
// import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface CoursePlayerProps {
  course: CoursePackage;
  onBack: () => void;
  initialLessonId?: string;
}

const generatePDF = (title: string, contentText: string) => {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(90, 107, 112);
  doc.text("ExpatsAtHome.be", 20, 20);
  doc.setFontSize(16);
  doc.text("French Mastery Resource", 20, 30);
  doc.setDrawColor(200, 122, 122);
  doc.line(20, 35, 190, 35);
  doc.setFontSize(18);
  doc.text(title, 20, 50);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const splitText = doc.splitTextToSize(contentText || "No content available.", 170);
  doc.text(splitText, 20, 65);
  doc.setFontSize(10);
  doc.text("Bonne chance dans votre apprentissage!", 20, 280);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

const generateCertificate = (userName: string, courseTitle: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setDrawColor(232, 197, 134);
  doc.setLineWidth(5);
  doc.rect(10, 10, 277, 190);
  doc.setFontSize(40);
  doc.setTextColor(90, 107, 112);
  doc.text("CERTIFICATE OF MASTERY", 148.5, 60, { align: 'center' });
  doc.setFontSize(20);
  doc.text("This is to certify that", 148.5, 80, { align: 'center' });
  doc.setFontSize(32);
  doc.setTextColor(200, 122, 122);
  doc.text(userName, 148.5, 105, { align: 'center' });
  doc.setFontSize(20);
  doc.setTextColor(90, 107, 112);
  doc.text("has successfully completed the course", 148.5, 125, { align: 'center' });
  doc.setFontSize(24);
  doc.text(courseTitle, 148.5, 145, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Completed on ${new Date().toLocaleDateString()}`, 148.5, 170, { align: 'center' });
  doc.save(`Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`);
};

// Helper to generate slugs matching rehype-slug default behavior (github-slugger)
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

const extractTOC = (content: string): TOCItem[] => {
  const lines = content.split(/\r?\n/);
  const toc: TOCItem[] = [];

  lines.forEach(line => {
    // Match # headers. Note: we skip h1 (# ) as that's usually the title
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);

      // Filter to only show main sections based on user request ("Parts", "Practice", "Review")
      // matches "Part 1", "Partie 1", "Practice", "Common Mistakes" (for Review), "Self-Evaluation"
      if (
        /^(Part|Partie)\s+\d+/i.test(text) ||
        /^Practice/i.test(text) ||
        /^Common Mistakes/i.test(text) ||
        /^Review/i.test(text) ||
        /^Self-Evaluation/i.test(text) ||
        /^Wrap-up/i.test(text)
      ) {
        toc.push({ id, text, level });
      }
    }
  });

  return toc;
};

interface PathViewProps {
  lessons: Lesson[];
  completedLessons: Set<string>;
  activeLesson: Lesson | null;
  setActiveLesson: (l: Lesson) => void;
  toggleFavorite: (id: string) => void;
  favoriteLessons: Set<string>;
  courseId: string;
  courseTitle: string;
}

interface GoldenNugget {
  id: string;
  type: 'grammar' | 'culture' | 'fact' | 'hack' | 'vocab';
  title: string;
  content: string;
  icon: string;
  color: string;
}

// --- Content & Data ---
// --- Content & Data ---
const GOLDEN_NUGGETS: GoldenNugget[] = [
  { id: 'gn1', type: 'grammar', title: "Adjective Order", content: "In French, most adjectives go AFTER the noun (e.g., 'un chat noir'). Only a few short ones (Beauty, Age, Goodness, Size) go before!", icon: "📏", color: "from-blue-400 to-blue-600" },
  { id: 'gn2', type: 'vocab', title: "False Friend: Chapeau", content: "'Chapeau' means hat. It does NOT mean 'cheap'. Imagine a chap in a hat!", icon: "🎩", color: "from-amber-400 to-orange-500" },
  { id: 'gn3', type: 'culture', title: "Escargots", content: "The French eat over 30,000 tons of snails a year. They are usually cooked with garlic and parsley butter.", icon: "🐌", color: "from-green-400 to-emerald-600" },
  { id: 'gn4', type: 'grammar', title: "Tu vs Vous", content: "'Tu' is for family, friends, and kids. 'Vous' is for strangers, elders, and groups. When in doubt, use 'Vous'!", icon: "🤝", color: "from-purple-400 to-indigo-600" },
  { id: 'gn5', type: 'fact', title: "No 'W'?", content: "Traditionally, there are NO words in French with the letter 'W'. All 'W' words (wagon, weekend) are borrowed!", icon: "🤯", color: "from-red-400 to-rose-600" },
  { id: 'gn6', type: 'hack', title: "The Magic Word", content: "Always say 'Bonjour' immediately when entering a shop. It's not just polite, it's a social requirement for good service!", icon: "🥖", color: "from-yellow-400 to-amber-600" },
  { id: 'gn7', type: 'grammar', title: "Être & Avoir", content: "These two verbs are the building blocks of 80% of French sentences. Master them first!", icon: "🔑", color: "from-cyan-400 to-blue-500" },
  { id: 'gn8', type: 'culture', title: "Camembert Origins", content: "Camembert was supposedly invented by Marie Harel in 1791, during the French Revolution.", icon: "🧀", color: "from-yellow-200 to-yellow-500" },
  { id: 'gn9', type: 'fact', title: "French in England", content: "French was the official language of England for about 300 years (1066-1362).", icon: "🏰", color: "from-stone-400 to-stone-600" },
  { id: 'gn10', type: 'hack', title: "Silent 'H'", content: "The 'H' is almost ALWAYS silent. 'Hôtel' sounds like 'Otel'. Don't breathe the H!", icon: "😶", color: "from-gray-400 to-gray-600" },
];

const LOCKED_PHRASES = [
  "🔒 The door is sealed by a Grammar Spell!",
  "✋ Halt! You must master the previous lesson first.",
  "💤 This room is sleeping. Wake it up by finishing the last one!",
  "🕵️ You need more XP (Experience in Past lessons) to enter.",
  "🧙‍♂️ 'You shall not pass!' ...yet.",
  "🔑 The key is hidden in the previous chapter.",
  "📜 Knowledge must be earned in order.",
  "🚧 Under Construction (until you finish the last task)."
];

const OPEN_PHRASES = [
  "🚪 Creak... The path to knowledge opens!",
  "✨ Enter, brave learner!",
  "📜 Let's uncover some new secrets.",
  "🧠 Your brain is ready for this.",
  "🚀 Allons-y! (Let's go!)",
  "🔓 Unlocked! Good luck inside.",
  "👣 Another step on the long road to fluency."
];

const SIGNPOST_MESSAGES = [
  "Paris: 300km ➡️",
  "Beware of irregular verbs! 🐺",
  "Rest area ahead: Have a croissant. 🥐",
  "Did you practice your 'R' sound today?",
  "Keep going! Succès is near.",
  "Warning: Heavy accent zone.",
  "Shortcut to fluency? There are no shortcuts!",
  "Look at the view! (It's just pixels, but still)",
  "Don't give up! Courage!",
  "Lost? Conjugate 'aller' to find your way."
];

const RPG_MESSAGES = {
  tree: [
    "An ancient oak. It whispers irregular verbs...",
    "There's a carving here: 'Je suis, tu es, il est...'",
    "A squirrel is judging your pronunciation.",
    "This tree might hide a secret passage (not really)."
  ],
  rock: [
    "This rock looks suspiciously like Napoleon.",
    "It's heavy. Like French grammar sometimes.",
    "A gemstone? No, just a rock.",
    "It feels cold to the touch."
  ],
  signpost: SIGNPOST_MESSAGES
};

const STORY_EVENTS: Record<number, { title: string; text: string; image: string; reward?: string }> = {
  0: { title: "The Adventure Begins", text: "Welcome, young learner! Your journey to French mastery starts here. Cross the Forest of Words and collect knowledge!", image: "/assets/retro/signpost.png" },
  3: { title: "First Steps", text: "You're making good progress! Keep going to unlock new horizons.", image: "/assets/retro/rock.png" },
  5: { title: "Hidden Treasure", text: "Bravo! You found a chest. It contains... 50 XP!", image: "/assets/retro/chest_open.png", reward: "50 XP" },
  10: { title: "Forest Guardian", text: "The forest holds no more secrets for you. The desert awaits.", image: "/assets/retro/tree.png" }
};

const PathView: React.FC<PathViewProps> = ({
  lessons,
  completedLessons,
  activeLesson,
  setActiveLesson,
  toggleFavorite,
  favoriteLessons,
  courseId,
  courseTitle
}) => {
  const [showStory, setShowStory] = useState<{ title: string; text: string; image: string } | null>(null);
  const [activeNugget, setActiveNugget] = useState<GoldenNugget | null>(null);
  const [dialogue, setDialogue] = useState<{ title: string; text: string; image?: string; isReward?: boolean } | null>(null);

  // RPG State
  const [heroPos, setHeroPos] = useState({ x: 50, y: 100 }); // x in %, y in px
  const [direction, setDirection] = useState<'down' | 'up' | 'left' | 'right'>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [frame, setFrame] = useState(0); // 0 or 1 for walk cycle
  const [openedChests, setOpenedChests] = useState<Set<number>>(new Set());
  const [heroMessage, setHeroMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);
  const heroMsgTimeout = useRef<NodeJS.Timeout>();

  const showHeroMessage = (msg: string) => {
    setHeroMessage(msg);
    if (heroMsgTimeout.current) clearTimeout(heroMsgTimeout.current);
    heroMsgTimeout.current = setTimeout(() => setHeroMessage(null), 3000);
  };

  const SPEED = 0.4; // px per ms
  const ITEM_HEIGHT = 180;
  const X_AMPLITUDE = 35;
  const TOTAL_HEIGHT = lessons.length * ITEM_HEIGHT + 400; // Extra space at bottom

  // --- Entity Generation (Memoized) ---
  const entities = useMemo(() => {
    const list: any[] = [];

    // 1. Lessons & Chests
    lessons.forEach((lesson, index) => {
      const y = index * ITEM_HEIGHT + 80;
      const x = 50 + Math.sin(index * 1.5) * X_AMPLITUDE; // %

      // Lesson Entity
      list.push({
        type: 'lesson',
        id: `lesson-${lesson.id}`,
        xPercent: x,
        yPx: y,
        data: { ...lesson, index },
        width: 100 // approx width for hit box
      });

      // Chest Entity (Every 5 lessons)
      if ((index + 1) % 5 === 0) {
        // Position chest to the right of the lesson
        // x + 25% looks good separation wise
        const chestX = x + 25;
        list.push({
          type: 'chest',
          id: `chest-${index}`,
          xPercent: chestX,
          yPx: y,
          data: { index: index + 1 }, // 1-based index for logic
          width: 60
        });
      }
    });

    // 2. Decor (Randomized but deterministic)
    lessons.forEach((_, i) => {
      const seed = (i * 9301 + 49297) % 233280;
      const yBase = i * ITEM_HEIGHT + 80;

      // Add multiple decor items per segment for richness
      const decorCount = 1 + (seed % 3); // 1 to 3 items

      for (let j = 0; j < decorCount; j++) {
        const subSeed = (seed * (j + 1) * 7919) % 100000;
        const typeRnd = subSeed % 100;
        let type = 'grass';
        if (typeRnd > 90) type = 'signpost';
        // Removed chest_prop to avoid crash and confusion
        else if (typeRnd > 60) type = 'tree';
        else if (typeRnd > 40) type = 'rock';

        // Random X position (avoiding center path ~ 30-70%)
        let xPos = (subSeed % 40); // 0-40
        if (subSeed % 2 === 0) xPos += 60; // 60-100 (Right side)
        // else 0-40 (Left side) -> keeps 40-60 clear for path mostly

        // Random Y offset
        const yOffset = (subSeed % 100) - 50;

        list.push({
          type: 'decor',
          id: `decor-${i}-${j}`,
          subtype: type,
          xPercent: xPos,
          yPx: yBase + yOffset,
          width: type === 'tree' ? 80 : 40,
          data: {}
        });
      }
    });

    return list;
  }, [lessons]);

  // Load saved position
  useEffect(() => {
    const savedPos = localStorage.getItem(`rpg_pos_${courseId}`);
    if (savedPos) {
      setHeroPos(JSON.parse(savedPos));
    } else if (activeLesson) {
      // Start at active lesson if no save
      const idx = lessons.findIndex(l => l.id === activeLesson.id);
      if (idx !== -1) {
        const lessonEntity = entities.find(e => e.type === 'lesson' && e.data.index === idx);
        if (lessonEntity) {
          setHeroPos({ x: lessonEntity.xPercent, y: lessonEntity.yPx + 50 }); // +50 to stand below
        }
      }
    }
  }, [courseId, activeLesson, lessons, entities]); // run once on mount per course

  // Save position periodically
  useEffect(() => {
    const save = setTimeout(() => {
      localStorage.setItem(`rpg_pos_${courseId}`, JSON.stringify(heroPos));
    }, 1000);
    return () => clearTimeout(save);
  }, [heroPos, courseId]);

  // Load Opened Chests
  useEffect(() => {
    const savedChests = localStorage.getItem(`rpg_chests_${courseId}`);
    if (savedChests) {
      setOpenedChests(new Set(JSON.parse(savedChests)));
    }
  }, [courseId]);

  // Save Opened Chests
  useEffect(() => {
    localStorage.setItem(`rpg_chests_${courseId}`, JSON.stringify(Array.from(openedChests)));
  }, [openedChests, courseId]);

  // Game Loop
  const update = (time: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    let dx = 0;
    let dy = 0;

    // Check keys
    if (keysPressed.current['ArrowUp']) dy -= 1;
    if (keysPressed.current['ArrowDown']) dy += 1;
    if (keysPressed.current['ArrowLeft']) dx -= 1;
    if (keysPressed.current['ArrowRight']) dx += 1;

    // Update state based on movement
    if (dx !== 0 || dy !== 0) {
      setIsMoving(true);

      // Normalize diagonal
      if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
      }

      // Update Direction
      if (dy > 0) setDirection('down');
      else if (dy < 0) setDirection('up');
      else if (dx > 0) setDirection('right');
      else if (dx < 0) setDirection('left');

      // Function state updater to avoid stale closure, but need refs for container width
      // Using simpler approach: rely on fast-enough re-renders or refs for exact pos if needed.
      // For React simple game loop, we usually use refs for pos, but state is okay for 60fps React 18+ usually.
      // To be safe and smooth, let's update a ref for position and sync to state separate?
      // For now, let's try direct state update, if jittery we switch to ref-based.

      const containerWidth = containerRef.current?.clientWidth || 800; // default estimate

      setHeroPos(prev => {
        const moveX_Percent = (dx * SPEED * deltaTime) / containerWidth * 100;
        const moveY_Px = dy * SPEED * deltaTime;

        let newX = prev.x + moveX_Percent;
        let newY = prev.y + moveY_Px;

        // Bounds Checking
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(TOTAL_HEIGHT - 50, newY));

        // --- WALK-OVER EVENTS (Signposts) ---
        // Check if we just walked over a signpost (or close enough)
        // Throttle this so it doesn't spam (simple counter ref or random check)
        if (Math.random() < 0.05) { // 5% chance per frame while moving
          const heroPxX = (newX / 100) * containerWidth;
          entities.forEach(e => {
            if (e.type === 'decor' && e.subtype === 'signpost') {
              const ex = (e.xPercent / 100) * containerWidth;
              const dist = Math.hypot(ex - heroPxX, e.yPx - newY);
              if (dist < 50 && !heroMessage) { // Close proximity
                const msg = SIGNPOST_MESSAGES[Math.floor(Math.random() * SIGNPOST_MESSAGES.length)];
                showHeroMessage(msg);
              }
            }
          });
        }

        return { x: newX, y: newY };
      });

      // Animate frame every 200ms
      setFrame(Math.floor(time / 200) % 2);

    } else {
      setIsMoving(false);
      setFrame(0);
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // Easter Egg Click Handler (Updated with real content)
  const handleDecorInteraction = (type: string) => { // Type loose to prevent crashes if bad data
    // Safety check
    if (!['tree', 'rock', 'signpost'].includes(type as string)) return;

    const messages = RPG_MESSAGES[type as keyof typeof RPG_MESSAGES];
    if (!messages) return;

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    const titleMap: any = { tree: "Ancient Tree", rock: "Mysterious Rock", signpost: "Old Signpost" };

    // Chance for hero to comment
    if (Math.random() > 0.5) {
      const heroRemarks = ["Hmm, interesting.", "I should write that down.", "Wow!", "Magnifique!"];
      showHeroMessage(heroRemarks[Math.floor(Math.random() * heroRemarks.length)]);
    }

    setDialogue({
      title: titleMap[type],
      text: randomMsg,
      image: `/assets/retro/${type}.png?v=4`
    });
  };

  // Chest Interaction
  const handleChestInteraction = (index: number) => {
    // Pick a "Golden Nugget" of learning
    const nugget = GOLDEN_NUGGETS[index % GOLDEN_NUGGETS.length];

    // Mark as opened
    if (!openedChests.has(index)) {
      showHeroMessage("Yes! Found knowledge!");
      setOpenedChests(prev => new Set(prev).add(index));
      setActiveNugget(nugget); // Trigger the richness
    } else {
      // Already opened, just show small reminder or re-open
      setActiveNugget(nugget);
    }
  };

  const saveNuggetToNotes = (nugget: GoldenNugget) => {
    const storageKey = `notes_${courseId}_rpg-rewards`;
    let currentContent = "";

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        currentContent = parsed.content || "";
      }
    } catch (e) { }

    // Append if not already there (simple check)
    if (!currentContent.includes(nugget.title)) {
      const newEntry = `\n\n### ${nugget.icon} ${nugget.title} (${nugget.type.toUpperCase()})\n${nugget.content}\n_Collected on ${new Date().toLocaleDateString()}_`;
      const newContent = currentContent + newEntry;

      const noteData = {
        courseId,
        lessonId: 'rpg-rewards',
        courseTitle,
        lessonTitle: '🏆 RPG Treasures',
        content: newContent.trim(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(noteData));
      showHeroMessage("Saved to Notebook! 📝");
    } else {
      showHeroMessage("Already in Notebook! 📒");
    }
    setActiveNugget(null);
  };

  // --- Unified Interaction Handler ---
  const handleInteraction = () => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth;

    let closest: any = null;
    let minDist = 120; // px interaction radius

    // Hero Px Position
    const heroXPx = (heroPos.x / 100) * containerW;
    const heroYPx = heroPos.y;

    entities.forEach(entity => {
      // Skip grass for interaction
      if (entity.type === 'decor' && entity.subtype === 'grass') return;

      const entXPx = (entity.xPercent / 100) * containerW;
      const dist = Math.hypot(entXPx - heroXPx, entity.yPx - heroYPx);

      if (dist < minDist) {
        minDist = dist;
        closest = entity;
      }
    });

    if (closest) {
      if (closest.type === 'lesson') {
        const lesson = closest.data;
        const idx = lesson.index;
        const isLocked = idx > 0 && !completedLessons.has(lessons[idx - 1].id) && !completedLessons.has(lesson.id);

        if (isLocked) {
          const lockedMsg = LOCKED_PHRASES[Math.floor(Math.random() * LOCKED_PHRASES.length)];
          showHeroMessage(lockedMsg);
          setDialogue({ title: "Locked", text: lockedMsg, image: "/assets/retro/door_closed.png" });
        } else {
          const openMsg = OPEN_PHRASES[Math.floor(Math.random() * OPEN_PHRASES.length)];
          showHeroMessage(openMsg);
          setActiveLesson(lesson);
        }
      } else if (closest.type === 'chest') {
        handleChestInteraction(closest.data.index);
      } else if (closest.type === 'decor') {
        handleDecorInteraction(closest.subtype);
      }
    }
  };

  // --- Click Handlers (Mouse) ---
  // We can reuse logic or call specific handlers.
  // For mouse clicks, we usually click the specific element.

  // Get current sprite
  const getHeroSprite = () => {
    const version = '?v=5';
    if (!isMoving) return `/assets/retro/hero_idle.png${version}`;
    if (direction === 'up') return `/assets/retro/hero_walk_up.png${version}`;
    if (direction === 'down') return `/assets/retro/hero_walk_down.png${version}`;
    // Side views - flip for left
    return `/assets/retro/hero_walk_side.png${version}`;
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        keysPressed.current[e.key] = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleInteraction();
      }
      if (e.key === 'Enter') {
        // Close dialogue if open
        if (dialogue) setDialogue(null);
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow')) keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [heroPos, entities, dialogue, completedLessons, lessons]); // Dependencies for interaction handler

  // Camera Follow
  useEffect(() => {
    if (containerRef.current) {
      // Simple clamp camera to hero Y
      // but we are inside a container, usually the WINDOW scrolls or the CONTAINER?
      // The container has height TOTAL_HEIGHT.
      // We likely want to scroll the WINDOW or the parent.
      const heroElement = document.getElementById('hero-sprite');
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' }); // abrupt?
        // better: manual scroll
        // window.scrollTo({ top: ... })
      }
    }
  }, [heroPos.y]); // only when Y changes significantly?

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto mb-20 select-none bg-[#F9F7F2] rounded-3xl overflow-hidden shadow-xl border-4 border-[#dd8b8b]/20" style={{ height: `${TOTAL_HEIGHT}px` }}>
      {/* 1. Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(#5A6B70 2px, transparent 2px)`, backgroundSize: '30px 30px' }} />
      <div className="absolute top-0 left-1/2 w-2 h-full bg-[#E8C586]/30 -translate-x-1/2 dashed-line" />

      {/* 2. Path SVG */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" viewBox={`0 0 100 ${TOTAL_HEIGHT}`} preserveAspectRatio="none">
        <path
          d={lessons.map((_, i) => {
            if (i === lessons.length - 1) return '';
            const curr = entities.find(e => e.type === 'lesson' && e.data.index === i);
            const next = entities.find(e => e.type === 'lesson' && e.data.index === i + 1);
            if (!curr || !next) return '';
            const cpY = curr.yPx + (next.yPx - curr.yPx) * 0.5;
            return `M ${curr.xPercent} ${curr.yPx} C ${curr.xPercent} ${cpY}, ${next.xPercent} ${cpY}, ${next.xPercent} ${next.yPx}`;
          }).join(' ')}
          fill="none" stroke="#dd8b8b" strokeWidth="1.5" strokeDasharray="8 8" className="opacity-60 animate-[dash_30s_linear_infinite]"
        />
      </svg>
      <style>{`@keyframes dash { to { stroke-dashoffset: -1000; } }`}</style>

      {/* 3. Render Entities (Decor -> Chests -> Lessons) for Z-order */}
      {entities.filter(e => e.type === 'decor').map(e => (
        <div
          key={e.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer z-10"
          style={{ left: `${e.xPercent}%`, top: `${e.yPx}px` }}
          onClick={(ev) => { ev.stopPropagation(); handleDecorInteraction(e.subtype); }}
        >
          <img
            src={`/assets/retro/${e.subtype}.png?v=5`}
            className={`object-contain opacity-90 ${e.subtype === 'grass' ? 'w-8 h-8 opacity-60' : (e.subtype === 'tree' ? 'w-32 h-32' : 'w-16 h-16')}`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      ))}

      {entities.filter(e => e.type === 'chest').map(e => (
        <div
          key={e.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 cursor-pointer hover:scale-125 transition-transform z-20"
          style={{ left: `${e.xPercent}%`, top: `${e.yPx}px` }}
          onClick={(ev) => { ev.stopPropagation(); handleChestInteraction(e.data.index); }}
        >
          {/* Interaction Hint */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
            {openedChests.has(e.data.index) ? 'Ouvert' : 'Ouvrir'}
          </div>
          <img
            src={(openedChests.has(e.data.index)) ? `/assets/retro/chest_open.png?v=5` : `/assets/retro/chest_closed.png?v=5`}
            className="w-full h-full object-contain drop-shadow"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      ))}

      {entities.filter(e => e.type === 'lesson').map(e => {
        const lesson = e.data;
        const isCompleted = completedLessons.has(lesson.id);
        const isActive = activeLesson?.id === lesson.id;
        const isLocked = !isCompleted && !isActive && lesson.index > 0 && !completedLessons.has(lessons[lesson.index - 1].id);
        const hasNotes = localStorage.getItem(`notes_${courseId}_${lesson.id}`) !== null;

        return (
          <div
            id={`lesson-node-${lesson.id}`}
            key={e.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 group"
            style={{ left: `${e.xPercent}%`, top: `${e.yPx}px` }}
          >
            <div className={`absolute -top-12 bg-white/90 border border-[#dd8b8b]/20 backdrop-blur-sm text-[#5A6B70] px-3 py-1 rounded-lg text-[10px] whitespace-nowrap font-bold shadow-md transition-all duration-300 pointer-events-none ${isActive ? 'opacity-100 -translate-y-1' : 'group-hover:opacity-100 opacity-0'}`}>
              {lesson.title}
            </div>

            <button
              onClick={() => !isLocked && setActiveLesson(lesson)}
              disabled={isLocked}
              className={`
                    w-24 h-24 flex items-center justify-center transition-all duration-300 relative
                    ${isActive ? 'scale-125 drop-shadow-2xl' : 'hover:scale-110 drop-shadow-md'}
                    ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer'}
                  `}
            >
              <img
                src={isCompleted ? `/assets/retro/door_open.png?v=5` : `/assets/retro/door_closed.png?v=5`}
                className="w-full h-full object-contain pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
              {!isCompleted && !isLocked && (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-4 font-black text-white text-[10px] px-1.5 py-0.5 bg-black/40 rounded">
                  {lesson.index + 1}
                </span>
              )}
              {hasNotes && !isLocked && <span className="absolute -top-2 -right-2 text-xl animate-bounce">📝</span>}
            </button>
          </div>
        );
      })}

      {/* Hero Character */}
      <div
        id="hero-sprite"
        className="absolute w-24 h-24 z-40 transition-transform duration-75 ease-linear flex flex-col items-center"
        style={{
          left: `${heroPos.x}%`,
          top: `${heroPos.y}px`,
          transform: `translate(-50%, -80%) ${direction === 'left' ? 'scaleX(-1)' : ''}`,
          pointerEvents: 'none',
          imageRendering: 'pixelated'
        }}
      >
        {/* Interaction Prompt Bubble - RESTORED */}
        {entities.some(e => {
          // Simple visual proximity check for UI only (approx 80px)
          // We need containerWidth approximation or simple % distance check
          // Let's use simple % distance for UI prompt to be fast
          // 80px is roughly 10-15% of width? No, variable.
          // Let's assume container is ~800px. 80px = 10%.
          // Y distance is pixels. 80px.
          const distY = Math.abs(e.yPx - heroPos.y);
          const distX = Math.abs(e.xPercent - heroPos.x);
          return distY < 80 && distX < 10 && e.type !== 'decor'; // Only chest/lesson
        }) && (
            <div className={`absolute -top-10 bg-white border-2 border-black px-2 py-1 rounded text-[10px] font-bold animate-bounce ${direction === 'left' ? 'scaleX(-1)' : ''}`}>
              ESPACE
            </div>
          )}

        <img
          src={getHeroSprite()}
          className={`w-full h-full object-contain ${!isMoving ? 'animate-bounce-slight' : ''} ${frame === 1 ? 'mt-1' : ''}`}
          style={{ filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.3))' }}
        />

        {/* Hero Speech Bubble (Barks) */}
        {heroMessage && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 bg-white border-2 border-black rounded-xl p-2 z-50 animate-in zoom-in-50 duration-200 shadow-xl">
            <p className="text-[10px] text-center font-bold text-black leading-tight">
              {heroMessage}
            </p>
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-black rotate-45 transform"></div>
          </div>
        )}
      </div>

      {/* NEW RPG DIALOGUE UI */}
      {dialogue && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#E8C586] border-4 border-[#8B4513] p-1 rounded-lg shadow-2xl">
            <div className="bg-[#F9F7F2] border-2 border-[#5A3008] p-4 rounded flex items-start gap-4">
              {/* Character/Icon Portrait */}
              {dialogue.image && (
                <div className="w-16 h-16 bg-gray-200 border-2 border-[#8B4513] shrink-0 flex items-center justify-center p-1 rounded">
                  <img src={dialogue.image} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} />
                </div>
              )}

              <div className="flex-1">
                <h3 className="font-bold text-[#8B4513] uppercase tracking-widest text-sm mb-1">{dialogue.title}</h3>
                <p className="text-[#3A3A3A] font-serif text-lg leading-snug">{dialogue.text}</p>
                {dialogue.isReward && (
                  <p className="text-green-600 font-bold mt-2 animate-pulse">✨ Reward Obtained!</p>
                )}
              </div>

              <button
                onClick={() => setDialogue(null)}
                className="self-end text-[10px] text-[#8B4513] opacity-60 hover:opacity-100 font-bold uppercase animate-pulse"
              >
                ▼ Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Modal Overlay */}
      {showStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#E8C586] border-4 border-[#8B4513] p-1 rounded-lg shadow-2xl max-w-md w-full relative transform scale-100 animate-in zoom-in-95 duration-200">
            {/* Retro Border Inner */}
            <div className="border-2 border-[#5A3008] p-6 rounded bg-[#F9F7F2]">
              <button
                onClick={() => setShowStory(null)}
                className="absolute top-4 right-4 text-[#8B4513] hover:text-red-600 font-bold text-xl"
              >
                X
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 mb-4 bg-gray-100 rounded-full flex items-center justify-center border-4 border-[#dd8b8b]">
                  <img src={showStory.image} alt="" className="w-16 h-16 object-contain pixelated" style={{ imageRendering: 'pixelated' }} />
                </div>
                <h3 className="text-xl font-black text-[#5A6B70] uppercase tracking-widest mb-3 font-mono">{showStory.title}</h3>
                <p className="text-[#8B4513] font-serif leading-relaxed text-lg mb-6">{showStory.text}</p>
                <button
                  onClick={() => setShowStory(null)}
                  className="bg-[#dd8b8b] text-white px-8 py-3 rounded font-bold uppercase tracking-wider hover:bg-[#c97a7a] transition-colors border-b-4 border-[#a66363] active:border-b-0 active:translate-y-1"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Content remains the same, but we use ReactMarkdown instead of custom renderer

const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onBack, initialLessonId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'vocab' | 'assignments' | 'resources' | 'announcements' | 'tutor' | 'live' | 'discussions'>('content');
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [favoriteLessons, setFavoriteLessons] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'path'>('grid');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // --- Gamification: Streak Logic ---
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('lastStudyDate');
    const storedStreak = parseInt(localStorage.getItem('streakDays') || '0', 10);

    if (storedDate === today) {
      setStreakDays(storedStreak);
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (storedDate === yesterday.toDateString()) {
        setStreakDays(storedStreak);
      } else {
        setStreakDays(storedStreak > 0 ? 0 : 0); // Reset if not yesterday
        localStorage.setItem('streakDays', '0');
      }
    }
  }, []);

  const recordStudyActivity = () => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('lastStudyDate');
    if (storedDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      let newStreak = 1;
      if (storedDate === yesterday.toDateString()) {
        newStreak = (parseInt(localStorage.getItem('streakDays') || '0', 10)) + 1;
      }
      localStorage.setItem('lastStudyDate', today);
      localStorage.setItem('streakDays', String(newStreak));
      localStorage.setItem('streakDays', String(newStreak));
      setStreakDays(newStreak);

      // Notify on significant streaks
      if ([3, 7, 14, 30, 50, 100].includes(newStreak) && user) {
        sendNotification(user.uid, {
          title: '🔥 Streak Achievement!',
          message: `You are on fire! You reached a ${newStreak} day streak. Keep it up!`,
          type: 'success'
        });
      }
    }
  };

  useEffect(() => {
    const loadProgress = async () => {
      // Charger depuis localStorage pour compatibilité
      const saved = localStorage.getItem(`progress_${course.id}`);
      if (saved) {
        setCompletedLessons(new Set(JSON.parse(saved)));
      }

      /* Firestore sync disabled for local-only mode
      // Charger depuis Firestore si utilisateur connecté
      if (user) {
        try {
          const progressRef = doc(db, 'userProgress', user.uid);
          const progressSnap = await getDoc(progressRef);
          
          if (progressSnap.exists()) {
            const userProgress = progressSnap.data();
            const courseCompleted = course.sections.flatMap(s => 
              s.lessons.map(l => {
                const lessonKey = `${course.id}_${l.id}`;
                return userProgress.completedLessons?.includes(lessonKey) ? l.id : null;
              }).filter(Boolean)
            );
            if (courseCompleted.length > 0) {
              setCompletedLessons(new Set(courseCompleted));
            }
          }
        } catch (error) {
          console.error("Error loading progress:", error);
        }
      }
      */

      // Si un lessonId initial est fourni, trouver et ouvrir cette leçon
      if (initialLessonId) {
        for (const section of course.sections) {
          const lesson = section.lessons.find(l => l.id === initialLessonId);
          if (lesson) {
            setActiveLesson(lesson);
            return;
          }
        }
      }

      // Load favorites
      const savedFavorites = localStorage.getItem(`favorites_${course.id}`);
      if (savedFavorites) {
        setFavoriteLessons(new Set(JSON.parse(savedFavorites)));
      }

      // Ne pas auto-sélectionner de leçon - laisser l'utilisateur choisir depuis les cartes
      setActiveLesson(null);
    };

    loadProgress();
  }, [course, user, initialLessonId]);

  const toggleLessonComplete = async (lessonId: string) => {
    const next = new Set(completedLessons);
    const isCompleting = !next.has(lessonId);

    if (isCompleting) {
      next.add(lessonId);
      recordStudyActivity(); // Trigger streak update

      // Notify completion
      if (user) {
        // Find lesson title for better message
        let lessonTitle = "Lesson";
        course.sections.forEach(s => {
          const found = s.lessons.find(l => l.id === lessonId);
          if (found) lessonTitle = found.title;
        });

        sendNotification(user.uid, {
          title: 'Lesson Completed',
          message: `Great job completing "${lessonTitle}"!`,
          type: 'success'
        });
      }
    } else {
      next.delete(lessonId);
    }

    setCompletedLessons(next);

    // Sauvegarder dans localStorage pour compatibilité
    localStorage.setItem(`progress_${course.id}`, JSON.stringify(Array.from(next)));

    /* Firestore sync disabled for local-only mode
    // Sauvegarder dans Firestore si utilisateur connecté
    if (user) {
      try {
        const progressRef = doc(db, 'userProgress', user.uid);
        // ... (Firestore update logic commented out)
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
    */
  };

  const toggleFavorite = (lessonId: string) => {
    const next = new Set(favoriteLessons);
    if (next.has(lessonId)) {
      next.delete(lessonId);
    } else {
      next.add(lessonId);
    }
    setFavoriteLessons(next);
    localStorage.setItem(`favorites_${course.id}`, JSON.stringify(Array.from(next)));
  };

  const handleAiAsk = async () => {
    if (!userQuery.trim() || !activeLesson) return;
    const query = userQuery;
    setUserQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setIsAiLoading(true);
    try {
      const response = await getTutorHelp(activeLesson.content, query);
      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Désolé, I'm having trouble connecting to Sophie." }]);
    } finally { setIsAiLoading(false); }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const totalLessonsCount = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const currentProgress = (completedLessons.size / totalLessonsCount) * 100;
  const isCourseComplete = completedLessons.size === totalLessonsCount;

  // --- Gamification: Remaining Time Calculation ---
  const remainingTimeMinutes = course.sections.flatMap(s => s.lessons)
    .filter(l => !completedLessons.has(l.id))
    .reduce((acc, l) => {
      const match = l.duration?.match(/(\d+):(\d+)/);
      if (match) return acc + parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      return acc;
    }, 0);
  const remainingHours = Math.floor(remainingTimeMinutes / 60);
  const remainingMins = remainingTimeMinutes % 60;
  const remainingTimeStr = remainingHours > 0
    ? `Il vous reste environ ${remainingHours}h${remainingMins > 0 ? remainingMins : ''} pour finir ce niveau.`
    : `Il vous reste environ ${remainingMins} min pour finir ce niveau.`;


  // Helper to render a lesson card
  const renderLessonCard = (lesson: any, globalIndex: number) => {
    const isCompleted = completedLessons.has(lesson.id);
    const isFavorite = favoriteLessons.has(lesson.id);
    const isRevision = lesson.title.toLowerCase().includes('révision') || lesson.title.toLowerCase().includes('evaluation') || lesson.title.toLowerCase().includes('consolidation');
    const displayTitle = lesson.title.replace(/\s*\(Consolidation\)\s*/i, '');
    const hasNotes = localStorage.getItem(`notes_${course.id}_${lesson.id}`) !== null;

    if (viewMode === 'list') {
      return (
        <div key={lesson.id} onClick={() => setActiveLesson(lesson)} className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 cursor-pointer flex items-center justify-between group ${isCompleted ? 'border-green-400/30' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${isCompleted ? 'bg-green-500/10 text-green-600' : 'bg-[#F9F7F2] text-[#dd8b8b]'}`}>{globalIndex}</div>
            <h3 className={`font-bold text-sm text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors line-clamp-1 flex-1 ${isCompleted ? 'line-through opacity-50' : ''}`}>{displayTitle}</h3>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold text-gray-400 hidden sm:inline-block">{lesson.duration}</span>
            {hasNotes && <span className="text-amber-500 text-sm" title="Notes">📝</span>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(lesson.id);
              }}
              className={`p-1 transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLessonComplete(lesson.id);
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'text-green-500 bg-green-50' : 'text-gray-300 bg-gray-50 hover:text-green-500 hover:bg-green-50'}`}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Grid View (Default)
    return (
      <div key={lesson.id} onClick={() => setActiveLesson(lesson)} className={`bg-white rounded-[32px] p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden ${isCompleted ? 'border-green-400/30' : isRevision ? 'border-[#E8C586]/50 bg-[#E8C586]/5' : 'border-[#dd8b8b]/10'}`}>
        {isCompleted ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLessonComplete(lesson.id);
            }}
            className="absolute top-4 right-4 z-10 hover:scale-110 transition-transform"
          >
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md">
              <CheckCircle className="w-5 h-5" />
            </div>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLessonComplete(lesson.id);
            }}
            className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          >
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#dd8b8b]/30 flex items-center justify-center text-[#dd8b8b]/30 hover:border-[#dd8b8b] hover:text-[#dd8b8b] shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
          </button>
        )}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all ${isCompleted ? 'bg-green-500/10 text-green-600' : isRevision ? 'bg-[#E8C586] text-white shadow-md group-hover:scale-110' : 'bg-[#F9F7F2] text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white'}`}>{globalIndex}</div>
          <div className="flex-1 min-w-0">
            {/* Type badge removed as requested */}
            <h3 className="font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors line-clamp-2 mt-2">{displayTitle}</h3>
          </div>
        </div>
        <div className={`flex items-center justify-between pt-4 border-t ${isRevision ? 'border-[#E8C586]/20' : 'border-[#dd8b8b]/10'}`}>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
            <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {lesson.duration}</span>
            {hasNotes && <span className="text-amber-500 text-base" title="Notes">📝</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(lesson.id);
              }}
              className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-[#5A6B70]/20 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </button>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'border-green-400 text-green-500' : isRevision ? 'border-[#E8C586] text-[#E8C586] bg-white group-hover:bg-[#E8C586] group-hover:text-white' : 'border-[#dd8b8b]/20 text-[#dd8b8b] group-hover:border-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white'}`}><ChevronLeft className="w-4 h-4 rotate-180" /></div>
          </div>
        </div>

        {/* Hover Overlay with Objectives */}
        {lesson.objectives && lesson.objectives.length > 0 && (
          <div className="absolute inset-0 bg-white/95 p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h4 className="text-[#dd8b8b] font-bold text-sm uppercase tracking-widest mb-3">Dans cette leçon</h4>
            <ul className="space-y-2">
              {lesson.objectives.slice(0, 3).map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#5A6B70]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E8C586] shrink-0" />
                  <span className="leading-tight">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Lesson Selection View (Early Return)
  if (!activeLesson) {
    return (
      <div className="flex h-[calc(100vh-96px)] overflow-hidden bg-[#F9F7F2]">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center text-[#dd8b8b] font-bold mb-8 hover:opacity-80 transition-opacity">
              <ChevronLeft className="w-5 h-5 mr-2" /> Retour au catalogue
            </button>
            <div className="text-center mb-12">
              {/* Streak & Remaining Time Banner */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <div className="flex items-center gap-2 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-full text-sm font-bold">
                  <span className="text-lg">🔥</span>
                  <span>{streakDays} jour{streakDays !== 1 ? 's' : ''}</span>
                </div>
                {!isCourseComplete && (
                  <div className="flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full text-sm font-bold">
                    <span className="text-lg">⏱️</span>
                    <span>{remainingTimeStr}</span>
                  </div>
                )}
              </div>
              <div className="inline-block px-4 py-1 bg-[#F9F7F2] rounded-full text-[#dd8b8b] text-xs font-black uppercase tracking-widest mb-4">{course.level}</div>
              <h1 className="text-4xl md:text-5xl font-black text-[#5A6B70] serif-display italic mb-4">{course.title}</h1>
              <p className="text-[#5A6B70]/60 text-lg max-w-2xl mx-auto">Choisissez une leçon pour commencer</p>
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex justify-between text-xs font-bold text-[#5A6B70]/40 mb-2">
                  <span>{completedLessons.size} / {totalLessonsCount} leçons</span>
                  <span>{Math.round(currentProgress)}%</span>
                </div>
                <div className="h-2 bg-[#F9F7F2] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#dd8b8b] to-[#E8C586] rounded-full transition-all duration-500" style={{ width: `${currentProgress}%` }} />
                </div>
                {!isCourseComplete && (
                  <button
                    onClick={() => {
                      // Find first incomplete lesson
                      const firstIncomplete = course.sections
                        .flatMap(s => s.lessons)
                        .find(l => !completedLessons.has(l.id));

                      if (firstIncomplete) setActiveLesson(firstIncomplete);
                    }}
                    className="mt-6 w-full py-3 bg-[#5A6B70] text-white rounded-xl font-bold hover:bg-[#5A6B70]/90 transition-colors flex items-center justify-center gap-2 shadow-lg hover:translate-y-px"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Reprendre le cours
                  </button>
                )}
                <div className="flex justify-center mt-6 gap-2">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#5A6B70] text-white shadow-md' : 'bg-white text-[#5A6B70]/40 hover:bg-gray-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#5A6B70] text-white shadow-md' : 'bg-white text-[#5A6B70]/40 hover:bg-gray-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 6.75a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0ZM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12Zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button onClick={() => setViewMode('path')} className={`p-2 rounded-lg transition-colors ${viewMode === 'path' ? 'bg-[#5A6B70] text-white shadow-md' : 'bg-white text-[#5A6B70]/40 hover:bg-gray-50'}`}>
                    <BrainCircuit className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            {viewMode === 'path' ? (
              <PathView
                lessons={course.sections.flatMap(s => s.lessons)}
                completedLessons={completedLessons}
                activeLesson={activeLesson}
                setActiveLesson={setActiveLesson}
                toggleFavorite={toggleFavorite}
                favoriteLessons={favoriteLessons}
                courseId={course.id}
                courseTitle={course.title}
              />
            ) : ['b1-1', 'b1-2', 'a2-1', 'a2-2', 'a1-1', 'a1-2'].includes(course.id) ? (
              <div className="space-y-16">
                {course.sections.map((section, sectionIdx) => {
                  const isModuleComplete = section.lessons.every(l => completedLessons.has(l.id));
                  return (
                    <div key={section.id} className={`relative rounded-3xl p-6 transition-all duration-500 ${isModuleComplete ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-amber-300 shadow-lg shadow-amber-100' : ''}`}>
                      {isModuleComplete && (
                        <div className="absolute -top-4 -right-4 text-5xl" style={{ filter: 'drop-shadow(0 0 12px gold)' }}>🏅</div>
                      )}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="h-px flex-1 bg-[#dd8b8b]/20"></div>
                        <div className="flex flex-col items-center gap-2">
                          <h3 className="text-2xl font-black text-[#5A6B70] serif-display italic px-6 py-2 border-2 border-[#dd8b8b]/10 rounded-full bg-white shadow-sm flex items-center gap-3">
                            {section.title}
                            {/* Module Badge */}
                            {section.lessons.every(l => completedLessons.has(l.id)) && (
                              <span title="Module terminé !" className="ml-2 text-3xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px gold)' }}>🏅</span>
                            )}
                          </h3>
                          {/* Module Progress Bar */}
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#5A6B70]/60 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-[#dd8b8b]/5">
                            <span>{section.lessons.filter(l => completedLessons.has(l.id)).length}/{section.lessons.length}</span>
                            <div className="w-16 h-1.5 bg-[#dd8b8b]/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#dd8b8b] rounded-full transition-all duration-500"
                                style={{ width: `${(section.lessons.filter(l => completedLessons.has(l.id)).length / section.lessons.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="h-px flex-1 bg-[#dd8b8b]/20"></div>
                      </div>
                      <div className={viewMode === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                        {section.lessons.map((lesson, lessonIdx) => {
                          const globalIndex = course.sections.slice(0, sectionIdx).reduce((acc, s) => acc + s.lessons.length, 0) + lessonIdx + 1;
                          return renderLessonCard(lesson, globalIndex);
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={viewMode === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                {course.sections.flatMap((section, sectionIdx) =>
                  section.lessons.map((lesson, lessonIdx) => {
                    const globalIndex = course.sections.slice(0, sectionIdx).reduce((acc, s) => acc + s.lessons.length, 0) + lessonIdx + 1;
                    return renderLessonCard(lesson, globalIndex);
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-96px)] overflow-hidden bg-[#F9F7F2]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Lesson Selection View - Show cards when no lesson is selected */}

        {/* Video Player Section */}
        {activeLesson?.videoUrl ? (
          <div className="bg-black aspect-video w-full relative group">
            {activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') ? (
              <iframe
                key={activeLesson.id}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeLesson.videoUrl.includes('v=') ? activeLesson.videoUrl.split('v=')[1].split('&')[0] : activeLesson.videoUrl.split('/').pop()}`}
                title={activeLesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video
                key={activeLesson.id}
                className="w-full h-full"
                controls
                poster="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200"
              >
                <source src={activeLesson.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="absolute right-6 top-6 z-20 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 border border-white/10 shadow-xl transition-all">
                <PanelRightOpen className="w-6 h-6" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#5A6B70] aspect-[21/9] w-full flex items-center justify-center relative shadow-inner overflow-hidden max-h-[350px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C87A7A]/20 to-[#5A6B70]/90" />
            <div className="text-white flex flex-col items-center gap-4 relative z-10 text-center px-4">
              <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 text-xs font-black uppercase tracking-[0.3em]">
                {course.title}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold serif-display italic">{activeLesson?.title}</h1>
            </div>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="absolute right-6 top-6 z-20 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 border border-white/10 shadow-xl transition-all">
                <PanelRightOpen className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
          {/* Lesson Actions & Audio Player */}
          <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[40px] border border-[#C87A7A]/10 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">{activeLesson?.title}</h2>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#5A6B70]/40">
                <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {activeLesson?.duration}</span>
                <span className="w-1 h-1 rounded-full bg-[#5A6B70]/20" />
                <span>Level: {course.level}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {activeLesson?.audioUrl && (
                <div className="flex items-center gap-3 bg-[#F9F7F2] p-2 pr-4 rounded-2xl border border-[#C87A7A]/5">
                  <button
                    onClick={toggleAudio}
                    className="w-10 h-10 bg-[#C87A7A] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                    {isAudioPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#C87A7A]">Audio Version</span>
                    <span className="text-[10px] font-bold text-[#5A6B70]">Listen to Lesson</span>
                  </div>
                  <audio ref={audioRef} src={activeLesson.audioUrl} onEnded={() => setIsAudioPlaying(false)} className="hidden" />
                </div>
              )}
              {/* Notes Button removed from here */}
              <button
                onClick={() => activeLesson && toggleLessonComplete(activeLesson.id)}
                className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 ${completedLessons.has(activeLesson?.id || '') ? 'bg-green-500 text-white' : 'bg-[#C87A7A] text-white hover:scale-105'}`}
              >
                {completedLessons.has(activeLesson?.id || '') ? 'Completed' : 'Mark Complete'} <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-b border-[#C87A7A]/10 mb-10 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'content', label: 'Description', icon: FileText },
              { id: 'vocab', label: 'Vocabulary', icon: Dumbbell },
              { id: 'resources', label: 'Resources', icon: Book },
              { id: 'assignments', label: 'Assignment', icon: ClipboardList },
              { id: 'tutor', label: 'Tutor Chat', icon: BrainCircuit },
              { id: 'live', label: 'Live Tutor', icon: Headphones },
              { id: 'discussions', label: 'Forum', icon: MessageCircle },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] sans-geometric transition-all relative flex-shrink-0 flex items-center gap-2 ${activeTab === tab.id ? 'text-[#C87A7A]' : 'text-[#5A6B70]/40 hover:text-[#5A6B70]'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#C87A7A] rounded-full" />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'content' && (
              <div className="space-y-12">
                <div className="bg-white p-10 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
                  <StyledMarkdown content={activeLesson?.content || ""} id={activeLesson?.id} />
                </div>

                {activeLesson?.transcript && (
                  <div className="bg-[#E8C586]/5 p-10 rounded-[40px] border border-[#E8C586]/20">
                    <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic mb-6">Video Transcript</h3>
                    <p className="text-[#5A6B70]/80 leading-relaxed font-medium">{activeLesson.transcript}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic mb-6">Course Material</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.resources.map(res => (
                    <div key={res.id} className="bg-white p-6 rounded-[24px] border border-[#C87A7A]/10 flex items-center justify-between group hover:border-[#E8C586] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-2xl flex items-center justify-center text-[#C87A7A]">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-[#5A6B70]">{res.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">{res.type}</p>
                        </div>
                      </div>
                      <a
                        href={res.url && res.url !== '#' ? res.url : '#'}
                        onClick={(e) => {
                          if (!res.url || res.url === '#') {
                            e.preventDefault();
                            generatePDF(res.name, `Resource download for: ${res.name}\n\nLevel: ${course.level}\nTopic: ${course.title}`);
                          } else {
                            // Forcer le téléchargement pour les PDFs
                            if (res.type === 'pdf' && res.url) {
                              e.preventDefault();
                              const link = document.createElement('a');
                              link.href = res.url;
                              link.download = res.name.endsWith('.pdf') ? res.name : `${res.name}.pdf`;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }
                        }}
                        target={res.url && res.url !== '#' ? '_blank' : undefined}
                        rel={res.url && res.url !== '#' ? 'noopener noreferrer' : undefined}
                        className="p-3 bg-[#C87A7A] text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 inline-block"
                        title={res.url && res.url !== '#' ? 'Télécharger le fichier' : 'Générer un PDF'}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'vocab' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[40px] border border-[#C87A7A]/10 shadow-sm">
                  <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic mb-8">Vocabulary List</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {activeLesson?.vocabulary.map(item => (
                      <div key={item.id} className="flex flex-col gap-1 p-4 bg-[#F9F7F2] rounded-2xl border border-[#C87A7A]/5">
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-bold text-[#C87A7A]">{item.french}</span>
                          <span className="text-[10px] font-mono text-[#5A6B70]/50">{item.pronunciation}</span>
                        </div>
                        <span className="text-sm font-medium text-[#5A6B70]/70 italic">{item.translation}</span>
                        {item.example && <p className="text-[10px] text-[#5A6B70]/40 mt-1">"{item.example}"</p>}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#C87A7A]/10 pt-12">
                    <VocabTrainer vocab={activeLesson?.vocabulary || []} />
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs remain similar but styled with new palette */}
            {activeTab === 'assignments' && (
              <div className="bg-white p-10 rounded-[40px] border border-[#C87A7A]/10 shadow-sm text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-[#E8C586] mb-4" />
                <h3 className="text-2xl font-bold serif-display italic text-[#5A6B70] mb-2">Lesson Assignment</h3>
                <p className="text-[#5A6B70]/60 mb-8 max-w-lg mx-auto">Upload a 1-minute audio recording or a short paragraph applying what you learned today.</p>
                <label className="border-2 border-dashed border-[#C87A7A]/20 rounded-3xl p-12 bg-[#F9F7F2]/50 hover:bg-[#F9F7F2] transition-all cursor-pointer group block">
                  <input type="file" className="hidden" onChange={() => alert("File uploaded successfully for review!")} />
                  <Upload className="w-10 h-10 mx-auto text-[#C87A7A] mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black uppercase tracking-widest text-[#5A6B70]/40">Click to upload your work</p>
                </label>
              </div>
            )}

            {activeTab === 'tutor' && (
              <div className="bg-white rounded-[40px] border border-[#C87A7A]/10 shadow-xl p-10">
                <div className="space-y-6 mb-10 max-h-[450px] overflow-y-auto px-4 custom-scrollbar">
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[24px] px-6 py-4 ${chat.role === 'user' ? 'bg-[#C87A7A] text-white rounded-tr-none' : 'bg-[#F9F7F2] text-[#5A6B70] rounded-tl-none'}`}>
                        <p className="text-sm font-bold">{chat.text}</p>
                      </div>
                    </div>
                  ))}
                  {isAiLoading && <div className="animate-pulse flex gap-2"><div className="w-2 h-2 bg-[#C87A7A] rounded-full"></div><div className="w-2 h-2 bg-[#C87A7A] rounded-full"></div></div>}
                </div>
                <div className="relative">
                  <input type="text" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()} placeholder="Ask Sophie for help..." className="w-full bg-[#F9F7F2] rounded-[24px] py-4 pl-6 pr-16 focus:outline-none font-bold text-[#5A6B70]" />
                  <button onClick={handleAiAsk} className="absolute right-2 top-2 p-2.5 bg-[#C87A7A] text-white rounded-[18px] hover:scale-105 transition-all shadow-lg"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            )}

            {activeTab === 'live' && (
              <LiveTutor level={course.level} topic={activeLesson?.title || ""} context={activeLesson?.content || ""} />
            )}

            {activeTab === 'discussions' && (
              <LessonComments comments={activeLesson?.comments || []} onAddComment={(text) => {
                if (user) {
                  sendNotification(user.uid, {
                    title: 'Discussion Update',
                    message: 'Your comment has been posted to the discussion thread. You will be notified of replies.',
                    type: 'info'
                  });
                }
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Sidebar */}
      <div className={`bg-white border-l border-[#C87A7A]/10 transition-all duration-500 flex flex-col ${isSidebarOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}`}>
        <div className="p-8 border-b border-[#C87A7A]/10 flex justify-between items-center bg-[#F9F7F2]/30">
          <h2 className="text-2xl font-bold text-[#5A6B70] serif-display italic">Course Content</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-[#5A6B70]/40 hover:text-[#C87A7A] transition-all"><PanelRightClose className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {course.sections.map((section) => (
            <div key={section.id} className="mb-4">
              <div className="bg-[#F9F7F2]/80 px-8 py-4 border-y border-[#C87A7A]/5">
                <h3 className="font-black text-[9px] uppercase tracking-widest text-[#5A6B70]/60">{section.title}</h3>
              </div>
              <div className="px-4 py-3 space-y-2">
                {section.lessons.map((lesson) => (
                  <div key={lesson.id} className="mb-2">
                    <button
                      onClick={() => { setActiveLesson(lesson); setActiveTab('content'); }}
                      className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${activeLesson?.id === lesson.id ? 'bg-[#F9F7F2] border-[#C87A7A]/20 shadow-md border' : 'hover:bg-[#F9F7F2]/50'}`}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLessonComplete(lesson.id);
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 cursor-pointer hover:scale-110 transition-transform relative z-10 ${completedLessons.has(lesson.id) ? 'bg-green-500 border-green-500' : 'border-[#C87A7A]/20 hover:border-[#C87A7A]'}`}
                      >
                        {completedLessons.has(lesson.id) ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-1.5 h-1.5 bg-[#C87A7A]/20 rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold truncate ${activeLesson?.id === lesson.id ? 'text-[#C87A7A]' : 'text-[#5A6B70]'}`}>{lesson.title}</div>
                        <div className="text-[8px] text-[#5A6B70]/40 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                          {lesson.type === 'video' ? <Play className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                          {lesson.duration}
                        </div>
                      </div>
                    </button>

                    {/* Render TOC for active lesson - OUTSIDE the button */}
                    {activeLesson?.id === lesson.id && lesson.content && (
                      <div className="mt-2 ml-4 pl-6 border-l-2 border-[#C87A7A]/10 space-y-1 animate-in slide-in-from-left-2 duration-300">
                        {extractTOC(lesson.content).map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const element = document.getElementById(item.id);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className={`block py-1 text-[11px] font-medium leading-tight transition-colors hover:text-[#dd8b8b] hover:translate-x-1 duration-200 ${item.level === 3 ? 'pl-3 text-[#5A6B70]/50' : 'text-[#5A6B70]/70'}`}
                          >
                            {item.text}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Certificate Sidebar Panel */}
        <div className="p-6 bg-[#F9F7F2]/50 border-t border-[#C87A7A]/10">
          <div className={`p-6 rounded-[24px] border flex flex-col gap-4 transition-all ${isCourseComplete ? 'bg-[#E8C586] border-[#E8C586] text-[#5A6B70]' : 'bg-white border-[#C87A7A]/10 text-[#5A6B70]/40'}`}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Milestone Progress</p>
              <div className="h-1.5 bg-[#5A6B70]/10 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#C87A7A] transition-all" style={{ width: `${currentProgress}%` }} />
              </div>
              <h4 className="text-md font-bold serif-display italic">{isCourseComplete ? 'Claim Certificate!' : `Complete ${totalLessonsCount - completedLessons.size} more`}</h4>
            </div>
            <button
              onClick={() => isCourseComplete && generateCertificate(currentUser.name, course.title)}
              disabled={!isCourseComplete}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest ${isCourseComplete ? 'bg-white text-[#C87A7A] shadow-md hover:scale-105' : 'bg-transparent border border-current opacity-30 cursor-not-allowed'}`}
            >
              <Award className="w-4 h-4" /> Download Award
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Notes */}
      {activeLesson && (
        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={`fixed bottom-8 right-8 z-40 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-2 ${isNotesOpen ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 border-2 border-amber-100'}`}
          title="Ouvrir mes notes"
        >
          <span className="text-2xl">📝</span>
          <span className="font-bold hidden md:inline">Notes</span>
        </button>
      )}

      {/* Floating Notes Component */}
      {activeLesson && (
        <FloatingNotes
          courseId={course.id}
          lessonId={activeLesson.id}
          courseTitle={course.title}
          lessonTitle={activeLesson.title}
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
        />
      )}
    </div>
  );
};

export default CoursePlayer;

