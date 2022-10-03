import { Link } from "react-router-dom";
/*
section = {
  url: "/portfolio",
  title: "Portfolio",
  subtitle: "Click to see my fullstack portfolio"
  description: "maybe more"
}
*/
export default function SectionCard({ section }) {

  return (
    <div className="col-sm-4">
      <div className="card">
        <Link to={section.url}>
          <div className="card-body">
            <h5 className="card-title">{section.title}</h5>
            <h6 className="card-subtitle mb-2 text-muted">{section.subtitle}</h6>
          </div>
        </Link>
      </div>
    </div>
  );
}