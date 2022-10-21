import "./portfolio.css"
import { portfolio } from "./portfolioData";
import PortfolioProject from "./PortfolioProject";

export default function PortfolioList() {

  return (
    <div className="container col-8 mb-2">
        {portfolio.map((project, i) => <PortfolioProject key={`${project.id}-${i}`} project={project} />)}
    </div>
  );
}