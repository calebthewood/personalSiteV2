import { Link } from "react-router-dom";
import "./home.css";
import { BoxCanvas } from "./BoxCanvas";

export function Home() {

  return (
    <div id="home-container" className="container col mb-4">

      <div id="home-row" className="row justify-content-between align-items-end mb-5">

        <div className="col-12 col-md-6 mt-5">
          <h1>
            Welcome
          </h1>
          <h2>I'm Caleb Wood,</h2>
          <h2>Full Stack Web Developer</h2>
        </div>
        <div className="col" id="home-animation">
          <BoxCanvas />
        </div>
      </div>

      <div className="row justify-content-around mb-5">
        <div className="col-sm-2 col-5 x">
          <Link to="/about">
            <button
              id="about-btn"
              type="button"
              className="btn btn-lg btn-outline-dark">About</button>
          </Link>
        </div>

        <div className="col-sm-2 col-5 mx-2">
          <Link to="/portfolio">
            <button
              id="portfolio-btn"
              type="button"
              className="btn btn-lg btn-outline-dark">Portfolio</button>
          </Link>
        </div>

        <div className="col-sm-2 col-5 mx-2">
          <Link to="/projects">
            <button
              id="projects-btn"
              type="button"
              className="btn btn-lg btn-outline-dark">Projects</button>
          </Link>
        </div>

        <div className="col-sm-2 col-5 mx-2">
          <Link to="/blog/posts/recent">
            <button
              id="blog-btn"
              type="button"
              className="btn btn-lg btn-outline-dark">Blog</button>
          </Link>
        </div>

      </div>
    </div>
  );
}
