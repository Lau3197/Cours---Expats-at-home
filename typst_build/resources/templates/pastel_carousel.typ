// Brussels Pastel Carousel - Design System for Typst

// --- 1. PALETTE ---
#let cream = rgb("#F9F7F2")
#let dusty-pink = rgb("#C87A7A")
#let mustard-gold = rgb("#E8C586")
#let primary-dark = rgb("#5A6B70")
#let contrast-white = rgb("#FFFFFF")

// --- 2. TYPOGRAPHY (Fallbacks used as custom fonts might not be installed) ---
// "Soft Serif" -> We'll use Georgia or Times, hoping for a softer feel, or stick to a clean Serif.
// "Rounded Sans" -> We'll use Arial Rounded or similar if available, else Arial/Calibri.
// "Geometric Sans" -> Arial or Roboto.

#let font-serif = ("Georgia", "Times New Roman", "serif")
#let font-handwritten = ("Arial Rounded MT Bold", "Comic Sans MS", "Calibri", "sans-serif")
#let font-geometric = ("Arial", "Roboto", "Helvetica", "sans-serif")

// --- 3. SHAPES ---
#let radius-s = 12pt
#let radius-l = 24pt
#let radius-pill = 999pt

// --- TEMPLATE DEFINITION ---

#let presentation(
  title: "",
  subtitle: "",
  footer-text: "ExpatsatHome.be",
  body
) = {
  set document(title: title)
  // PDF output settings for screen (16:9)
  set page(
    paper: "presentation-16-9",
    margin: 0cm,
    fill: cream 
  )
  
  // Base text settings
  set text(font: font-geometric, fill: primary-dark, size: 20pt)

  body
}

// --- SLIDE LAYOUTS ---

// 1. COVER SLIDE
#let cover-slide(title: "", subtitle: "", image-path: none) = {
  page(fill: dusty-pink)[
    #align(center + horizon)[
      // Title
      #text(font: font-serif, weight: "bold", fill: contrast-white, size: 48pt, style: "italic")[ #title ]
      #v(1cm)
      
      // Image Mask (Arch)
      #if image-path != none {
         box(
           radius: (top: 100pt, bottom: 0pt), 
           clip: true, 
           width: 30%, 
           height: 40%, 
           fill: white // Placeholder BG if image fails
         )[
           #image(image-path, fit: "cover", width: 100%, height: 100%)
         ]
      } else {
         // Fallback Arch
         box(
           radius: (top: 100pt, bottom: 0pt), 
           width: 30%, 
           height: 40%, 
           fill: white.lighten(20%)
         )[#align(center+horizon)[Image]]
      }
      
      #v(1cm)
      
      // Subtitle
      #text(font: font-geometric, weight: "bold", fill: contrast-white, size: 20pt)[#upper(subtitle)]
    ]
  ]
}

// 2. CONTENT SLIDE (The workhorse)
#let content-slide(header: "", subheader: "", body) = {
  page(fill: cream)[
    #align(center + horizon)[
      
      // Header with underline
      #block[
        #text(font: font-serif, weight: "bold", fill: mustard-gold, size: 36pt)[#header]
        #v(-0.2cm)
        #line(length: 60%, stroke: 4pt + dusty-pink)
      ]
      
      #v(0.5cm)
      
      // Subheader
      #if subheader != "" {
        text(font: font-handwritten, style: "italic", weight: "bold", fill: primary-dark, size: 28pt)[#subheader]
        v(0.5cm)
      }
      
      // Body Content
      #block(width: 80%)[
        #set text(font: font-geometric, weight: "regular", fill: primary-dark, size: 24pt) // Changed to regular for readability
        #set align(left)
        #body
      ]
      
      #v(1cm)
      
      // Visual Anchor (Simple Icon Line)
      #line(length: 2cm, stroke: 2pt + primary-dark)
    ]
  ]
}

// 3. CTA SLIDE / OUTRO
#let cta-slide(title: "", main-text: "", highlight: "") = {
  page(fill: mustard-gold)[
    #align(center + horizon)[
      #text(font: font-serif, weight: "bold", fill: contrast-white, style: "italic", size: 40pt)[#title]
      #v(1cm)
      
      #text(font: font-serif, fill: primary-dark, size: 32pt)[#main-text]
      #v(1cm)
      
      // Highlight Box
      #block(
        fill: dusty-pink, 
        inset: 24pt, 
        radius: radius-s,
        width: 60%
      )[
        #text(font: font-geometric, weight: "bold", fill: contrast-white, size: 24pt)[#highlight]
      ]
      
      #v(1.5cm)
      #text(size: 16pt, font: font-geometric, fill: primary-dark)[E X P A T S A T H O M E . B E]
    ]
  ]
}

// Helper components
#let tip-box(body) = {
   align(center)[
     #block(
      fill: dusty-pink,
      inset: 1.5em,
      radius: radius-s,
      width: 80%
    )[
      #text(font: font-geometric, weight: "bold", fill: contrast-white, size: 20pt)[#body]
    ]
   ]
}

#let pill-box(body) = {
  box(
    fill: cream,
    stroke: 2pt + primary-dark,
    inset: (x: 1em, y: 0.5em),
    radius: radius-pill
  )[#body]
}
