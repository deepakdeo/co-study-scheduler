import { useState } from 'react'

const AdminPinForm = ({ onVerify }) => {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pin) {
      setError('Please enter the admin PIN')
      return
    }
    onVerify(pin, (err) => setError(err))
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-center text-xl font-bold text-gray-900">Admin Access</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Admin PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(null)
            }}
            placeholder="Enter your PIN"
            maxLength={6}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-widest text-gray-900 focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/20 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-cobalt-600 py-2.5 font-semibold text-white hover:bg-cobalt-700"
        >
          Enter
        </button>
      </form>
    </div>
  )
}

export default AdminPinForm
