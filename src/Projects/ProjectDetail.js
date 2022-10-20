import ReturnButton from "../Common/ReturnButton";


export default function ProjectDetail({ project }) {
  return (
    <div>
      <ReturnButton />
        {project.component}
    </div>
  );
}