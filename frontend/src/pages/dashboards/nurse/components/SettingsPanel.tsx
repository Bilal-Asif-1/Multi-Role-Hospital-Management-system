export default function SettingsPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
            <p className="text-gray-600">Profile settings interface would go here</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shift Availability</h3>
            <p className="text-gray-600">Shift availability settings would go here</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Credentials</h3>
            <p className="text-gray-600">Password and security settings would go here</p>
          </div>
        </div>
      </div>
    </div>
  )
}



