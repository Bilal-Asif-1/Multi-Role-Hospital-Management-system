import { Link, useNavigate } from 'react-router-dom'
import { Stethoscope, Users, Target, Award, Heart, Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Footer from './components/Footer'

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const values = [
    {
      icon: Heart,
      title: 'Patient-Centered Care',
      description: 'We prioritize patient well-being and satisfaction in everything we do.',
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Your data security and privacy are our top priorities.',
    },
    {
      icon: Target,
      title: 'Innovation',
      description: 'Continuously improving and innovating to serve you better.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering excellence in healthcare management.',
    },
  ]

  const stats = [
    { number: '10,000+', label: 'Active Patients' },
    { number: '500+', label: 'Healthcare Professionals' },
    { number: '50,000+', label: 'Appointments Managed' },
    { number: '99%', label: 'Satisfaction Rate' },
  ]

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
              <Link to="/about" className="text-black font-semibold">
                About
              </Link>
              <Link to="/faqs" className="text-gray-600 hover:text-black font-semibold">
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
              <Link to="/about" className="block text-black font-semibold">
                About
              </Link>
              <Link to="/faqs" className="block text-gray-600 hover:text-black font-semibold">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              About IHIS
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transforming healthcare management through innovative technology and
              patient-centered solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                To revolutionize healthcare management by providing comprehensive,
                secure, and user-friendly digital solutions that enhance patient care
                and streamline hospital operations.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We believe that technology should empower healthcare providers to focus
                on what matters most - delivering exceptional patient care.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8">
              <Stethoscope className="h-24 w-24 text-black mx-auto mb-6" />
              <div className="text-center">
                <p className="text-3xl font-bold text-black mb-2">Since 2020</p>
                <p className="text-gray-700">Serving Healthcare Providers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-extrabold text-black mb-2">{stat.number}</p>
                <p className="text-gray-600 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-xl transition-all"
                >
                  <div className="bg-black rounded-lg p-3 w-fit mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Dedicated professionals committed to improving healthcare
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-12 w-12 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Development Team</h3>
              <p className="text-gray-600">
                Expert developers building cutting-edge healthcare solutions
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Stethoscope className="h-12 w-12 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Healthcare Advisors</h3>
              <p className="text-gray-600">
                Medical professionals ensuring our solutions meet real-world needs
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-12 w-12 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Support Team</h3>
              <p className="text-gray-600">
                24/7 support to ensure your system runs smoothly
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}


