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
    <div className="col-sm-4 mb-3">
      <div className="card text-bg-dark">
        <Link to={section.url} className="navigation-link">
          <div className="card-body">
            <h5 className="card-title">{section.title}</h5>
            <hr/>
            <h6 className="card-subtitle mb-2">{section.subtitle}</h6>
          </div>
        </Link>
      </div>
    </div>
  );
}