import { useState } from "react";

export function PortfolioProject({ project }) {

  const [activeTab, setActiveTab] = useState("summary");

  function handleTabs(e) {
    e.preventDefault();
    setActiveTab(e.target.id);
  }

  return (
    <div className="card mb-5 text-bg-dark">

      <div className="portfolio-img">
        <img src={project.img} className="card-img-top rounded" alt="project-screenshot" />
      </div>

      <div className="card-header text-bg-secondary bg-opacity-25">
        <ul className="nav nav-tabs nav-tabs-dark card-header-tabs" onClick={handleTabs}>
          {["Summary", "Frontend", "Backend", "Database"].map((tabName, i) => {
            let name = tabName.toLowerCase();
            return (
              <li key={`${project.id}-1${i}`} className="nav-item">
                <a
                  id={name}
                  className={activeTab === name ? "nav-link active text-light bg-dark border-dark" : "nav-link text-muted"}
                  aria-current="true"
                  href={"#" + name}>{tabName}</a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card-body">
        <div className="tab-content" id="myTabContent">
          <div
            id="summary-tab-pane"
            className={activeTab === "summary" ? "tab-pane fade show active" : "tab-pane fade"}
            role="tabpanel"
            aria-labelledby="summary-tab" tabIndex="0">{project.summary}
            {project.link ? <a type="button" className="btn btn-sm btn-dark" href={project.link}> Visit Demo <i className="fa-solid fa-arrow-up-right-from-square"></i></a> : ""}</div>
          <div
            id="frontend-tab-pane"
            className={activeTab === "frontend" ? "tab-pane fade show active" : "tab-pane fade"}
            role="tabpanel"
            aria-labelledby="frontend-tab"
            tabIndex="0">
            <ul className="list-group list-group-flush">
              {project.frontend.map((item, i) => i === 0 ?
                <h5 key={`${project.id}-2${i}`} className="card-title">{item}</h5> :
                <li key={`${project.id}-2${i}`} className="text-bg-dark list-group-item">{item}</li>)}
            </ul>
          </div>
          <div
            id="backend-tab-pane"
            className={activeTab === "backend" ? "tab-pane fade show active" : "tab-pane fade"}
            role="tabpanel"
            aria-labelledby="backend-tab"
            tabIndex="0">
            <ul className="list-group list-group-flush">
              {project.backend.map((item, i) => i === 0 ?
                <h5 key={`${project.id}-3${i}`} className="card-title">{item}</h5> :
                <li key={`${project.id}-3${i}`} className="text-bg-dark list-group-item">{item}</li>)}
            </ul>
          </div>
          <div
            id="database-tab-pane"
            className={activeTab === "database" ? "tab-pane fade show active" : "tab-pane fade"}
            role="tabpanel"
            aria-labelledby="database-tab"
            tabIndex="0">
            <ul className="list-group list-group-flush">
              {project.database.map((item, i) => i === 0 ?
                <h5 key={`${project.id}-4${i}`} className="card-title">{item}</h5> :
                <li key={`${project.id}-4${i}`} className="text-bg-dark list-group-item">{item}</li>)}
            </ul>
          </div>
        </div>
      </div>


    </div>
  );
}