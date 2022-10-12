import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {

  return (
    <div id="home-page" className="row align-items-center">
      <div className="col">
        <h1>
          Welcome
        </h1>
        <h2>I'm Caleb Wood</h2>
        <h2>Software Enginner and Web Developer</h2>
      </div>
      <div id="home-links" className="row">
        <div id="home-links" className="col">
          <Link to="/about"><button>About</button></Link>
          <Link to="/portfolio"><button>Portfolio</button></Link>
          <Link to="/projects"><button>Projects</button></Link>
          <Link to="/blog/posts/recent"><button>Blog</button></Link>
        </div>
      </div>
    </div>
  );
}