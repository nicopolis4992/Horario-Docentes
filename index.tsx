import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './store';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  CalendarDays,
  Menu,
  X,
  ListTodo,
  Upload,
  Download
} from 'lucide-react';

// Modular Components
import DashboardView from './src/components/Dashboard/DashboardView';
import OfferPlannerView from './src/components/OfferPlanner/OfferPlannerView';
import ScheduleView from './src/components/Schedule/ScheduleView';
import TeachersView from './src/components/Teachers/TeachersView';
import SubjectsView from './src/components/Subjects/SubjectsView';
import ClassroomsView from './src/components/Classrooms/ClassroomsView';
import SidebarItem from './src/components/Layout/SidebarItem';
import ImportDataView from './src/components/ImportExport/ImportDataView';
import ExportView from './src/components/ImportExport/ExportView';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper to close sidebar on mobile after clicking a link
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <CalendarDays className="text-blue-600" />
              <span>UniScheduler</span>
            </h1>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-2">
              Principal
            </div>
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              to="/dashboard"
              onClick={closeSidebar}
            />
            <SidebarItem
              icon={ListTodo}
              label="Oferta Académica"
              to="/offer-planning"
              onClick={closeSidebar}
            />
            <SidebarItem
              icon={CalendarDays}
              label="Planificador"
              to="/schedule"
              onClick={closeSidebar}
            />

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">
              Gestión
            </div>
            <SidebarItem
              icon={Users}
              label="Docentes"
              to="/teachers"
              onClick={closeSidebar}
            />
            <SidebarItem
              icon={BookOpen}
              label="Materias"
              to="/subjects"
              onClick={closeSidebar}
            />
            <SidebarItem
              icon={School}
              label="Aulas"
              to="/classrooms"
              onClick={closeSidebar}
            />
            <SidebarItem
              icon={Upload}
              label="Importar Datos"
              to="/import"
              onClick={closeSidebar}
            />
            <SidebarItem
              icon={Download}
              label="Exportar Datos"
              to="/export"
              onClick={closeSidebar}
            />
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center space-x-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                AD
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Admin User</p>
                <p className="text-xs text-slate-500">Coordinador</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="bg-white border-b border-slate-200 lg:hidden p-4 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-700"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-700">UniScheduler</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto h-full relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/offer-planning" element={<OfferPlannerView />} />
            <Route path="/schedule" element={<ScheduleView />} />
            <Route path="/teachers" element={<TeachersView />} />
            <Route path="/subjects" element={<SubjectsView />} />
            <Route path="/classrooms" element={<ClassroomsView />} />
            <Route path="/import" element={<ImportDataView />} />
            <Route path="/export" element={<ExportView />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
      {/* Global Notification System */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
          }
        }}
      />
    </AppProvider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);