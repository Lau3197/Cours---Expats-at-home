#let primary-dark = rgb("#2ecc71") // Mock color
#let mono(body) = text(font: "Courier New", body)

#let article(
  title: "",
  subtitle: "",
  logo: none,
  body
) = {
  set document(title: title)
  set page(
    paper: "a4",
    margin: (x: 2cm, y: 2cm),
  )
  set text(font: "Arial", size: 11pt) // standard font

  if logo != none {
    align(center, logo)
    v(1cm)
  }

  align(center, text(17pt, weight: "bold", title))
  if subtitle != "" {
    align(center, text(14pt, style: "italic", subtitle))
  }
  v(1cm)

  body
}

#let info-box(title: "", body) = {
  block(
    fill: rgb("#f0f0f0"),
    stroke: rgb("#d0d0d0"),
    inset: 1em,
    radius: 5pt,
    width: 100%,
    [
      *#title*
      #v(0.5em)
      #body
    ]
  )
}

#let tip-box(body) = {
  block(
    fill: rgb("#e6f3ff"),
    stroke: rgb("#b3d9ff"),
    inset: 1em,
    radius: 5pt,
    width: 100%,
    [
      *Tip:* #body
    ]
  )
}

#let warning-box(body) = {
  block(
    fill: rgb("#fff0f0"),
    stroke: rgb("#ffcccc"),
    inset: 1em,
    radius: 5pt,
    width: 100%,
    [
      *Warning:* #body
    ]
  )
}

#let check-item(checked: false, body) = {
  list(marker: if checked { box(inset: 2pt)[x] } else { box(inset: 2pt)[ ] })[#body]
}
