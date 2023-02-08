import { Link } from "react-router-dom";
import "./portfolio.css";
import { portfolio } from "./portfolioData";
import { PortfolioProject } from "./PortfolioProject";


export function PortfolioList() {

  return (
    <div className="container col-12 col-md-12 col-lg-8 mb-4">

      <div className="row gy-4 gx-4">
        {portfolio.map((project, i) => <PortfolioProject key={`${project.id}-${i}`} project={project} />)}
      </div>

      <div className="row mt-5">
        <div className="d-grid gap-2">
          <Link to="/projects" type="button" className="btn btn-dark pt-3">
            <h5 className="he">To Projects</h5>
          </Link>
        </div>
      </div>

    </div>
  );
}