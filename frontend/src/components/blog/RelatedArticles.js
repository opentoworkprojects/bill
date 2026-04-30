import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';

// RelatedArticles — shows 3 posts at end of article
// Prefers same targetMarket, falls back to same category
const RelatedArticles = ({ posts = [], currentSlug, targetMarket = [], category = '' }) => {
  const others = posts.filter(p => p.slug !== currentSlug);

  // Prefer same market
  let related = others.filter(p =>
    Array.isArray(p.targetMarket) && p.targetMarket.some(m => targetMarket.includes(m))
  );

  // Fall back to same category
  if (related.length < 3) {
    const byCat = others.filter(p => p.category === category && !related.find(r => r.id === p.id));
    related = [...related, ...byCat];
  }

  // Fill remaining with any posts
  if (related.length < 3) {
    const rest = others.filter(p => !related.find(r => r.id === p.id));
    related = [...related, ...rest];
  }

  const shown = related.slice(0, 3);
  if (shown.length === 0) return null;

  return (
    <div className="my-10">
      <h3 className="font-black text-lg text-gray-900 mb-4">Related Articles</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {shown.map(post => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="group block rounded-xl border border-gray-200 hover:border-orange-300 overflow-hidden transition-colors"
          >
            {post.image && (
              <img
                src={post.image}
                alt={post.imageAlt || post.title}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
            )}
            <div className="p-3">
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
};

export default RelatedArticles;
