// Renders project components
//pass in portfolio data from file that renders portfolio list

export default function PortfolioList() {
  /* Data isn't coming from a db so it'll just be hard coded.
  I can do that here or create another file to hold project data
  like title, description, image, etc. */


  return (
    <div>
      <div>
        portfolio.map PortfolioComponents
      </div>
      <div>
        Prompt to go to projects
      </div>
    </div>
  );
}