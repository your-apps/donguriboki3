import kuruImg from '../assets/kuru.webp';
import tsumujiiImg from '../assets/tsumujii.webp';

export default function CharaBubble({ chara = 'kuru', text, side = 'left', className = '' }) {
  const img = chara === 'kuru' ? kuruImg : tsumujiiImg;
  const name = chara === 'kuru' ? 'クル' : 'ツム爺';
  const tailClass = side === 'left' ? 'bubble-tail-left' : 'bubble-tail-right';

  return (
    <div className={`flex items-end gap-2 ${side === 'right' ? 'flex-row-reverse' : ''} ${className}`}>
      <img
        src={img}
        alt={name}
        className="object-contain flex-shrink-0"
        style={{ width: 77, height: 77, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
      />
      <div className={`bubble ${tailClass} flex-1 text-sm leading-relaxed`}
        style={{ color: 'var(--br600)', marginBottom: '14px' }}>
        {text}
      </div>
    </div>
  );
}
