import { ProjectLibrary } from "./ProjectLibrary/ProjectLibrary";
import { useParams } from "react-router-dom";
import ProjectCard from "./ProjectCard";
import ProjectDetail from "./ProjectDetail";

export default function ProjectList() {
  const { param } = useParams();
  const [currentProject] = ProjectLibrary.filter(project => project.id === param);

  /*
  clicking on a individual project summary will summon the componant sooo...
  since each project is unique I can either hard code the route for each one
  that would work for the Jobly approach where we view only the component
  or I can figure out how to keep a list of them and only show the one selected
  the weird thing is that it isn't text. Can we store components in objects???
  hrmm... Anyway,
  */

  return (
    <div className="container col-8">
      <div className="row row justify-content-center" >
        {currentProject ? <ProjectDetail project={currentProject} /> :
          <div className="col">
            {ProjectLibrary.map((project, i) => <ProjectCard key={`${project.id}-${i}`} project={project} />)}
          </div>}
      </div>
    </div>
  );
}