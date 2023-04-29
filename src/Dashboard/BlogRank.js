import { DashboardAPI } from './dashboardAPI';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { Link } from 'react-router-dom';


export function BlogRank({ metrics, isLoading }) {
  const topBlogs = DashboardAPI.rankBlogPosts(metrics);

  // if (isLoading) return <div className="container-md"><div className="row mb-2"><LoadingSpinner /></div></div>;
  return (
    <div className="card bg-light border-dark border rounded border-3">
      <div className="card-body">
        <h2 className="card-title">Blog Ranks</h2>
        <hr />

        <ol className="list-group list-group-flush list-group-numbered">
          {topBlogs.map((blog) =>
            <li key={blog.slug} className="bg-light list-group-item">
              <Link to={`/blog/posts/${blog.slug}`}>{blog.title}</Link> - <i>{blog.count} visits</i>
            </li>)}
        </ol>

      </div>
    </div>
  );
}