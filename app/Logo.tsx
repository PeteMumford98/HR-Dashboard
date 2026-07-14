// Cartwright wordmark. Rendered as a CSS mask so the single blue SVG in
// /public recolours per context (cream on the dark topbar, blue on the
// light login and share pages). See .logo in globals.css.
export default function Logo({ className = "" }: { className?: string }) {
  return <span className={`logo ${className}`.trim()} role="img" aria-label="Cartwright" />;
}
