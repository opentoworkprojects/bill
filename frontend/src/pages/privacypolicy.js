import Layout from "../components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const PrivacyPolicyPage = ({ user }) => {
  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="privacy-policy-page">
        <div>
          <h1
            className="text-4xl font-bold"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Privacy Policy
          </h1>
          <p className="text-gray-600 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-semibold text-lg">1. Introduction</h2>
              <p>
                This Privacy Policy explains how we collect, store, use, and
                safeguard your data when using our application. By accessing or
                using this platform, you agree to the terms outlined in this
                policy.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg">
                2. Information We Collect
              </h2>
              <ul className="list-disc ml-6">
                <li>Personal information (name, email, contact)</li>
                <li>Business or billing-related information</li>
                <li>Device or usage analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg">3. How We Use Data</h2>
              <p>We use collected information to:</p>
              <ul className="list-disc ml-6">
                <li>Provide and improve application features</li>
                <li>Generate analytics and reports</li>
                <li>Enhance customer support and security</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg">
                4. Sharing of Information
              </h2>
              <p>
                We do <strong>not sell or rent</strong> your personal data to
                third parties. Information may be shared only with trusted
                services for secure hosting, analytics, or compliance with legal
                requirements.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg">
                5. Data Storage & Security
              </h2>
              <p>
                We implement modern encryption and secure data storage. Despite
                best efforts, no system is 100% secure; use the application
                responsibly.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg">6. Your Rights</h2>
              <ul className="list-disc ml-6">
                <li>Request access or update personal data</li>
                <li>Request deletion where applicable</li>
                <li>Withdraw consent for non-essential processing</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-lg">
                7. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy to reflect product
                improvements or legal changes. Continued use of the app
                acknowledges acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-lg">8. Contact Us</h2>
              <p>
                If you have questions or concerns, contact support at:
                <br />
                <span className="font-semibold">support@yourbusiness.com</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
