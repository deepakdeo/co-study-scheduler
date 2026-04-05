import { Link } from 'react-router-dom'

const steps = [
  {
    number: '1',
    title: 'Create a Room',
    description: 'Set up your study room with your availability windows and a meeting link.',
  },
  {
    number: '2',
    title: 'Share Your Link',
    description: 'Send the room link to your study group. No sign-ups required.',
  },
  {
    number: '3',
    title: 'Study Together',
    description: 'Members book sessions in their own timezone and get the meeting link.',
  },
]

const Home = () => {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 text-center sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Schedule Co-Study Sessions,
          <br />
          <span className="text-cobalt-600">Together</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Create a room, share the link, and let your study group book focused sessions in
          their own timezone. No accounts needed.
        </p>
        <div className="mt-8">
          <Link
            to="/create"
            className="inline-block rounded-lg bg-cobalt-600 px-8 py-3 text-lg font-semibold text-white hover:bg-cobalt-700"
          >
            Create a Room
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">How It Works</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="rounded-xl bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cobalt-100 text-xl font-bold text-cobalt-600">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Why Co-Study?</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 text-cobalt-600">&#10003;</span>
              <span>Times auto-convert to each viewer&apos;s local timezone</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-cobalt-600">&#10003;</span>
              <span>Real-time updates — see bookings appear live</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-cobalt-600">&#10003;</span>
              <span>No login required — just create, share, and book</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-cobalt-600">&#10003;</span>
              <span>Meeting links delivered privately via email</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default Home
