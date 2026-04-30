import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Mail, Phone } from "lucide-react";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-violet-600" />
              <span className="text-xl font-bold text-gray-900">Privacy Policy</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-violet-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">
              Last Updated: December 11, 2024
            </p>
          </div>

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              At BillByteKOT ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our restaurant billing and management application.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using BillByteKOT, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
            </div>

            <div className="ml-9 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1.1 Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Account Information:</strong> Name, email address, phone number, business name, and password</li>
                  <li><strong>Business Information:</strong> Restaurant details, menu items, pricing, inventory data</li>
                  <li><strong>Customer Information:</strong> Customer names, phone numbers, order history (that you input)</li>
                  <li><strong>Payment Information:</strong> Payment transaction details (processed securely through Razorpay)</li>
                  <li><strong>Communication Data:</strong> Messages you send through our contact forms or support channels</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">1.2 Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the application</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, device type, IP address</li>
                  <li><strong>Analytics Data:</strong> Aggregated usage statistics via Google Analytics</li>
                  <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700 mb-3">We use the collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve our billing and management services</li>
                <li><strong>Account Management:</strong> To create and manage your account, authenticate users</li>
                <li><strong>Transaction Processing:</strong> To process payments and generate invoices</li>
                <li><strong>Customer Support:</strong> To respond to your inquiries and provide technical support</li>
                <li><strong>Analytics:</strong> To understand how users interact with our application and improve user experience</li>
                <li><strong>Communication:</strong> To send important updates, security alerts, and subscription information</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
                <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems</li>
              </ul>
            </div>
          </section>

          {/* Data Storage and Security */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. Data Storage and Security</h2>
            </div>

            <div className="ml-9 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Data Storage</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Your data is stored securely on MongoDB Atlas cloud servers</li>
                  <li>Data is encrypted in transit using SSL/TLS protocols</li>
                  <li>Database backups are performed automatically every 24 hours</li>
                  <li>Data is stored in secure data centers with 99.9% uptime</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.2 Security Measures</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Encryption:</strong> All passwords are hashed using industry-standard bcrypt</li>
                  <li><strong>Authentication:</strong> JWT (JSON Web Tokens) for secure session management</li>
                  <li><strong>Access Control:</strong> Role-based access control (RBAC) for staff members</li>
                  <li><strong>Data Isolation:</strong> Each restaurant's data is completely isolated from others</li>
                  <li><strong>Regular Updates:</strong> Security patches and updates applied regularly</li>
                  <li><strong>Monitoring:</strong> 24/7 security monitoring and threat detection</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> While we implement robust security measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but continuously work to protect your data.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sharing and Disclosure */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">4. Data Sharing and Disclosure</h2>
            </div>

            <div className="ml-9 space-y-4">
              <p className="text-gray-700">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.1 Service Providers</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Razorpay:</strong> Payment processing (they have their own privacy policy)</li>
                  <li><strong>MongoDB Atlas:</strong> Database hosting and management</li>
                  <li><strong>Google Analytics:</strong> Usage analytics (anonymized data)</li>
                  <li><strong>Render.com:</strong> Application hosting</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.2 Legal Requirements</h3>
                <p className="text-gray-700">
                  We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
                  <li>Comply with legal obligations</li>
                  <li>Protect our rights, property, or safety</li>
                  <li>Prevent fraud or security issues</li>
                  <li>Protect the rights and safety of our users</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">4.3 Business Transfers</h3>
                <p className="text-gray-700">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your information is transferred and becomes subject to a different privacy policy.
                </p>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">5. Your Rights and Choices</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700 mb-3">You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in CSV/PDF format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Request limitation of data processing</li>
                <li><strong>Portability:</strong> Transfer your data to another service</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700">
                  <strong>To exercise your rights:</strong> Contact us at{" "}
                  <a href="mailto:support@billbytekot.in" className="text-blue-600 hover:underline">
                    support@billbytekot.in
                  </a>
                  {" "}or use the settings page in your account.
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">6. Data Retention</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700 mb-3">We retain your information for as long as necessary to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Provide our services to you</li>
                <li>Comply with legal obligations (e.g., tax records for 7 years)</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain business records</li>
              </ul>

              <p className="text-gray-700 mt-4">
                <strong>Account Deletion:</strong> When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">7. Cookies and Tracking</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700 mb-3">We use cookies and similar tracking technologies to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
                <li><strong>Analytics Cookies:</strong> Google Analytics to understand usage patterns</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>

              <p className="text-gray-700 mt-4">
                You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of our application.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">8. Children's Privacy</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700">
                BillByteKOT is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will delete it.
              </p>
            </div>
          </section>

          {/* International Users */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">9. International Data Transfers</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and that your data receives adequate protection.
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">10. Changes to This Privacy Policy</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700 mb-3">
                We may update this Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification for significant changes</li>
                <li>Displaying an in-app notification</li>
              </ul>

              <p className="text-gray-700 mt-4">
                Your continued use of BillByteKOT after changes are posted constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">11. Contact Us</h2>
            </div>

            <div className="ml-9">
              <p className="text-gray-700 mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>

              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href="mailto:support@billbytekot.in" className="text-violet-600 font-semibold hover:underline">
                      support@billbytekot.in
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <a href="mailto:contact@billbytekot.in" className="text-violet-600 font-semibold hover:underline">
                      contact@billbytekot.in
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a href="https://billbytekot.in" className="text-violet-600 font-semibold hover:underline">
                      https://billbytekot.in
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="text-gray-900 font-semibold">BillByteKOT</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                We will respond to your inquiry within 48 hours during business days.
              </p>
            </div>
          </section>

          {/* Summary */}
          <section className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Privacy Policy Summary</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ We collect only necessary information to provide our services</li>
              <li>✅ Your data is encrypted and stored securely</li>
              <li>✅ We never sell your personal information to third parties</li>
              <li>✅ You have full control over your data (access, edit, delete)</li>
              <li>✅ We comply with data protection laws and regulations</li>
              <li>✅ You can contact us anytime with privacy concerns</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              By using BillByteKOT, you acknowledge that you have read and understood this Privacy Policy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
              <Button
                onClick={() => navigate("/contact")}
                className="bg-gradient-to-r from-violet-600 to-purple-600"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
