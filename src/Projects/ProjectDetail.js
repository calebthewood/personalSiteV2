import ReturnButton from "../common/ReturnButton";


export default function ProjectDetail({ project }) {
  const styles = {
    height: "300px",
    width: "400px",
  };
  return (
    <div className="container">
      <ReturnButton />
      <div className="card text-bg-dark">
        <img src="..." className="card-img" alt="project screenshot" style={styles} />
        <div className="card-img-overlay">
          <h5 className="card-title">{project.title}</h5>
          <p className="card-text">{project.description}</p>
          <p className="card-text"><small>Some of which are bascially their own app</small></p>
        </div>
      </div>

    </div>
  );
}