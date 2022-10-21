import { useLocation } from 'react-router-dom';


export default function Header() {
  // get first resource in a pathname
  const path = useLocation().pathname.split("/")[1];
  const headerData = {
    about: {
      title: "About Me",
      subtitle: "I like building things on the web.",
      text: "",
      width: "col"
    },
    portfolio: {
      title: "Fullstack Portfolio",
      subtitle: "Click through the tabs to learn more about each app.",
      text: "This section is devoted to my deployed and maintained fullstack apps. Take a moment to click through and read a little about each one, or click the link to visit the deployed site.",
      width: "col-8"
    },
    projects: {
      title: "Project Library",
      subtitle: "Click on a project to interact with it.",
      text: "A place to show off the apps, programs, and concepts that made it to the finish line. Each project will have an associated blog that walks through the design and my implementation choices.",
      width: "col-8"
    },
    blog: {
      title: "Project Pith",
      subtitle: "A blog",
      text: "Expect to see detailed project walkthroughs, conference notes, my twitter feed, and the occasional musing on what makes a good baguette.",
      width: "col"
    },
    dashboard: {
      title: "My Dashboard",
      subtitle: "Site-wide metrics, updated on load",
      text: "All data here was generated with my own fullstack metrics system",
      width: "col"
    }
  };

  if (!headerData[path]) return <></>;

  return (
    <header id="header">
      <div className={"container-md " + headerData[path].width}>
        <div className="card text-bg-dark mb-3 mt-3">
          <div className="card-body">
            <h1 className="card-title">{headerData[path].title}</h1>
            <h5 className="card-subtitle mb-2 text-muted">{headerData[path].subtitle}</h5>
            <p className="card-text">{headerData[path].text}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
