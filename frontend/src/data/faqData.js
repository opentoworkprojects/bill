const faqData = [
  {
    id: 1,
    question: "What is the best restaurant billing software in India 2025?",
    answer: "BillByteKOT is rated as the best restaurant billing software in India for 2025. It offers comprehensive features including KOT system, thermal printing with 6 themes, WhatsApp integration, inventory management, and GST billing at just ₹1999/year - making it more affordable than competitors like Petpooja while offering superior features.",
    keywords: ["best restaurant billing software India", "restaurant software 2025"],
    category: "General"
  },
  {
    id: 2,
    question: "Is BillByteKOT better than Petpooja?",
    answer: "Yes, BillByteKOT offers several advantages over Petpooja: 1) More affordable pricing at ₹1999/year vs Petpooja's ₹12,000+, 2) AI-powered recommendations, 3) 6 professional thermal receipt themes, 4) WhatsApp Cloud API integration, 5) Offline mode support, 6) Free 7-day trial.",
    keywords: ["billbytekot vs petpooja", "petpooja alternative"],
    category: "Comparison"
  },
  {
    id: 3,
    question: "How much does restaurant billing software cost in India?",
    answer: "Restaurant billing software in India ranges from ₹1999/year (BillByteKOT) to ₹15,000+/year (premium solutions). BillByteKOT offers the best value with all features at ₹1999/year, while competitors like Petpooja charge ₹12,000+ for similar functionality.",
    keywords: ["restaurant billing software price", "restaurant software cost"],
    category: "Pricing"
  },
  {
    id: 4,
    question: "What is KOT in restaurant billing?",
    answer: "KOT (Kitchen Order Ticket) is a system that sends order details from the billing counter to the kitchen. It helps restaurants manage orders efficiently, reduce errors, and improve kitchen workflow. BillByteKOT offers advanced KOT features with customizable formats and real-time updates.",
    keywords: ["what is KOT", "kitchen order ticket", "KOT system"],
    category: "Features"
  },
  {
    id: 5,
    question: "Does BillByteKOT work offline?",
    answer: "Yes, BillByteKOT works completely offline. You can create bills, manage inventory, and print receipts without internet connection. Data syncs automatically when connection is restored, ensuring uninterrupted restaurant operations.",
    keywords: ["offline restaurant billing", "offline POS software"],
    category: "Technical"
  },
  {
    id: 6,
    question: "Can I integrate WhatsApp with restaurant billing software?",
    answer: "Yes, BillByteKOT offers WhatsApp Cloud API integration. You can send bills, order confirmations, and promotional messages directly through WhatsApp. This feature helps improve customer communication and reduces SMS costs.",
    keywords: ["WhatsApp billing integration", "restaurant WhatsApp"],
    category: "Features"
  },
  {
    id: 7,
    question: "Is BillByteKOT GST compliant?",
    answer: "Yes, BillByteKOT is fully GST compliant. It generates GST invoices, maintains proper tax records, supports multiple GST rates, and provides GST reports for easy filing. All invoices meet government requirements.",
    keywords: ["GST billing software", "GST compliant restaurant software"],
    category: "Technical"
  },
  {
    id: 8,
    question: "Which thermal printer works with BillByteKOT?",
    answer: "BillByteKOT supports all major thermal printers including TVS, Epson, Star, and generic ESC/POS printers. It offers 6 professional receipt themes and supports both USB and network printers for flexible setup.",
    keywords: ["thermal printer restaurant", "receipt printer compatibility"],
    category: "Technical"
  },
  {
    id: 9,
    question: "Can I manage multiple restaurant locations with BillByteKOT?",
    answer: "Yes, BillByteKOT supports multi-location management. You can manage multiple restaurants from a single dashboard, track performance across locations, and maintain centralized inventory and reporting.",
    keywords: ["multi location restaurant software", "restaurant chain management"],
    category: "Features"
  },
  {
    id: 10,
    question: "Does BillByteKOT have inventory management?",
    answer: "Yes, BillByteKOT includes comprehensive inventory management. Track stock levels, set low stock alerts, manage suppliers, calculate food costs, and generate inventory reports to optimize restaurant operations.",
    keywords: ["restaurant inventory management", "stock management software"],
    category: "Features"
  },
  {
    id: 11,
    question: "How to setup table management in restaurant software?",
    answer: "BillByteKOT offers easy table management setup. Create floor plans, assign tables, track occupancy status, manage reservations, and split bills across tables. The visual interface makes table management intuitive.",
    keywords: ["table management software", "restaurant table booking"],
    category: "Features"
  },
  {
    id: 12,
    question: "Can customers order online with BillByteKOT?",
    answer: "Yes, BillByteKOT provides online ordering capabilities. Customers can browse menu, place orders, and make payments online. Orders integrate directly with your POS system for seamless operations.",
    keywords: ["online ordering system", "restaurant online menu"],
    category: "Features"
  },
  {
    id: 13,
    question: "Is there a free trial for BillByteKOT?",
    answer: "Yes, BillByteKOT offers a 7-day free trial with full access to all features. No credit card required. You can test all functionality including billing, KOT, inventory, and reports before purchasing.",
    keywords: ["free restaurant software trial", "restaurant POS free trial"],
    category: "Pricing"
  },
  {
    id: 14,
    question: "How to generate reports in restaurant billing software?",
    answer: "BillByteKOT provides comprehensive reporting including daily sales, item-wise analysis, tax reports, profit margins, and custom date ranges. Reports can be exported to PDF/Excel for accounting and analysis.",
    keywords: ["restaurant sales reports", "POS reporting features"],
    category: "Features"
  },
  {
    id: 15,
    question: "Can I customize receipt format in BillByteKOT?",
    answer: "Yes, BillByteKOT offers 6 professional receipt themes and full customization options. Add your logo, customize layout, include terms & conditions, and create branded receipts that match your restaurant identity.",
    keywords: ["custom receipt format", "restaurant receipt design"],
    category: "Features"
  },
  {
    id: 16,
    question: "Does BillByteKOT support barcode scanning?",
    answer: "Yes, BillByteKOT supports barcode scanning for quick item entry and inventory management. Compatible with USB and wireless barcode scanners to speed up billing and stock management processes.",
    keywords: ["barcode scanner restaurant", "POS barcode support"],
    category: "Technical"
  },
  {
    id: 17,
    question: "How secure is cloud-based restaurant software?",
    answer: "BillByteKOT uses enterprise-grade security with SSL encryption, regular backups, and secure cloud infrastructure. Your data is protected with multiple security layers and 99.9% uptime guarantee.",
    keywords: ["restaurant software security", "cloud POS security"],
    category: "Technical"
  },
  {
    id: 18,
    question: "Can I track employee performance with BillByteKOT?",
    answer: "Yes, BillByteKOT includes staff management features. Track individual sales performance, monitor login times, assign roles and permissions, and generate staff-wise reports for better management.",
    keywords: ["restaurant staff management", "employee tracking POS"],
    category: "Features"
  },
  {
    id: 19,
    question: "What payment methods does BillByteKOT support?",
    answer: "BillByteKOT supports all payment methods including cash, card, UPI, digital wallets, and split payments. Integrated with major payment gateways for seamless transaction processing.",
    keywords: ["restaurant payment methods", "UPI billing software"],
    category: "Features"
  },
  {
    id: 20,
    question: "How to backup restaurant data in BillByteKOT?",
    answer: "BillByteKOT automatically backs up your data to secure cloud servers daily. You can also export data manually anytime. Multiple backup locations ensure your restaurant data is always safe and recoverable.",
    keywords: ["restaurant data backup", "POS data security"],
    category: "Technical"
  },
  {
    id: 21,
    question: "Can I use BillByteKOT for food trucks?",
    answer: "Yes, BillByteKOT is perfect for food trucks with mobile billing, offline mode, battery-efficient operation, and compact thermal printing. Manage your mobile restaurant business efficiently anywhere.",
    keywords: ["food truck POS", "mobile restaurant billing"],
    category: "General"
  },
  {
    id: 22,
    question: "Does BillByteKOT work on tablets and phones?",
    answer: "Yes, BillByteKOT is fully responsive and works on tablets, phones, and computers. The mobile-optimized interface ensures smooth operation on any device size for maximum flexibility.",
    keywords: ["mobile restaurant POS", "tablet billing software"],
    category: "Technical"
  },
  {
    id: 23,
    question: "How to setup loyalty program in restaurant software?",
    answer: "BillByteKOT includes built-in loyalty program features. Set point values, reward tiers, automatic discounts, and customer tracking to increase repeat business and customer retention.",
    keywords: ["restaurant loyalty program", "customer rewards software"],
    category: "Features"
  },
  {
    id: 24,
    question: "Can I integrate BillByteKOT with accounting software?",
    answer: "Yes, BillByteKOT integrates with popular accounting software like Tally, QuickBooks, and others. Export sales data, tax reports, and financial summaries for seamless accounting workflow.",
    keywords: ["restaurant accounting integration", "Tally integration POS"],
    category: "Technical"
  },
  {
    id: 25,
    question: "What support does BillByteKOT provide?",
    answer: "BillByteKOT offers 24/7 customer support via phone, WhatsApp, and email. Free setup assistance, training videos, user manual, and dedicated support team ensure smooth restaurant operations.",
    keywords: ["restaurant software support", "POS customer service"],
    category: "General"
  }
];

export default faqData;