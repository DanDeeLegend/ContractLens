export default function LoadingState() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-elevated" style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}
