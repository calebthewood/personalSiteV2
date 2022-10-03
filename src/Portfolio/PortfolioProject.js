import { useState } from "react";

export default function PortfolioProject({ project }) {
  const style = {
    "max-width": "400px;"
  };

  const [activeTab, setActiveTab] = useState("summary");

  function handleTabs(e) {
    e.preventDefault();
    setActiveTab(e.target.id);
  }
  // const triggerTabList = document.querySelectorAll('#myTab button')
  // triggerTabList.forEach(triggerEl => {
  //   const tabTrigger = new Tab(triggerEl)

  //   triggerEl.addEventListener('click', event => {
  //     event.preventDefault()
  //     tabTrigger.show()
  //   })
  // })

  return (
    <div className="card mb-3" style={style}>
      <div className="row g-0">
        <div className="col-md-4">
          <img src={project.img} className="img-fluid rounded-start" alt="project-screenshot" />
        </div>
        <div className="col-md-8">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs" onClick={handleTabs}>
              <li className="nav-item">
                <a
                  id="summary"
                  className={activeTab === "summary" ? "nav-link active" : "nav-link"}
                  aria-current="true"
                  href="#summary">{project.title}</a>
              </li>
              <li className="nav-item">
                <a
                  id="frontend"
                  className={activeTab === "frontend" ? "nav-link active" : "nav-link"}
                  href="#frontend">Frontend</a>
              </li>
              <li className="nav-item">
                <a
                  id="backend"
                  className={activeTab === "backend" ? "nav-link active" : "nav-link"}
                  href="#backend">Backend</a>
              </li>
              <li className="nav-item">
                <a
                  id="database"
                  className={activeTab === "database" ? "nav-link active" : "nav-link"}
                  href="#database">Database</a>
              </li>
            </ul>
          </div>
          <div className="card-body">
            <div class="tab-content" id="myTabContent">
              <div
                id="summary-tab-pane"
                class={activeTab === "summary" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="summary-tab" tabindex="0">{project.summary}</div>
              <div
                id="frontend-tab-pane"
                class={activeTab === "frontend" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="frontend-tab"
                tabindex="0">{project.frontend}</div>
              <div
                id="backend-tab-pane"
                class={activeTab === "backend" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="backend-tab"
                tabindex="0">{project.backend}</div>
              <div
                id="database-tab-pane"
                class={activeTab === "database" ? "tab-pane fade show active" : "tab-pane fade"}
                role="tabpanel"
                aria-labelledby="database-tab"
                tabindex="0">{project.database}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}