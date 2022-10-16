import ReturnButton from "../common/ReturnButton";


export default function ProjectDetail({ project }) {
  return (
    <div>
      <ReturnButton />
        {project.component}
    </div>
  );
}