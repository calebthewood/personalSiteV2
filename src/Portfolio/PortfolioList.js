import { portfolio } from "./portfolioData";
import PortfolioProject from "./PortfolioProject";

export default function PortfolioList() {

  return (
    <div className="container">
      <header>
        <div className="card mb-3">
          <div className="card-body">
            <h1 className="card-title">Fullstack Portfolio</h1>
            <h5 className="card-subtitle mb-2 text-muted">Click through the tabs to learn more about each app.</h5>
            <p className="card-text">This section is devoted to my deployed and
              maintained fullstack apps. Take a moment to click through and read
              a little about each one, or click the link to visit the deployed site,
              complete with filler data.
            </p>
          </div>
        </div>
      </header>
      <div>
        {portfolio.map((project, i) => <PortfolioProject key={`${project.id}-${i}`} project={project} />)}
      </div>
      <div>
        Prompt to go to projects
      </div>
    </div>
  );
}