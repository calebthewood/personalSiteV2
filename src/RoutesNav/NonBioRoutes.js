import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "../Home";
import { Dashboard } from "../Dashboard";

export function NonBioRoutesList() {
  // Routes to add later. to view just a post or just a project, no menus/header
  //     {/* <Route path="/projects/:project" element={<ProjectDetail />} /> */}
  //     {/* <Route path="/blog/:id" element={<BlogPost />} /> */}
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
  );
}