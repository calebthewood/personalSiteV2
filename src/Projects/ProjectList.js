import { projects } from "./projectData"
import { useState } from "react"
import ProjectCard from "./ProjectCard";


export default function ProjectList() {
/*
clicking on a individual project summary will summon the componant sooo...
since each project is unique I can either hard code the route for each one
that would work for the Jobly approach where we view only the component
or I can figure out how to keep a list of them and only show the one selected
the weird thing is that it isn't text. Can we store components in objects???
hrmm... Anyway,
*/

  return (
    <div className="container">
      {projects.map( project => <ProjectCard project={project}/>)}
    </div>
  )
}