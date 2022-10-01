// Renders project components

function PortfolioList() {
  /* Data isn't coming from a db so it'll just be hard coded.
  I can do that here or create another file to hold project data
  like title, description, image, etc. */


  return (
    <div>
      <div>
        portfolio.map( project ) {
          "<PortfolioProject props={project}"
        }
      </div>
      <div>
        Prompt to go to projects
      </div>
    </div>
  );
}