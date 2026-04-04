const WeekNavigator = ({ weekDates, onPrev, onNext, canGoPrev }) => {
  if (!weekDates || weekDates.length === 0) return null

  const startLabel = formatDateShort(weekDates[0])
  const endLabel = formatDateShort(weekDates[weekDates.length - 1])

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
      >
        &larr; Prev
      </button>
      <span className="text-sm font-medium text-gray-900">
        {startLabel} &ndash; {endLabel}
      </span>
      <button
        onClick={onNext}
        className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        Next &rarr;
      </button>
    </div>
  )
}

const formatDateShort = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default WeekNavigator
