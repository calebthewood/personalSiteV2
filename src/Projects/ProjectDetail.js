import ReturnButton from "../common/ReturnButton";
import { useParams } from "react-router-dom";
// import { useState } from "react";
import { projects } from "./projectData";


export default function ProjectDetail() {
  let { project } = useParams();
  let currentProject = projects.filter(p => p.url === "/" + project)[0]
  console.log("param ",project)
  console.log("currentProject ",currentProject)
  const styles = {
    height: "300px",
    width: "400px",
  }
  return (
    <div className="container">
      <ReturnButton route="/projects" />
      <div className="card text-bg-dark">
        <img src="..." className="card-img" alt="project screenshot" style={styles}/>
          <div className="card-img-overlay">
            <h5 className="card-title">{currentProject.title}</h5>
            <p className="card-text">This represents a project component</p>
            <p className="card-text"><small>Some of which are bascially their own app</small></p>
          </div>
      </div>

    </div>
  );
}