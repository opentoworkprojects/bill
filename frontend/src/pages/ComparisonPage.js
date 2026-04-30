import React from 'react';
import { useParams } from 'react-router-dom';
import SEOMeta from '../components/seo/SEOMeta';
import SchemaManager from '../components/seo/SchemaManager';
import comparisonData from '../data/comparisonData';

const ComparisonPage = () => {
  const { comparisonSlug } = useParams();
  const comparison = comparisonData[comparisonSlug];

  if (!comparison) {
    return <div>Comparison not found</div>;
  }

  const schemaData = {
    name: comparison.title,
    description: comparison.metaDescription,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Windows, Android',
    offers: {
      price: '1999',
      priceCurrency: 'INR',
      availability: 'InStock'
    },
    aggregateRating: {
      ratingValue: '4.9',
      reviewCount: '500'
    }
  };

  return (
    <>
      <SEOMeta
        title={comparison.metaTitle}
        description={comparison.metaDescription}
        keywords={[comparison.slug, `${comparison.ourProduct} vs ${comparison.competitor}`, 'restaurant software comparison']}
        canonicalUrl={`https://billbytekot.in/compare/${comparison.slug}`}
        ogType="article"
      />
      <SchemaManager type="SoftwareApplication" data={schemaData} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
              {comparison.title}
            </h1>
            <p className="text-xl text-center max-w-3xl mx-auto mb-8">
              {comparison.summary}
            </p>
            <div className="text-center">
              <span className="inline-block bg-green-500 text-white px-6 py-3 rounded-full font-semibold">
                Winner: {comparison.winner}
              </span>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
            <div className="max-w-6xl mx-auto overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-blue-600">
                      {comparison.ourProduct}
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600">
                      {comparison.competitor}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.features.map((feature, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-6 py-4 font-medium">{feature.feature}</td>
                      <td className={`px-6 py-4 text-center ${
                        feature.winner === 'billbytekot' ? 'bg-green-50 text-green-800 font-semibold' : ''
                      }`}>
                        {feature.billbytekot}
                        {feature.winner === 'billbytekot' && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-center ${
                        feature.winner === 'competitor' ? 'bg-green-50 text-green-800 font-semibold' : ''
                      }`}>
                        {feature.competitor}
                        {feature.winner === 'competitor' && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pros and Cons */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Pros & Cons</h2>
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
              {/* BillByteKOT */}
              <div className="bg-blue-50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-6">{comparison.ourProduct}</h3>
                <div className="mb-6">
                  <h4 className="font-semibold text-green-600 mb-3">✓ Pros</h4>
                  <ul className="space-y-2">
                    {comparison.pros.billbytekot.map((pro, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">✗ Cons</h4>
                  <ul className="space-y-2">
                    {comparison.cons.billbytekot.map((con, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Competitor */}
              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-gray-600 mb-6">{comparison.competitor}</h3>
                <div className="mb-6">
                  <h4 className="font-semibold text-green-600 mb-3">✓ Pros</h4>
                  <ul className="space-y-2">
                    {comparison.pros.competitor.map((pro, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">✗ Cons</h4>
                  <ul className="space-y-2">
                    {comparison.cons.competitor.map((con, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Verdict */}
        <section className="py-16 bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Our Verdict</h2>
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg leading-relaxed mb-8">
                {comparison.verdict}
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Try BillByteKOT Free
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ComparisonPage;