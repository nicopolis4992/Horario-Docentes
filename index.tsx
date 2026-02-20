import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
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
} from 'lucide-react';

// Modular Components
import DashboardView from './src/components/Dashboard/DashboardView';
import OfferPlannerView from './src/components/OfferPlanner/OfferPlannerView';
import ScheduleView from './src/components/Schedule/ScheduleView';
import TeachersView from './src/components/Teachers/TeachersView';
import SubjectsView from './src/components/Subjects/SubjectsView';
import ClassroomsView from './src/components/Classrooms/ClassroomsView';
import SidebarItem from './src/components/Layout/SidebarItem';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
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
              onClick={() => setIsSidebarOpen(false)}
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
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <SidebarItem
              icon={ListTodo}
              label="Oferta Académica"
              active={activeTab === 'offer_planning'}
              onClick={() => setActiveTab('offer_planning')}
            />
            <SidebarItem
              icon={CalendarDays}
              label="Planificador"
              active={activeTab === 'schedule'}
              onClick={() => setActiveTab('schedule')}
            />

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">
              Gestión
            </div>
            <SidebarItem
              icon={Users}
              label="Docentes"
              active={activeTab === 'teachers'}
              onClick={() => setActiveTab('teachers')}
            />
            <SidebarItem
              icon={BookOpen}
              label="Materias"
              active={activeTab === 'subjects'}
              onClick={() => setActiveTab('subjects')}
            />
            <SidebarItem
              icon={School}
              label="Aulas"
              active={activeTab === 'classrooms'}
              onClick={() => setActiveTab('classrooms')}
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
          <div className="max-w-[1600px] mx-auto h-full">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'offer_planning' && <OfferPlannerView />}
            {activeTab === 'schedule' && <ScheduleView />}
            {activeTab === 'teachers' && <TeachersView />}
            {activeTab === 'subjects' && <SubjectsView />}
            {activeTab === 'classrooms' && <ClassroomsView />}
          </div>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);