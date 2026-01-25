import { Link } from 'react-router-dom'
import { Stethoscope, Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'FAQs', path: '/faqs' },
    { name: 'Contact', path: '/contact' },
  ]

  const services = [
    { name: 'Patient Management', path: '#' },
    { name: 'Appointment Booking', path: '#' },
    { name: 'Medical Records', path: '#' },
    { name: 'Bed Management', path: '#' },
  ]

  const resources = [
    { name: 'Documentation', path: '#' },
    { name: 'Support Center', path: '#' },
    { name: 'Privacy Policy', path: '#' },
    { name: 'Terms of Service', path: '#' },
  ]

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Stethoscope className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">IHIS</span>
            </div>
            <p className="text-gray-400 mb-4">
              Advanced Hospital Information System - Streamlining healthcare management
              for better patient care and operational efficiency.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Services</h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <a
                    href={service.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">+92 300 1234567</span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">info@ihis.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">
                  Healthcare District, Karachi, Pakistan
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} IHIS. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {resources.map((resource) => (
                <a
                  key={resource.name}
                  href={resource.path}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  {resource.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


