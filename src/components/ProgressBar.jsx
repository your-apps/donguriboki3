export default function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div
      className="w-full h-3 rounded-full overflow-hidden"
      style={{ background: 'var(--or100)' }}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${current}/${total}問`}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, var(--or300), var(--or500))',
        }}
      />
    </div>
  );
}
