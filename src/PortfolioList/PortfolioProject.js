import { useState } from "react";

export function PortfolioProject({ project }) {

  const [activeTab, setActiveTab] = useState("summary");

  function handleTabs(e) {
    e.preventDefault();
    setActiveTab(e.target.id);
  }

  return (
    <div className="row">
      <div className="col-12 col-md-9 mb-4 gx-4">

        <div className="card col-12 col-md-auto">
          <div className="card-header">
            <ul className="nav nav-pills nav-fill" onClick={handleTabs}>
              {["Summary", "Frontend", "Backend", "Database"].map((tabName, i) => {
                let name = tabName.toLowerCase();
                return (
                  <li key={`${project.id}-1${i}`} className="nav-item">
                    <a
                      id={name}
                      className={activeTab === name ? "nav-link active text-light bg-dark border-dark" : "nav-link text-muted"}
                      aria-current="true"
                      href={"#" + name}>{i === 0 ? project.title : tabName}</a>
                  </li>
                );
              })}
              {project.link
                ? <a type="button" className="nav-link" href={project.link}>Visit Demo  <i className="fa-solid fa-arrow-up-right-from-square"></i></a>
                : ""}
            </ul>
          </div>

          <div className="card-body">
            <div className="tab-content" id="myTabContent">
              <div
                id="summary-tab-pane"
                className={activeTab === "summary" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="summary-tab" tabIndex="0">{project.summary}
              </div>
              <div
                id="frontend-tab-pane"
                className={activeTab === "frontend" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="frontend-tab"
                tabIndex="0">
                <ul className="list-group list-group-flush">
                  {project.frontend.map((item, i) => i === 0 ?
                    <h5 key={`${project.id}-2${i}`} className="card-title text-center">{item}</h5> :
                    <li key={`${project.id}-2${i}`} className="list-group-item">{item}</li>)}
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
                    <h5 key={`${project.id}-3${i}`} className="card-title text-center">{item}</h5> :
                    <li key={`${project.id}-3${i}`} className="list-group-item">{item}</li>)}
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
                    <h5 key={`${project.id}-4${i}`} className="card-title text-center">{item}</h5> :
                    <li key={`${project.id}-4${i}`} className="list-group-item">{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-md-3 mb-4">
        <img src={project.img} className="img-fluid rounded img-thumbnail align-end " alt="project-screenshot" />
      </div>

    </div>
  );
}
