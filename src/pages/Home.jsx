import { Link } from 'react-router-dom'

const CalendarIcon = () => (
  <svg className="h-10 w-10 text-cobalt-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
  </svg>
)

const ShareIcon = () => (
  <svg className="h-10 w-10 text-cobalt-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="h-10 w-10 text-cobalt-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
)

const steps = [
  {
    title: 'Create a Room',
    description: 'Set up your study room with availability windows and session duration.',
    icon: CalendarIcon,
  },
  {
    title: 'Share Your Link',
    description: 'Send the room link to your study group. No sign-ups required.',
    icon: ShareIcon,
  },
  {
    title: 'Study Together',
    description: 'Members book sessions in their own timezone. Everyone sees who booked what.',
    icon: UsersIcon,
  },
]

const features = [
  {
    title: 'Automatic timezone conversion',
    description: 'Times display in each viewer\'s local timezone automatically.',
  },
  {
    title: 'Real-time updates',
    description: 'See bookings appear live as others book their sessions.',
  },
  {
    title: 'No login required',
    description: 'Just create, share, and book. No accounts or passwords.',
  },
  {
    title: 'Flexible scheduling',
    description: 'Custom session durations, split or full-day availability windows.',
  },
  {
    title: 'Add to Calendar',
    description: 'One-click .ics download for Google Calendar, Apple Calendar, or Outlook.',
  },
  {
    title: 'Admin dashboard',
    description: 'PIN-protected view to manage bookings and see contact details.',
  },
]

const Home = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cobalt-50/80 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-cobalt-100/40 blur-3xl" />
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Schedule Co-Study Sessions,
            <br />
            <span className="text-cobalt-600">Together</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Create a room, share the link, and let your study group book focused sessions in
            their own timezone. No accounts needed.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/create"
              className="inline-block rounded-lg bg-cobalt-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-cobalt-500/25 hover:bg-cobalt-700"
            >
              Create a Room
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">How It Works</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="relative rounded-xl bg-white p-8 text-center shadow-sm">
              <div className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-cobalt-600 text-xs font-bold text-white">
                {i + 1}
              </div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cobalt-50">
                <step.icon />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Connecting arrows (desktop only) */}
        <div className="mt-4 hidden items-center justify-center gap-2 md:flex">
          <div className="h-0.5 w-16 bg-cobalt-200" />
          <svg className="h-4 w-4 text-cobalt-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414L14.586 11H3a1 1 0 1 1 0-2h11.586l-4.293-4.293a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
          </svg>
          <div className="h-0.5 w-16 bg-cobalt-200" />
          <svg className="h-4 w-4 text-cobalt-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414L14.586 11H3a1 1 0 1 1 0-2h11.586l-4.293-4.293a1 1 0 0 1 0-1.414Z" clipRule="evenodd" />
          </svg>
          <div className="h-0.5 w-16 bg-cobalt-200" />
        </div>
      </section>

      {/* Features grid */}
      <section className="py-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Why Co-Study?</h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <div className="mx-auto max-w-xl rounded-2xl bg-cobalt-600 px-8 py-10 shadow-xl shadow-cobalt-500/20">
          <h2 className="text-2xl font-bold text-white">Ready to study together?</h2>
          <p className="mt-2 text-cobalt-100">
            Set up your room in under a minute. No sign-up needed.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 text-lg font-semibold text-cobalt-600 hover:bg-cobalt-50"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
