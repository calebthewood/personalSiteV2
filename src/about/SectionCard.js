import { Link } from "react-router-dom";

export default function SectionCard({ section }) {
  return (
    <div className="card" style={{width: "18rem;"}}>
      <Link to={section.url}>
      <div className="card-body">
        <h5 className="card-title">{section.title}</h5>
        <h6 className="card-subtitle mb-2 text-muted">{section.subtitle}</h6>
        <p className="card-text">{section.description}</p>
      </div>
      </Link>
    </div>
  );
}