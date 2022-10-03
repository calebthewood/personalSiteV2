import "./projects.css"

export default function ProjectCard({ project }) {
  const styles = { maxWidth: "540px" };
  // if possible:

  return (
    <div className="card mb-3" style={styles}>
      <div className="row g-0">
        <div className="col-md-3">
          <img src="..." className="img-fluid rounded-start" alt="Project Logo" />
        </div>
        <div className="col-md-9">
          <div className="card-body">
            <h5 className="card-title">{project.title}</h5>
            <p className="card-text">{project.description}</p>
            <p className="card-text"><small className="text-muted">{project.tags.join(", ")}</small></p>
          </div>
        </div>
      </div>
    </div>
  );
}