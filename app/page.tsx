import { Suspense } from "react";
import { connection } from "next/server";
import { isGitHubAuthEnabled } from "@/auth";
import { getCurrentUser, getUserLayouts } from "@/actions/layouts";
import { Navbar } from "@/components/Navbar";
import { StreamGrid } from "@/components/StreamGrid";
import { LiveChatSidebar } from "@/components/LiveChatSidebar";

async function AuthenticatedNavbar() {
  await connection();
  const [user, layoutsResult] = await Promise.all([
    getCurrentUser(),
    getUserLayouts(),
  ]);

  const initialLayouts = layoutsResult.success ? layoutsResult.data : [];

  return (
    <Navbar
      initialUser={user}
      initialLayouts={initialLayouts}
      githubAuthEnabled={isGitHubAuthEnabled}
    />
  );
}

export default function HomePage() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Top Control Bar wrapped in Suspense for Next.js Cache Components compatibility */}
      <Suspense fallback={<Navbar initialUser={null} initialLayouts={[]} />}>
        <AuthenticatedNavbar />
      </Suspense>

      {/* Main Theater Viewport: Dynamic Grid Engine + Collapsible Live Chat Sidebar */}
      <main className="flex min-h-0 w-full flex-1 overflow-hidden">
        <StreamGrid />
        <LiveChatSidebar />
      </main>
    </div>
  );
}
