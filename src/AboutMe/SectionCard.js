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
    <div className="col-sm-4 mb-2">
      <div className="card text-bg-dark">
        <Link to={section.url} type="button" className="btn btn-dark">
          <div className="card-body">
            <h5 className="section-icon card-title">{section.icon}</h5>
            <hr/>
            <h6 className="card-subtitle">{section.title}</h6>
          </div>
        </Link>
      </div>
    </div>
  );
}
