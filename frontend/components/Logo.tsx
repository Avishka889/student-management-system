export default function Logo({
  size = 36,
  variant = "light",
}: {
  size?: number;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="EduTrack logo" role="img">
      <rect width="40" height="40" rx="10" fill={isDark ? "#1E3A8A" : "#fff"} />
      <polygon points="20,5 28,9 20,13 12,9" fill="#3B82F6" />
      <path d="M8 29 V16 Q14 14 20 17 V30 Q14 27 8 29 Z" fill={isDark ? "#fff" : "#1E3A8A"} />
      <path d="M32 29 V16 Q26 14 20 17 V30 Q26 27 32 29 Z" fill={isDark ? "#BFDBFE" : "#60A5FA"} />
    </svg>
  );
}