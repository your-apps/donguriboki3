export default function HeartIcon({ empty = false, size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {empty ? (
        <path
          d="M12 20.5 C12 20.5 3 14 3 8.5 C3 5.5 5.5 3 8.5 3 C10 3 11.2 3.7 12 4.8 C12.8 3.7 14 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 14 12 20.5 12 20.5Z"
          fill="#D8CDB8"
          stroke="#B8A888"
          strokeWidth="0.8"
        />
      ) : (
        <>
          <path
            d="M12 20.5 C12 20.5 3 14 3 8.5 C3 5.5 5.5 3 8.5 3 C10 3 11.2 3.7 12 4.8 C12.8 3.7 14 3 15.5 3 C18.5 3 21 5.5 21 8.5 C21 14 12 20.5 12 20.5Z"
            fill="#E8863A"
            stroke="#C4621A"
            strokeWidth="0.8"
          />
          <ellipse cx="9" cy="7.5" rx="2" ry="1.3" fill="#F5A860" opacity=".55" transform="rotate(-20 9 7.5)"/>
        </>
      )}
    </svg>
  );
}
