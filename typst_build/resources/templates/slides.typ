#import "brand.typ": *

// Main Slides Template
#let presentations(
  title: "",
  subtitle: "",
  body
) = {
  set document(title: title)
  set page(
    paper: "presentation-16-9",
    margin: (x: 2cm, y: 1.5cm),
    fill: white,
  )
  set text(font: "Arial", size: 24pt, fill: rgb("#333333"))

  // Title Slide
  page(margin: 0cm, header: none, footer: none)[
    #rect(width: 100%, height: 100%, fill: primary-dark)[
      #align(center + horizon)[
        // #image("../brand/logo.png", width: 4cm)
        #rect(width: 4cm, height: 4cm, fill: white)[*Logo*]
        #v(1em)
        #text(50pt, weight: "bold", fill: white, title)
        #v(0.5em)
        #text(30pt, fill: white.lighten(20%), subtitle)
      ]
    ]
  ]

  // Default Page Style for subsequent slides
  set page(
    header: align(right)[
      // #image("../brand/logo.png", width: 1.5cm)
      #rect(width: 1.5cm, height: 1.5cm, fill: primary-dark)[L]
    ],
    footer: context [
      #set text(12pt, fill: rgb("#999999"))
      #title | #subtitle
      #h(1fr)
      #counter(page).display()
    ]
  )

  body
}

// Helper for a standard content slide
#let slide(title: "", body) = {
  // We use a page break to start a new slide, unless it's the first one after title?
  // Actually, 'page' function creates a page.
  // But inside the 'body' of presentations, we just want flow or manual breaks.
  // The best way in Typst for slides is often just manual pagebreaks or a function that wraps content in a page.
  
  page[
    #if title != "" {
      text(36pt, weight: "bold", fill: primary-dark, title)
      v(0.5em)
      line(length: 100%, stroke: 2pt + primary-dark)
      v(1em)
    }
    #body
  ]
}

// Specific layouts
#let centered-slide(body) = {
  page[
    #align(center + horizon, body)
  ]
}

#let split-slide(left-content, right-content) = {
  page[
    #grid(
      columns: (1fr, 1fr),
      gutter: 2cm,
      left-content,
      right-content
    )
  ]
}
