import ReturnButton from "../common/ReturnButton";


export default function ProjectDetail({ project }) {
  return (
    <div><ReturnButton />
      <div className="card text-bg-dark py-4">
        {project.component}
      </div>
    </div>
  );
}