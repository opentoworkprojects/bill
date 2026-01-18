import React, { useState } from 'react';
import SchemaManager from './SchemaManager';

const FAQSection = ({ faqs, title = "Frequently Asked Questions" }) => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqSchema = {
    questions: faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer
    }))
  };

  return (
    <>
      <SchemaManager type="FAQPage" data={faqSchema} />
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            {title}
          </h2>
          <div className="max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div key={faq.id} className="mb-4 bg-white rounded-lg shadow-sm border">
                <button
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={openItems[faq.id]}
                >
                  <span className="font-semibold text-gray-800 pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      openItems[faq.id] ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openItems[faq.id] && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                    {faq.category && (
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {faq.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQSection;