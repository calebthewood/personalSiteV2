import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../home/Home";
import AboutMe from "../about/AboutMe";
import PortfolioList from "../portfolio/PortfolioList";
import ProjectList from "../projects/ProjectList";
import BlogList from "../blog/BlogList";
import Dashboard from "../dashboard/Dashboard";
// import ProjectDetail from "../projects/ProjectDetail";
// import BlogPost from "../blog/BlogPost";


/**
 * Site-wide Routes
 *
 * When I have more posts, I'll distribute them to the other routes. So that
 * relevant blogs can be shown alongside projects. Or at the least, linked to.
 */
export default function RoutesList({ isLoading, allPosts, tweets }) {
  // Routes to add later. to view just a post or just a project, no menus/header
  //     {/* <Route path="/projects/:project" element={<ProjectDetail />} /> */}
  //     {/* <Route path="/blog/:id" element={<BlogPost />} /> */}
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/portfolio" element={<PortfolioList />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:param" element={<ProjectList />} />
        <Route path="/blog/posts/:showing" element={<BlogList
          isLoading={isLoading}
          allPosts={allPosts}
          tweets={tweets} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}