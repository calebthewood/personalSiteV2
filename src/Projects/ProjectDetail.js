import ReturnButton from "../Common/ReturnButton/ReturnButton";


export default function ProjectDetail({ project }) {
  return (
    <div>
      <ReturnButton />
        {project.component}
    </div>
  );
}