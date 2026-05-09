import { Outlet } from 'react-router-dom'
import SideNav from '@/components/SideNav'
import TopNav from '@/components/TopNav'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.10),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(244,63,94,0.10),transparent_50%),radial-gradient(circle_at_60%_90%,rgba(168,85,247,0.10),transparent_55%)]" />
      <TopNav />
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-4 pb-10 pt-6">
        <aside className="col-span-12 md:col-span-3">
          <SideNav />
        </aside>
        <main className="col-span-12 md:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

