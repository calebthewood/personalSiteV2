import { useState } from "react";

export default function PortfolioProject({ project }) {


  const [activeTab, setActiveTab] = useState("summary");

  function handleTabs(e) {
    e.preventDefault();
    setActiveTab(e.target.id);
  }

  // function createProjectTabs() {

  // }

  return (
    <div className="card mb-3">
      <div className="row g-0">
        <div className="portfolio-img col-md-4">
          <img src={project.img} className="img-fluid rounded-start" alt="project-screenshot" />
        </div>
        <div className="col-md-8">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs" onClick={handleTabs}>
              {["Summary", "Frontend", "Backend", "Database"].map(tabName => {
                let name = tabName.toLowerCase();
                return (
                  <li className="nav-item">
                    <a
                      id={name}
                      className={activeTab === name ? "nav-link active" : "nav-link"}
                      aria-current="true"
                      href={"#" + name}>{tabName}</a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card-body portfolio-card">
            <div className="tab-content" id="myTabContent">
              <div
                id="summary-tab-pane"
                className={activeTab === "summary" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="summary-tab" tabIndex="0">{project.summary}</div>
              <div
                id="frontend-tab-pane"
                className={activeTab === "frontend" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="frontend-tab"
                tabIndex="0">{project.frontend}</div>
              <div
                id="backend-tab-pane"
                className={activeTab === "backend" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="backend-tab"
                tabIndex="0">{project.backend}</div>
              <div
                id="database-tab-pane"
                className={activeTab === "database" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="database-tab"
                tabIndex="0">{project.database}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}