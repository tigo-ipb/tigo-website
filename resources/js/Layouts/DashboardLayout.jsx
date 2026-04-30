import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Navbar />
                <main className="p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}