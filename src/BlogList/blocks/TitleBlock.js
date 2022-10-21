import { classListFromAnnotations } from "./blockUtils";

export default function TitleBlock({ block, author, date }) {
  const { annotations, plain_text } = block.content.rich_text[0];
  const classList = classListFromAnnotations(annotations,["card-title"])
  return (
    <>
      <h3 className={classList}>{plain_text}</h3>
      <h6 className="card-subtitle mb-2 text-muted">{author} - {date}</h6>
    </>);
}
