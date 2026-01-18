// app/privacy-policy/page.tsx
import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, UserCheck, Mail, Globe, ChevronRight } from 'lucide-react';

const PrivacyPolicy = () => {
  const lastUpdated = "October 15, 2023";

  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: <Database className="h-5 w-5" />,
      content: `We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This may include:
      - Personal information (name, email address, etc.)
      - Account credentials
      - Content you create or share on Joyjuncture
      - Communications with our support team`
    },
    {
      id: 'usage-data',
      title: 'Usage Data',
      icon: <Eye className="h-5 w-5" />,
      content: `We automatically collect certain information about your device and how you interact with Joyjuncture:
      - Device information (type, operating system, browser)
      - Log data (IP address, access times, pages viewed)
      - Usage patterns and preferences
      - Cookies and similar tracking technologies`
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Information',
      icon: <Globe className="h-5 w-5" />,
      content: `We use the collected information to:
      - Provide, maintain, and improve our services
      - Personalize your experience
      - Communicate with you about updates, security alerts, and support messages
      - Detect, prevent, and address technical issues
      - Comply with legal obligations`
    },
    {
      id: 'data-sharing',
      title: 'Information Sharing',
      icon: <UserCheck className="h-5 w-5" />,
      content: `We do not sell your personal information. We may share information in these circumstances:
      - With your consent
      - With service providers who assist our operations
      - For legal compliance or to protect rights
      - During business transfers (merger, acquisition, or sale)`
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: <Lock className="h-5 w-5" />,
      content: `We implement appropriate technical and organizational measures to protect your personal information:
      - Encryption of data in transit and at rest
      - Regular security assessments
      - Access controls and authentication
      - Employee training on data protection
      However, no method of transmission over the Internet is 100% secure.`
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      icon: <Shield className="h-5 w-5" />,
      content: `Depending on your location, you may have rights including:
      - Access to your personal information
      - Correction of inaccurate data
      - Deletion of your data
      - Restriction or objection to processing
      - Data portability
      To exercise these rights, contact us at privacy@joyjuncture.com`
    },
    {
      id: 'cookies',
      title: 'Cookies & Tracking',
      icon: <Eye className="h-5 w-5" />,
      content: `We use cookies and similar technologies to:
      - Authenticate users and maintain sessions
      - Remember preferences and settings
      - Analyze site traffic and usage patterns
      - Deliver personalized content
      You can control cookies through your browser settings.`
    },
    {
      id: 'children',
      title: "Children's Privacy",
      icon: <UserCheck className="h-5 w-5" />,
      content: `Joyjuncture is not directed to individuals under 16. We do not knowingly collect personal information from children under 16. If we become aware that a child under 16 has provided us with personal information, we will take steps to delete such information.`
    },
    {
      id: 'changes',
      title: 'Policy Changes',
      icon: <Mail className="h-5 w-5" />,
      content: `We may update this privacy policy periodically. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy regularly.`
    }
  ];

  return (
    <div className="min-h-screen bg-black text-gray-300 font-sans">
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-6 ring-1 ring-orange-500/20">
            <Shield className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-tight">Privacy Policy</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            At Joyjuncture, we are committed to protecting your privacy and being transparent about how we handle your personal information.
          </p>
          <div className="mt-8 inline-flex items-center bg-neutral-900 border border-neutral-800 text-gray-400 px-5 py-2.5 rounded-full shadow-sm">
            <span className="text-sm font-medium">Last Updated:</span>
            <span className="ml-2 font-semibold text-orange-400">{lastUpdated}</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Table of Contents */}
          <div className="lg:w-1/4">
            <div className="sticky top-28 bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center border-b border-neutral-800 pb-4">
                <ChevronRight className="h-5 w-5 mr-2 text-orange-500" />
                Contents
              </h2>
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex items-center text-sm font-medium text-gray-400 hover:text-white py-3 px-4 rounded-xl hover:bg-neutral-800/80 transition-all group"
                    >
                      <span className="mr-3 text-orange-500/70 group-hover:text-orange-500 transition-colors">{section.icon}</span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-neutral-800">
                <h3 className="font-semibold text-white mb-2 text-sm uppercase tracking-wider">Need Help?</h3>
                <p className="text-sm text-gray-500">
                  Email us directly at:<br />
                  <a href="mailto:privacy@joyjuncture.com" className="text-orange-500 hover:text-orange-400 transition-colors font-medium mt-1 inline-block">privacy@joyjuncture.com</a>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl shadow-black/40">
              {/* Introduction */}
              <div className="p-10 border-b border-neutral-800 bg-neutral-900/50">
                <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
                <div className="prose prose-invert max-w-none text-gray-400">
                  <p className="mb-4">
                    This Privacy Policy describes how Joyjuncture ("we", "us", or "our") collects, uses, and shares your personal information when you use our platform, services, and applications.
                  </p>
                  <p>
                    By using Joyjuncture, you agree to the collection and use of information in accordance with this policy. We are committed to protecting your privacy and ensuring you have a positive experience on our platform.
                  </p>
                </div>
              </div>

              {/* Policy Sections */}
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={`p-10 ${index !== sections.length - 1 ? 'border-b border-neutral-800' : ''} hover:bg-neutral-800/20 transition-colors`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-6 mt-1 hidden sm:block">
                      <div className="h-12 w-12 bg-neutral-800 rounded-xl flex items-center justify-center border border-neutral-700 text-orange-500">
                        {section.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center mb-4 sm:hidden">
                        <div className="mr-3 text-orange-500">
                          {section.icon}
                        </div>
                        <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-4 hidden sm:block">{section.title}</h2>

                      <div className="prose prose-invert prose-orange max-w-none">
                        <div className="whitespace-pre-line text-gray-400 leading-relaxed">
                          {section.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))}

              {/* Contact Section */}
              <div className="p-10 bg-gradient-to-br from-neutral-900 to-neutral-950 border-t border-neutral-800">
                <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
                <p className="text-gray-400 mb-8">
                  If you have any questions or concerns about this Privacy Policy or our data practices, please contact our Data Protection Officer:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-neutral-800/50 rounded-2xl p-6 border border-neutral-700/50 hover:border-orange-500/30 transition-colors">
                    <h3 className="font-semibold text-white mb-2 flex items-center"><Mail className="w-4 h-4 mr-2 text-orange-500" /> Email</h3>
                    <a href="mailto:privacy@joyjuncture.com" className="text-orange-400 hover:text-orange-300 transition-colors">
                      privacy@joyjuncture.com
                    </a>
                  </div>
                  <div className="bg-neutral-800/50 rounded-2xl p-6 border border-neutral-700/50 hover:border-orange-500/30 transition-colors">
                    <h3 className="font-semibold text-white mb-2 flex items-center"><Globe className="w-4 h-4 mr-2 text-orange-500" /> Mail</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Joyjuncture Inc.<br />
                      Attn: Privacy Team<br />
                      123 Privacy Lane<br />
                      San Francisco, CA 94107
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {/* <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/terms"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-orange-500/40 hover:bg-neutral-800 transition-all text-center group"
              >
                <h3 className="font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Terms of Service</h3>
                <p className="text-sm text-gray-500">Read our terms and conditions</p>
              </Link>
              <Link
                href="/data-request"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-orange-500/40 hover:bg-neutral-800 transition-all text-center group"
              >
                <h3 className="font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Data Request</h3>
                <p className="text-sm text-gray-500">Submit data access/deletion request</p>
              </Link>
              <Link
                href="/cookie-preferences"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-orange-500/40 hover:bg-neutral-800 transition-all text-center group"
              >
                <h3 className="font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">Cookie Preferences</h3>
                <p className="text-sm text-gray-500">Manage your cookie settings</p>
              </Link>
            </div> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;