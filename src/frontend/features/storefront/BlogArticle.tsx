import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './BlogArticle.module.css';

/** Renders a blog post's Markdown content server-side with GFM support. */
export default function BlogArticle({ content }: { content: string }) {
  return (
    <div className={styles.article}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
