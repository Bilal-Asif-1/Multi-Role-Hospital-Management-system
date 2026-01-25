import { MessageCircle, Upload, Video, Send } from 'lucide-react'
import { useState } from 'react'

export default function SupportCommunication() {
  const [message, setMessage] = useState('')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Support & Communication</h2>

      {/* Secure Chat */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
          Secure Chat with Doctor
        </h3>
        <div className="space-y-4">
          <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 p-4 overflow-y-auto">
            <p className="text-sm text-gray-500 text-center py-8">
              Chat messages will appear here
            </p>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Reports/Photos */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2 text-green-500" />
          Upload Reports/Photos
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Choose Files
          </button>
          <p className="text-xs text-gray-500 mt-2">Supported: PDF, JPG, PNG (Max 10MB)</p>
        </div>
      </div>

      {/* Telemedicine Links */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Video className="h-5 w-5 mr-2 text-purple-500" />
          Telemedicine
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="font-semibold text-gray-900 mb-2">Video Consultation</p>
            <p className="text-sm text-gray-600 mb-3">
              Connect with your doctor via secure video call
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Start Video Call
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



