import { ProjectLibrary } from "./ProjectLibrary/ProjectLibrary";
import { useParams } from "react-router-dom";
import { ProjectCard } from "./ProjectCard";
import { ProjectDetail } from "./ProjectDetail";
import { Link } from "react-router-dom";

export function ProjectList() {
  const { param } = useParams();
  const [currentProject] = ProjectLibrary.filter(project => project.id === param);

  return (
    <div>
      <div className="col-12">
        {currentProject ? <ProjectDetail project={currentProject} /> :
          ProjectLibrary.map((project, i) => <ProjectCard key={`${project.id}-${i}`} project={project} />)}
      </div>

      {!currentProject &&
        <div className="row">
          <div className="d-grid gap-2 mb-4">
            <Link to="/blog/posts/recent" type="button" className="pt-3">
            <button className="home-btns">To Blog</button>
            </Link>
          </div>
        </div>}
    </div>
  );
}
