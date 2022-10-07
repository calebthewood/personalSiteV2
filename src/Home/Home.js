import { Link } from "react-router-dom";

export default function Home() {

  return (
    <div>
      <div>
        <h1>
          Welcome
        </h1>
        <h2>I'm Caleb Wood</h2>
        <h2>Software Enginner and Web Developer</h2>
      </div>
      <div>
        <Link to="/about"><button>About</button></Link>
        <Link to="/portfolio"><button>Portfolio</button></Link>
        <Link to="/projects"><button>Projects</button></Link>
        <Link to="/blog-posts"><button>Blog</button></Link>
      </div>
    </div>
  );
}