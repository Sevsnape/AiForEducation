type Props = {
  size?: 'sm' | 'lg'
  subtitle?: string
}

export function BrandMark({ size = 'sm', subtitle }: Props) {
  return (
    <div className={`brand-mark brand-mark--${size}`}>
      <div className="brand-mark__glyph" aria-hidden>
        <span />
        <span />
      </div>
      <div>
        <div className="brand" style={{ fontSize: size === 'lg' ? 'clamp(2.2rem, 5vw, 3rem)' : '1.15rem' }}>
          AIFOREC
        </div>
        {subtitle ? <div className="brand-mark__sub">{subtitle}</div> : null}
      </div>
    </div>
  )
}
