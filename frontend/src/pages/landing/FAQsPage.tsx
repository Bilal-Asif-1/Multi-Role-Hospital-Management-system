import { Link, useNavigate } from 'react-router-dom'
import { Stethoscope, Menu, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import Footer from './components/Footer'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'What is IHIS?',
    answer:
      'IHIS (Integrated Hospital Information System) is a comprehensive digital platform designed to streamline healthcare management. It helps hospitals manage patients, appointments, medical records, bed allocation, prescriptions, and billing all in one place.',
  },
  {
    question: 'How do I register as a patient?',
    answer:
      'You can register as a patient by clicking the "Get Started" or "Register" button on our website. Fill in your personal information, create an account, and you\'ll be able to book appointments and access your medical records.',
  },
  {
    question: 'Is my medical data secure?',
    answer:
      'Yes, absolutely. We use industry-leading encryption and security measures to protect your data. All information is stored securely and only accessible to authorized healthcare providers. We comply with all healthcare data protection regulations.',
  },
  {
    question: 'How do I book an appointment?',
    answer:
      'Once you\'re logged in, navigate to the Appointments section. You can search for doctors by specialization, select an available date and time, and confirm your appointment. You\'ll receive a confirmation notification.',
  },
  {
    question: 'Can I access my medical records online?',
    answer:
      'Yes, registered patients can access their complete medical history, lab reports, prescriptions, and visit notes through their dashboard. All records are available 24/7 and can be downloaded or printed.',
  },
  {
    question: 'How does bed management work?',
    answer:
      'The system allows hospital administrators to manage room and bed availability in real-time. Beds can be assigned to patients, and the status is automatically updated. This helps optimize resource utilization and improve patient care.',
  },
  {
    question: 'What if I forget my password?',
    answer:
      'On the login page, click "Forgot Password" and enter your registered email address. You\'ll receive instructions to reset your password securely.',
  },
  {
    question: 'Can doctors access patient records?',
    answer:
      'Yes, authorized doctors can access patient records for patients they are treating or have appointments with. Access is logged and monitored to ensure patient privacy and security.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'Currently, IHIS is accessible through web browsers on all devices including smartphones and tablets. We are working on dedicated mobile apps for iOS and Android.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'You can contact our support team through the contact information provided in the footer, or use the support section in your dashboard if you\'re logged in. We offer 24/7 support for critical issues.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'The system supports various payment methods including credit/debit cards, bank transfers, and cash payments. Payment options may vary by healthcare facility.',
  },
  {
    question: 'Can I reschedule my appointment?',
    answer:
      'Yes, you can reschedule appointments through your dashboard. Simply go to your appointments, select the one you want to change, and choose a new date and time from available slots.',
  },
]

export default function FAQsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const navigate = useNavigate()

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-black" />
              <span className="text-2xl font-bold text-black">IHIS</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-black font-semibold">
                Home
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-black font-semibold">
                About
              </Link>
              <Link to="/faqs" className="text-black font-semibold">
                FAQs
              </Link>
              <Link to="/login" className="text-gray-600 hover:text-black font-semibold">
                Login
              </Link>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-black text-white rounded-md font-bold hover:bg-gray-900"
              >
                Get Started
              </button>
            </div>

            <button
              className="md:hidden text-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-4">
              <Link to="/" className="block text-gray-600 hover:text-black font-semibold">
                Home
              </Link>
              <Link to="/about" className="block text-gray-600 hover:text-black font-semibold">
                About
              </Link>
              <Link to="/faqs" className="block text-black font-semibold">
                FAQs
              </Link>
              <Link to="/login" className="block text-gray-600 hover:text-black font-semibold">
                Login
              </Link>
              <button
                onClick={() => navigate('/register')}
                className="w-full px-4 py-2 bg-black text-white rounded-md font-bold"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about IHIS
          </p>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-black text-lg">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-black flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-black flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-black mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Please contact our support team.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-900 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}


