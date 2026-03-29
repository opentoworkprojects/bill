import { Link } from 'react-router-dom';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';

// PillarPage — reusable layout for topic cluster landing pages
// Renders at /blog/pillar/[topic-slug]
// Props: topic (string), description (string), posts (array)
const PillarPage = ({ topic = '', description = '', posts = [] }) => (
  <div className="max-w-4xl mx-auto px-4 py-10">
    <div className="mb-8 text-center">
      <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
        <BookOpen className="w-3.5 h-3.5" />
        Pillar Content
      </div>
      <h1 className="font-black text-3xl text-gray-900 mb-3">{topic}</h1>
      <p className="text-gray-500 text-base max-w-2xl mx-auto">{description}</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {posts.map(post => (
        <Link
          key={post.id || post.slug}
          to={`/blog/${post.slug}`}
          className="group flex gap-4 rounded-xl border border-gray-200 hover:border-orange-300 p-4 transition-colors"
        >
          {post.image && (
            <img
              src={post.image}
              alt={post.imageAlt || post.title}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-orange-500 font-semibold mb-1">{post.category}</div>
            <div className="font-bold text-sm text-gray-900 group-hover:text-orange-600 line-clamp-2 leading-snug mb-2">
              {post.title}
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock className="w-3 h-3" />
              {post.readTime}
              <ArrowRight className="w-3 h-3 ml-auto text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default PillarPage;
