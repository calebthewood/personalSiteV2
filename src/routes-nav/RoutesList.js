import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../home/Home";
import AboutMe from "../about/AboutMe";
import PortfolioList from "../portfolio/PortfolioList";
import ProjectList from "../projects/ProjectList";
import ProjectDetail from "../projects/ProjectDetail";
import BlogList from "../blog/BlogList";
import BlogPost from "../blog/BlogPost";


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
        <Route path="/projects/:project" element={<ProjectDetail />} />
        <Route path="/blog-posts" element={<BlogList />} />
        <Route path="/blog-posts/:id" element={<BlogPost />} />
        <Route path="*" element={<Navigate to="/" />}/>
      </Routes>
    </div>
  );
}