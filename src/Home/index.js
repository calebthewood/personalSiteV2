import { Link } from "react-router-dom";
import "./home.css";
import { BoxCanvas } from "./BoxCanvas";

export function Home() {
  return (
    <div id="home-container" className="wrapper">
      <div id="home-row" className="hero">
        <h1>Welcome</h1>
        <h2>I'm <b>Caleb</b> Wood,<br/>Full Stack Web Developer</h2>
        <h2></h2>
      </div>
      <div id="home-animation" className="geometry" >
        <BoxCanvas />
      </div>
      <Link className="about" to="/about">
        <button
          id="about-btn"
          type="button"
          className="home-btns">About</button>
      </Link>
      <Link className="portfolio" to="/portfolio">
        <button
          id="portfolio-btn"
          type="button"
          className="home-btns">Portfolio</button>
      </Link>
      <Link className="projects" to="/projects">
        <button
          id="projects-btn"
          type="button"
          className="home-btns">Projects</button>
      </Link>
      <Link className="blog" to="/blog/posts/recent">
        <button
          id="blog-btn"
          type="button"
          className="home-btns">Blog</button>
      </Link>
    </div>
  );
}
