/* This will render list of projects
 pass in projects list from component that renders Project List

will probably keep the actual components here. Will have to think through
how to store a list of components
*/

import { useState } from "react"


export default function ProjectList() {
/*
clicking on a individual project summary will summon the componant sooo...
since each project is unique I can either hard code the route for each one
that would work for the Jobly approach where we view only the component
or I can figure out how to keep a list of them and only show the one selected
the weird thing is that it isn't text. Can we store components in objects???
hrmm... Anyway,
*/

  // let [projectSelected, setProject] = useState(null)


  return (
    <div>
      <h1>Projects</h1>
      <div>List of Project Cards</div>
      <div>Prompt to visit blog</div>
    </div>
  )
}