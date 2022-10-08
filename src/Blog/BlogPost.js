// import { blogData } from "./mockBlogs";
// import { useParams } from "react-router-dom";
import CodeBlock from "./blocks/CodeBlock";
import HeadingBlock from "./blocks/HeadingBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import TitleBlock from "./blocks/TitleBlock";
import ReturnButton from "../common/ReturnButton";
import { Link } from "react-router-dom";


export default function BlogPost({ post }) {

  const blocks = post.blocks.map(block => {
    if (block.type === "paragraph") {
      return <ParagraphBlock key={block.id} block={block} />;
    } else if (block.type === "code") {
      return <CodeBlock key={block.id} block={block} />;
    } else if (block.type === "heading_1") {
      return <TitleBlock key={block.id} block={block} author={post.author} date={post.date} />;
    } else if (block.type === "heading_2") {
      return <HeadingBlock key={block.id} block={block} />;
    } else if (block.type === "heading_3") {
      return <HeadingBlock key={block.id} block={block} />;
    }
    return <hr />;
  });

  return (
    <div className="card">
      <ReturnButton />
      <div className="card-body">
        {blocks}
      </div>
      <div className="tags">
        {post.tags.map(tag =>
          <Link
            key={tag.id}
            className={`tag${tag.name} card-link`}
            to={`/blog/posts/${tag.name}`}>{tag.name}</Link>)}
      </div>
    </div>
  );
}