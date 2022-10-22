import "./block.css"
import { classListFromAnnotations } from "./blockUtils";

export function CodeBlock({ block }) {
  const languages = {
    'javascript': 'JavaScript',
    'python': 'Python',
  }
  const { annotations, plain_text, id } = block.content.rich_text[0];
  const classList = classListFromAnnotations(annotations)
  return (
    <div id={id} className="code">
      <p><span>{languages[block.content.language]}</span></p>
      <pre>
        <code className={classList}>
          {plain_text}
        </code>
      </pre>
    </div>
  );
}
