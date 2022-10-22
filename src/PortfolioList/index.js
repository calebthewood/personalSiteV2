import "./portfolio.css"
import { portfolio } from "./portfolioData";
import PortfolioProject from "./PortfolioProject";

export default function PortfolioList() {

  return (
    <div className="container col-12 col-md-8 mb-4">
        {portfolio.map((project, i) => <PortfolioProject key={`${project.id}-${i}`} project={project} />)}
    </div>
  );
}