import { classListFromAnnotations } from "./blockUtils";

export default function HeadingBlock({ block }) {
  const { annotations, plain_text } = block.content.rich_text[0];
  const classList = classListFromAnnotations(annotations)
  return (
    (block.type === "heading_2") ?
      <h4 className={classList}>{plain_text}</h4> :
      <h5 className={classList}>{plain_text}</h5>
  );
}
