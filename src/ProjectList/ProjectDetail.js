import { ReturnButton } from "../Common/ReturnButton";

export function ProjectDetail({ project }) {
  return (
    <div className="row">
      <div className="col col-md-1">
        <ReturnButton />
      </div>
      <div className="col-12 col-md-11">
        {project.component}
      </div>
    </div>
  );
}
