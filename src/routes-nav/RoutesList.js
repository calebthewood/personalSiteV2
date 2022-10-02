import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../Home/Home";
import AboutMe from "../AboutMe/AboutMe";
import PortfolioList from "../Portfolio/PortfolioList";
import ProjectList from "../Projects/ProjectList";
import BlogList from "../Blog/BlogList";


/**
 * Site-wide Routes
 */

export default function RoutesList() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/portfolio" element={<PortfolioList />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/blog" element={<BlogList />} />
        {/* Catch all other routes and route to "/" */}
        <Route path="*" element={<Navigate to="/" />}/>
      </Routes>
    </div>
  );
}