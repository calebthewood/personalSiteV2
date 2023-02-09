import { Link } from "react-router-dom";
import "./portfolio.css";
import { portfolio } from "./portfolioData";
import { PortfolioProject } from "./PortfolioProject";


export function PortfolioList() {

  return (
    <div className="container mb-4">
          {portfolio.map((project, i) => <PortfolioProject key={`${project.id}-${i}`} project={project} />)}

      <div className="row">
        <div className="d-grid gap-2">
          <Link to="/projects" type="button" className="btn btn-dark pt-3">
            <h5 className="he">To Projects</h5>
          </Link>
        </div>
      </div>

    </div>
  );
}