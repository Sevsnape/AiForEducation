export function PrivateBadge({ label = '仅你可见' }: { label?: string }) {
  return (
    <span className="badge-private" title="支持侧内容默认不对老师开放">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 11V9a6 6 0 1 1 12 0v2M5 11h14v10H5V11Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  )
}
