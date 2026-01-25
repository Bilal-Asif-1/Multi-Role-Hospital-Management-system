import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Stethoscope,
  Users,
  Calendar,
  FileText,
  Shield,
  Clock,
  Heart,
  Activity,
  ArrowRight,
  Menu,
  X,
  CheckCircle,
  Star,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'
import TestimonialsCarousel from './components/TestimonialsCarousel'
import Footer from './components/Footer'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const features = [
    {
      icon: Calendar,
      title: 'Easy Appointments',
      description: 'Book appointments with your preferred doctors in just a few clicks.',
    },
    {
      icon: FileText,
      title: 'Digital Records',
      description: 'Access your complete medical history and records anytime, anywhere.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with industry-leading security.',
    },
    {
      icon: Clock,
      title: '24/7 Access',
      description: 'Manage your health records and appointments round the clock.',
    },
    {
      icon: Heart,
      title: 'Health Monitoring',
      description: 'Track your vitals and health metrics with our advanced tools.',
    },
    {
      icon: Activity,
      title: 'Real-time Updates',
      description: 'Get instant notifications about appointments, prescriptions, and reports.',
    },
  ]

  const services = [
    {
      title: 'Patient Management',
      description: 'Comprehensive patient registration and profile management system.',
      icon: Users,
    },
    {
      title: 'Appointment Scheduling',
      description: 'Efficient appointment booking system with doctor availability tracking.',
      icon: Calendar,
    },
    {
      title: 'Medical Records',
      description: 'Digital storage and management of all medical documents and history.',
      icon: FileText,
    },
    {
      title: 'Bed Management',
      description: 'Real-time room and bed allocation with status tracking.',
      icon: Activity,
    },
    {
      title: 'Prescription Management',
      description: 'Digital prescriptions with medication tracking and reminders.',
      icon: Heart,
    },
    {
      title: 'Billing & Invoices',
      description: 'Automated billing system with invoice generation and payment tracking.',
      icon: Shield,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">IHIS</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-white font-semibold hover:text-gray-300">
                Home
              </Link>
              <Link to="/about" className="text-gray-300 hover:text-white font-semibold">
                About
              </Link>
              <Link to="/faqs" className="text-gray-300 hover:text-white font-semibold">
                FAQs
              </Link>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white font-semibold"
              >
                Login
              </Link>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-white text-black rounded-md font-bold hover:bg-gray-100 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <div className="px-4 py-4 space-y-4">
              <Link
                to="/"
                className="block text-white font-semibold hover:text-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="block text-gray-300 hover:text-white font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/faqs"
                className="block text-gray-300 hover:text-white font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQs
              </Link>
              <Link
                to="/login"
                className="block text-gray-300 hover:text-white font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <button
                onClick={() => {
                  navigate('/register')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-4 py-2 bg-white text-black rounded-md font-bold hover:bg-gray-100"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Advanced Hospital
                <span className="text-black block">Information System</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Streamline your healthcare operations with our comprehensive digital platform.
                Manage patients, appointments, records, and more with ease and efficiency.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-900 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 border-2 border-black text-black rounded-lg font-bold text-lg hover:bg-gray-100 transition-all"
                >
                  Login
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <Users className="h-8 w-8 text-black mb-2" />
                    <p className="text-2xl font-bold text-black">10K+</p>
                    <p className="text-sm text-gray-600">Patients</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <Stethoscope className="h-8 w-8 text-black mb-2" />
                    <p className="text-2xl font-bold text-black">500+</p>
                    <p className="text-sm text-gray-600">Doctors</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <Calendar className="h-8 w-8 text-black mb-2" />
                    <p className="text-2xl font-bold text-black">50K+</p>
                    <p className="text-sm text-gray-600">Appointments</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <Activity className="h-8 w-8 text-black mb-2" />
                    <p className="text-2xl font-bold text-black">99%</p>
                    <p className="text-sm text-gray-600">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of healthcare management with our advanced features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-xl transition-all transform hover:-translate-y-2"
                >
                  <div className="bg-black rounded-lg p-3 w-fit mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your healthcare facility efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="bg-gradient-to-br from-black to-gray-800 rounded-lg p-4 w-fit mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-black mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trusted by healthcare professionals and patients worldwide
            </p>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Ready to Transform Your Healthcare Management?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of healthcare providers using our system to deliver better care
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-white text-black rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}


