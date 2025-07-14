// Section: Admin Panel Layout Component
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const AdminLayout: React.FC = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: 250 }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout; 