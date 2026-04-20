// notebook.ipynb (cellule Deno)
import { encode } from "npm:plantuml-encoder"

const diagram = `
@startuml
actor Élève
Élève --> (Passer un test)
@enduml`

const encoded = encode(diagram)
const url = `https://www.plantuml.com/plantuml/svg/${encoded}`

// Affiche l'image directement dans le notebook
const res = await fetch(url)
const svg = await res.text()
Deno.jupyter.display({ "image/svg+xml": svg }, { raw: true })