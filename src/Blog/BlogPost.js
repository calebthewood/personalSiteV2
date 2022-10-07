// import { blogData } from "./mockBlogs";
// import { useParams } from "react-router-dom";
import CodeBlock from "./blocks/CodeBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import TitleBlock from "./blocks/TitleBlock";
import ReturnButton from "../common/ReturnButton";


export default function BlogPost({ post, showList }) {

  const blocks = post.blocks.map(block => {
    let type = block.type;
    if (type === "paragraph") {
      return <ParagraphBlock block={block.paragraph} />;
    } else if (type === "code") {
      return <CodeBlock block={block.code} />;
    } else if (type === "heading_1") {
      return <TitleBlock block={block.heading_1} author={post.author} date={post.date} />;
    } else if (type === "heading_2") {
      return <HeadingBlock block={block.heading_2} />;
    } else if (type === "heading_3") {
      return <HeadingBlock block={block.heading_3} />;
    }
    return <hr />;
  });

  return (
    <div className="card">
  <ReturnButton back={showList} />
      <div className="card-body">
        {blocks}
        <a href="#" className="card-link">tags</a>
      </div>
    </div>
  );
}