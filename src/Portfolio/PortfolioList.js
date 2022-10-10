import "./portfolio.css"
import { portfolio } from "./portfolioData";
import PortfolioProject from "./PortfolioProject";

export default function PortfolioList() {

  return (
    <div>
      <div>
        {portfolio.map((project, i) => <PortfolioProject key={`${project.id}-${i}`} project={project} />)}
      </div>
      <div>
        Prompt to go to projects
      </div>
    </div>
  );
}