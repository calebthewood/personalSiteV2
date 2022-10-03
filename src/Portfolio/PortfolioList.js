import { portfolio } from "./portfolioData";
import PortfolioProject from "./PortfolioProject";

export default function PortfolioList() {

  return (
    <div>
      <h1>Portfolio</h1>
      <div className="container">
        {portfolio.map( item => <PortfolioProject project={item} />)}
      </div>
      <div>
        Prompt to go to projects
      </div>
    </div>
  );
}