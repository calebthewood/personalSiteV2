import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "../Home";
import { AboutMe } from "../AboutMe";
import { PortfolioList } from "../PortfolioList";
import { ProjectList } from "../ProjectList";
import { BlogList } from "../BlogList";
import { Dashboard } from "../Dashboard";
// import ProjectDetail from "../projects/ProjectDetail";
// import BlogPost from "../blog/BlogPost";


/**
 * Site-wide Routes
 *
 * When I have more posts, I'll distribute them to the other routes. So that
 * relevant blogs can be shown alongside projects. Or at the least, linked to.
 */
export function RoutesList({ isLoading, allPosts, tweets }) {
  // Routes to add later. to view just a post or just a project, no menus/header
  //     {/* <Route path="/projects/:project" element={<ProjectDetail />} /> */}
  //     {/* <Route path="/blog/:id" element={<BlogPost />} /> */}
  return (
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
  );
}