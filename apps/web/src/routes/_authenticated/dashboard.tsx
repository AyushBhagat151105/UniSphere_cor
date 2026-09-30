import { createFileRoute } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="container mx-auto p-4 py-10">
      <header className="mb-8 border-b-2 border-border pb-6">
        <h1 className="text-4xl font-display font-black tracking-tight text-primary">Dashboard</h1>
        <p className="mt-2 text-foreground/70 font-medium">
          Welcome back, {user?.email || 'Student'}!
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[6px] border-2 border-border bg-card text-card-foreground shadow-none p-6">
          <h3 className="font-display font-bold tracking-tight text-xl text-foreground">Your Role</h3>
          <p className="text-2xl mt-4 font-black text-primary bg-accent/20 px-3 py-1 rounded-sm inline-block">{user?.role || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}