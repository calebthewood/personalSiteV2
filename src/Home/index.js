import { Link } from "react-router-dom";
import "./home.css";
import { BoxCanvas } from "./BoxCanvas";

export function Home({ path }) {

  const content = {
    home: {
      title: <h1>Welcome</h1>,
      body: <h2>I'm Caleb Wood, Lead Dev at<br/> UHERO, and this is my site.</h2>
    },
    about : {
      title: <h1>About me</h1>,
      body: <h2>I work with economists to share research about Hawaii.</h2>
    },
    portfolio: {
      title: <h1>Portfolio</h1>,
      body: <ul>
        <li><a className="uhero-links" href="https://analytics.uhero.hawaii.edu/housing/factsheet-builder#top">Housing Dashboard</a></li>
        <li><a className="uhero-links" href="https://analytics.uhero.hawaii.edu/maui-recovery-dashboard/housing-and-jobs">Maui Recovery Dashboard</a></li>
        <li><a className="uhero-links" href="https://analytics.uhero.hawaii.edu/maui-recovery-dashboard/housing-and-jobs">Rapid Survey Results</a></li>
      </ul>
    },
    contact : {
      title: <h1>Contact</h1>,
      body: <>
        <h2>Thanks for visiting!</h2>
        <hr />
        <div className="d-flex justify-content-between">
          <a title="LinkedIn" type="button" className="btn btn-lg btn-light" href="https://www.linkedin.com/in/caleb-wood-440b37168/">
            <i className="fa-brands fa-linkedin"></i>
          </a>
          <a title="GitHub" type="button" className="btn btn-lg btn-light" href="https://github.com/calebthewood">
            <i className="fa-brands fa-github"></i>
          </a>
          <a title="Instagram" type="button" className="btn btn-lg btn-light" href="https://www.instagram.com/calebthewood/?hl=en">
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a type="button" className="btn btn-lg btn-light" href="mailto:calebwood.cs@gmail.com">
            <i className="about-icons fa-solid fa-envelope"></i>
          </a>
          <a title="Resume" type="button" className="btn btn-lg btn-light" href="https://s3.us-west-1.amazonaws.com/pix.ly/Caleb_Wood_Resume.docx">
            <i className="fa-regular fa-file"></i>
          </a>
        </div>
      </> 
    },
  }

  return (
    <div id="home-container" className="wrapper">
      <div id="home-row" className="hero nb-card">
        {content[path].title}
        {content[path].body}
      </div>
      <div id="home-animation" className="geometry" >
        <BoxCanvas />
      </div>
        <Link className="btn-1" to="/">
        <button
          id="projects-btn"
          type="button"
          className="home-btns">Home</button>
      </Link>
      <Link className="btn-2" to="/about">
        <button
          id="about-btn"
          type="button"
          className="home-btns">About</button>
      </Link>
      <Link className="btn-3" to="/portfolio">
        <button
          id="portfolio-btn"
          type="button"
          className="home-btns">Portfolio</button>
      </Link>
      <Link className="btn-4" to="/contact">
        <button
          id="blog-btn"
          type="button"
          className="home-btns">Contact</button>
      </Link>
    </div>
  );
}
