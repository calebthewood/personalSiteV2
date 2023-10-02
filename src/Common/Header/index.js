import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';


function Header() {
  const path = useLocation().pathname.split("/")[1];
  const [routeData, setRouteData] = useState(null);

  useEffect(() => setRouteData(headerData[path]), [path]);

  return (routeData &&
    <header id="header">
      <div className={"container-md " + routeData.width}>
        <div className="card border-dark border border-3 mb-4 mb-3 mt-3">
          <div className="card-body fade-in">
            <h1 className="card-title">{routeData.title}</h1>
            <h5 className="card-subtitle mb-2 text-muted">{routeData.subtitle}</h5>
            <p className="card-text">{routeData.text}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

const headerData = {
  about: {
    title: "About Me",
    subtitle: "I like building things on the web.",
    text: "",
    width: "col"
  },
  portfolio: {
    title: "Fullstack Portfolio",
    subtitle: "Click through the tabs to learn more about each app",
    text: "",
    width: "col"
  },
  projects: {
    title: "Project Library",
    subtitle: "Click on a project to interact with it",
    text: "",
    width: "col-12"
  },
  blog: {
    title: "Project Pith",
    subtitle: "A blog",
    text: "",
    width: "col"
  },
  dashboard: {
    title: "My Dashboard",
    subtitle: "Site-wide metrics, updated on load",
    text: "",
    width: "col"
  }
};

export { Header };