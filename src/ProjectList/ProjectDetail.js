import ReturnButton from "../Common/ReturnButton";

export default function ProjectDetail({ project }) {
  return (
    <div className="row justify-content-center" style={{width: "fit-content"}} >
      <ReturnButton />
        {project.component}
    </div>
  );
}
