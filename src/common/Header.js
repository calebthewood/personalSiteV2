import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getResourceFromPath } from '../utils';


export default function Header() {
  const { pathname } = useLocation();
  const path = getResourceFromPath(pathname);

  console.log("PATHNAME", pathname);

  const [headerData, setHeaderData] = useState({
    about: {
      title: "About Me",
      subtitle: "I like building things on the web.",
      text: "Scroll down for a mini bio."
    },
    portfolio: {
      title: "Fullstack Portfolio",
      subtitle: "Click through the tabs to learn more about each app.",
      text: "This section is devoted to my deployed and maintained fullstack apps. Take a moment to click through and read a little about each one, or click the link to visit the deployed site, complete with filler data."
    },
    projects: {
      title: "Project Library",
      subtitle: "Click on a project to interact with it.",
      text: "This is something like my personal component library. Mostly, it's a place to show off the apps and programs that made it to the finish line. Each project has an associated blog that walks through the design and my implementation choices."
    },
    blog: {
      title: "Project Pith",
      subtitle: "A blog",
      text: "Expect to see detailed project walkthroughs, conference notes, my twitter feed, and the occasional musing on what makes a good baguette."
    }
  });

  if (!headerData[path]) return <></>;

  return (
    <header id="header">
      <div className="card mb-3">
        <div className="card-body">
          <h1 className="card-title">{headerData[path].title}</h1>
          <h5 className="card-subtitle mb-2 text-muted">{headerData[path].subtitle}</h5>
          <p className="card-text">{headerData[path].text}</p>
        </div>
      </div>
    </header>
  );
}