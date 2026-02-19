export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[min(450px,50vw)] w-[min(900px,100vw)] px-4 sm:px-6">
      {children}
    </div>
  );
}
