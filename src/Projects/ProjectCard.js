import "./projects.css";
import { Link } from "react-router-dom";

export default function ProjectCard({ project }) {
  const styles = { maxWidth: "540px" };
  /* TODO: if I get more than like 10 projects, allow for filtering by tags
  Also, if this gets bigger, look into lazy loading project components */
  return (
    <div className="card mb-3">
      <Link to={"/projects" + project.url}>
        <div className="row g-0">
          <div className="col-md-3">
            {project.img ?
              <img src={project.img} className="img-fluid rounded-start" alt="Project Logo" /> :
              <i class="fa-solid fa-image img-fluid rounded-start"></i>}
          </div>
          <div className="col-md-9">
            <div className="card-body">
              <h5 className="card-title">{project.title}</h5>
              <p className="card-text">{project.description}</p>
              <p className="card-text"><small className="text-muted">{project.tags.join(", ")}</small></p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}