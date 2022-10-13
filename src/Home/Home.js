import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {

  return (
    <div id="home-container" className="container">

      <div id="home-row" className="row align-items-end mb-5">

        <div className="col-12">
          <h1>
            Welcome
          </h1>
          <h2>I'm Caleb Wood,</h2>
          <h2>Fullstack Engineer and Web Developer</h2>
        </div>
      </div>

      <div className="row justify-content-center mb-5">
        <div className="col-sm-2 col-5 m-2">
          <Link to="/about">
            <button
              id="about-btn"
              type="button"
              class="btn btn-lg btn-outline-dark">About</button>
          </Link>
        </div>

        <div className="col-sm-2 col-5 m-2">
          <Link to="/portfolio">
            <button
              id="portfolio-btn"
              type="button"
              class="btn btn-lg btn-outline-dark">Portfolio</button>
          </Link>
        </div>

        <div className="col-sm-2 col-5 m-2">
          <Link to="/projects">
            <button
              id="projects-btn"
              type="button"
              class="btn btn-lg btn-outline-dark">Projects</button>
          </Link>
        </div>

        <div className="col-sm-2 col-5 m-2">
          <Link to="/blog/posts/recent">
            <button
              id="blog-btn"
              type="button"
              class="btn btn-lg btn-outline-dark">Blog</button>
          </Link>
        </div>

      </div>
    </div>

  );
}