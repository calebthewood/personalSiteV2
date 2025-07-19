import { Routes, Route, Navigate } from "react-router-dom";
import { Home } from "../Home";

/**
 * Site-wide Routes
 *
 * When I have more posts, I'll distribute them to the other routes. So that
 * relevant blogs can be shown alongside projects. Or at the least, linked to.
 */
export function RoutesList() {
  return (
    <Routes>
      <Route path="/" element={<Home path={"home"} />} />
      <Route path="/about" element={<Home path={"about"} />} />
      <Route path="/portfolio" element={<Home path={"portfolio"} />} />
      <Route path="/contact" element={<Home path={"contact"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
