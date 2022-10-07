import { projects } from "./projectData";
// import { useState } from "react";
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
      <header>
        <div className="card mb-3">
          <div className="card-body">
            <h1 className="card-title">Project Library</h1>
            <h5 className="card-subtitle mb-2 text-muted">Click on a project to interact with it.</h5>
            <p className="card-text">This is something like my personal component
              library. Mostly, it's a place to show off the apps and programs
              that made it to the finish line. Each project has an associated blog
              that walks through the design and my implementation choices.
            </p>
          </div>
        </div>
      </header>
      {projects.map(project => <ProjectCard project={project} />)}
    </div>
  );
}