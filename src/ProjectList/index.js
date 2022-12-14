import { ProjectLibrary } from "./ProjectLibrary/ProjectLibrary";
import { useParams } from "react-router-dom";
import { ProjectCard } from "./ProjectCard";
import { ProjectDetail } from "./ProjectDetail";
import { Link } from "react-router-dom";

export function ProjectList() {
  const { param } = useParams();
  const [currentProject] = ProjectLibrary.filter(project => project.id === param);

  return (
    <div className="container col-12 col-md-8">
      <div className="row row justify-content-center" >
        {currentProject ? <ProjectDetail project={currentProject} /> :
          <div className="col">
            {ProjectLibrary.map((project, i) => <ProjectCard key={`${project.id}-${i}`} project={project} />)}
          </div>}
      </div>
      {!currentProject &&
        <div className="row">
          <div className="d-grid gap-2">
            <Link to="/blog/posts/recent" type="button" className="btn btn-dark pt-3">
              <h5 className="he">To Blog</h5>
            </Link>
          </div>
        </div>}
    </div>
  );
}
