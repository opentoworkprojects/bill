import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ChevronRight, Home } from 'lucide-react';

// BreadcrumbNav — renders Home > Blog > [Category] > [Post Title]
// Also injects JSON-LD BreadcrumbList schema via react-helmet
const BreadcrumbNav = ({ category = '', postTitle = '' }) => {
  const BASE_URL = 'https://billbytekot.in';

  const items = [
    { name: 'Home', url: `${BASE_URL}/` },
    { name: 'Blog', url: `${BASE_URL}/blog` },
  ];
  if (category) items.push({ name: category, url: `${BASE_URL}/blog?category=${encodeURIComponent(category)}` });
  if (postTitle) items.push({ name: postTitle, url: null }); // current page — no link

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-gray-500 mb-4 flex-wrap">
        <Link to="/" className="flex items-center gap-1 hover:text-orange-500 transition-colors">
          <Home className="w-3 h-3" />
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <Link to="/blog" className="hover:text-orange-500 transition-colors">Blog</Link>
        {category && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <Link to={`/blog?category=${encodeURIComponent(category)}`} className="hover:text-orange-500 transition-colors">
              {category}
            </Link>
          </>
        )}
        {postTitle && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-gray-700 font-medium truncate max-w-[200px]">{postTitle}</span>
          </>
        )}
      </nav>
    </>
  );
};

export default BreadcrumbNav;
