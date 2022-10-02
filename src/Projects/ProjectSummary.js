

export default function ProjectCard() {

// if possible:
let project = {
  title: "Canvas Platformer",
  description: "blah blah blah",
  component: <CanvasGame />,
  img: "url/"
}
  return (
    <div>
      <h1>project.title</h1>
      <p>project.description</p>
      <p>project.img</p>
      if clicked, display project.component
    </div>
  )
}