import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Dashboard from '@/pages/Dashboard';
import Ledger from '@/pages/Ledger';
import Dispatch from '@/pages/Dispatch';
import Review from '@/pages/Review';
import Acceptance from '@/pages/Acceptance';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import { cn } from '@/lib/utils';

export default function App() {
  return (
    <Router>
      <div className={cn('min-h-screen bg-neutral-50')}>
        <Sidebar />
        <div className={cn('ml-60 flex flex-col min-h-screen')}>
          <Topbar />
          <main className={cn('flex-1 p-6')}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/dispatch" element={<Dispatch />} />
              <Route path="/review" element={<Review />} />
              <Route path="/acceptance" element={<Acceptance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
