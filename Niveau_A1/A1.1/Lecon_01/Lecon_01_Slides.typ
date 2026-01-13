#import "/typst_build/resources/templates/pastel_carousel.typ": *

// --- SLIDE 1: COVER ---
#cover-slide(
  title: "Leçon 01\nSe présenter",
  subtitle: "Niveau A1.1 - French Mastery",
  image-path: none 
)

// --- SLIDE 2: OBSERVATION 1 ---
#content-slide(
  header: "Observation 1",
  subheader: "Greetings (Les Salutations)"
)[
    #align(center)[
      #text(size: 60pt, weight: "bold", fill: dusty-pink)[Bonjour]
      #v(0.2cm)
      #text(size: 28pt, style: "italic")[Hello / Good morning]
      
      #v(1cm)
      
      #text(size: 60pt, weight: "bold", fill: primary-dark)[Bonsoir]
      #v(0.2cm)
      #text(size: 28pt, style: "italic")[Good evening (After 6 PM)]
    ]
]

// --- SLIDE 3: OBSERVATION 2 ---
#content-slide(
  header: "Observation 2",
  subheader: "Saying your name (Je suis...)"
)[
    #align(center)[
      #block(fill: white, inset: 1em, radius: radius-s, stroke: 1pt + dusty-pink)[
        #text(size: 48pt, weight: "bold")[Je suis + Name]
      ]
      
      #v(1cm)
      
      Examples:
      #v(0.5cm)
      "Je suis *Tom*." \
      "Je suis *Sophie*."
    ]
]

// --- SLIDE 4: OBSERVATION 3 ---
#content-slide(
  header: "Observation 3",
  subheader: "Nationality (Masculin vs Féminin)"
)[
    #grid(
      columns: (1fr, 1fr),
      gutter: 0.5cm,
      [
        *Masculin*
        #v(0.2cm)
        - Je suis américain
        - Je suis français
        - Je suis belge
      ],
      [
        *Féminin* (add -e)
        #v(0.2cm)
        - Je suis américain#strong[e]
        - Je suis français#strong[e]
        - Je suis belge
      ]
    )
    #v(0.5cm)
    #tip-box[
      Listen for the sound change! \
      Américain $\to$ Américai#strong[ne]
    ]
]

// --- SLIDE 5: OBSERVATION 4 ---
#content-slide(
  header: "Observation 4",
  subheader: "Where you live (J'habite à...)"
)[
    #align(center)[
      #text(size: 48pt, weight: "bold", fill: dusty-pink)[J'habite à + City]
      
      #v(1cm)
      Don't forget the *à* !
      #v(0.5cm)
      
      #pill-box[J'habite *à* Bruxelles]
      #v(0.2cm)
      #pill-box[J'habite *à* Paris]
    ]
]

// --- SLIDE 6: OBSERVATION 5 ---
#content-slide(
  header: "Observation 5",
  subheader: "Enchanté(e)"
)[
    #align(center)[
      #v(1cm)
      #text(size: 48pt, weight: "bold", fill: primary-dark)[Enchanté !]
      #v(0.5cm)
      (Nice to meet you)
      
      #v(1.5cm)
      
      *Writing tip:*
      #v(0.5cm)
      Men $\to$ Enchanté \
      Women $\to$ Enchanté#strong[e]
    ]
]

// --- SLIDE 7: CULTURE ---
#content-slide(
  header: "Culture: Belgium 🇧🇪",
  subheader: "The Golden Rule"
)[
    In Belgium, saying *"Bonjour"* is absolutely mandatory!
    #v(0.5cm)
    #tip-box[
      Start every interaction with "Bonjour". \
      Not saying it is considered *rude*.
    ]
    #v(0.5cm)
    #align(center)[
      #grid(
        columns: (1fr, 1fr),
        gutter: 1cm,
        [Shop $\to$ "Bonjour"],
        [Elevator $\to$ "Bonjour"]
      )
    ]
]

// --- SLIDE 8: GRAMMAR ---
#content-slide(
  header: "Grammar: ÊTRE",
  subheader: "To Be (The most important verb)"
)[
    #align(center)[
      #grid(
        columns: (1fr, 1fr),
        gutter: 1cm,
        [
          *Je suis* \
          (I am)
          #v(0.5cm)
          *Tu es* \
          (You are - informal)
          #v(0.5cm)
          *Il / Elle est* \
          (He / She is)
        ],
        [
          *Nous sommes* \
          (We are)
          #v(0.5cm)
          *Vous êtes* \
          (You are - formal)
          #v(0.5cm)
          *Ils / Elles sont* \
          (They are)
        ]
      )
    ]
]

// --- SLIDE 9: COMMON MISTAKES ---
#content-slide(
  header: "Common Mistakes ⚠️",
  subheader: "Watch out for these!"
)[
    #align(left)[
      1. *The Silent Tourist* \
      $\to$ Always say "Bonjour"!
      #v(0.5cm)
      
      2. *"Je suis" vs "J'habite"* \
      $\to$ Je suis = I am (Identity) \
      $\to$ J'habite = I live (Location)
      #v(0.5cm)
      
      3. *Forgetting the "à"* \
      $\to$ J'habite *à* Bruxelles (Not "J'habite Bruxelles")
    ]
]

// --- SLIDE 10: CTA ---
#cta-slide(
  title: "À vous de jouer !",
  main-text: "Practice makes perfect",
  highlight: "Scroll down for exercises:\n1. Speaking 🗣️\n2. Writing ✍️\n3. Self-Evaluation ✅"
)
