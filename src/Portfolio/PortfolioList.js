import { portfolio } from "./PortfolioData";
import PortfolioProject from "./PortfolioProject";

export default function PortfolioList() {
  /* Data isn't coming from a db so it'll just be hard coded.
  I can do that here or create another file to hold project data
  like title, description, image, etc. */


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