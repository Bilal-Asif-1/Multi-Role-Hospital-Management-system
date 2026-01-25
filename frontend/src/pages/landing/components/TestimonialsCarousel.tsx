import { Star } from 'lucide-react'

interface Testimonial {
  id: number
  name: string
  role: string
  image: string
  rating: number
  text: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Dr. Sarah Ahmed',
    role: 'Chief Medical Officer',
    image: '👩‍⚕️',
    rating: 5,
    text: 'This system has revolutionized how we manage our hospital operations. The patient management features are exceptional, and the appointment scheduling is seamless.',
  },
  {
    id: 2,
    name: 'Dr. Muhammad Hassan',
    role: 'Senior Physician',
    image: '👨‍⚕️',
    rating: 5,
    text: 'The digital records system has made it so much easier to access patient history. It saves us hours every day and improves patient care significantly.',
  },
  {
    id: 3,
    name: 'Nurse Fatima Ali',
    role: 'Head Nurse',
    image: '👩‍⚕️',
    rating: 5,
    text: 'The bed management system is incredibly efficient. We can now track room availability in real-time, which helps us serve patients better.',
  },
  {
    id: 4,
    name: 'Ahmed Khan',
    role: 'Patient',
    image: '👤',
    rating: 5,
    text: 'As a patient, I love how easy it is to book appointments and access my medical records. The system is user-friendly and saves me a lot of time.',
  },
]

export default function TestimonialsCarousel() {
  // Show only first 4 testimonials
  const displayedTestimonials = testimonials.slice(0, 4)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayedTestimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex flex-col"
        >
          {/* Stars - Black color */}
          <div className="flex items-center mb-3">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="h-4 w-4 text-black fill-black" />
            ))}
          </div>

          {/* Testimonial Text */}
          <p className="text-sm text-gray-700 mb-4 italic leading-relaxed flex-grow">
            "{testimonial.text}"
          </p>

          {/* Author Info */}
          <div className="flex items-center space-x-3 pt-4 border-t-2 border-gray-200">
            <div className="text-3xl">{testimonial.image}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-black text-sm truncate">{testimonial.name}</p>
              <p className="text-gray-600 text-xs">{testimonial.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
