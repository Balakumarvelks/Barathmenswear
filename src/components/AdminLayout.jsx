import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FaTachometerAlt, FaClipboardList, FaBoxes, FaTags,
    FaWarehouse, FaTicketAlt, FaUsers, FaChartBar,
    FaSignOutAlt, FaBars, FaTimes, FaChevronRight
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import './AdminLayout.css';

const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/admin/orders', label: 'Orders', icon: <FaClipboardList /> },
    { path: '/admin/products', label: 'Products', icon: <FaBoxes /> },
    { path: '/admin/categories', label: 'Categories', icon: <FaTags /> },
    { path: '/admin/inventory', label: 'Inventory', icon: <FaWarehouse /> },
    { path: '/admin/coupons', label: 'Coupons', icon: <FaTicketAlt /> },
    { path: '/admin/users', label: 'Users', icon: <FaUsers /> },
    { path: '/admin/analytics', label: 'Analytics', icon: <FaChartBar /> },
];

const AdminLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`admin-layout ${collapsed ? 'collapsed' : ''}`}>
            {/* Sidebar */}
            <aside className="admin-sidebar">
                {/* Logo / Brand */}
                <div className="sidebar-brand">
                    {!collapsed && (
                        <Link to="/admin/dashboard" className="brand-link">
                            <img src={logo} alt="Barath Men's Wear" className="sidebar-logo" />
                            <span className="brand-name">Barath<br /><small>Admin Panel</small></span>
                        </Link>
                    )}
                    <button
                        className="collapse-btn"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <FaBars /> : <FaTimes />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                title={collapsed ? item.label : ''}
                            >
                                <span className="sidebar-icon">{item.icon}</span>
                                {!collapsed && <span className="sidebar-label">{item.label}</span>}
                                {!collapsed && isActive && <FaChevronRight className="active-arrow" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info + logout at bottom */}
                <div className="sidebar-footer">
                    {!collapsed && (
                        <div className="sidebar-user">
                            <div className="user-avatar">
                                {user?.firstName?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.firstName} {user?.lastName}</span>
                                <span className="user-role">Administrator</span>
                            </div>
                        </div>
                    )}
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        <FaSignOutAlt />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="admin-main">
                {/* Top Header Bar */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <h2 className="page-title">
                            {navItems.find(n => n.path === location.pathname)?.label || 'Admin'}
                        </h2>
                    </div>
                    <div className="topbar-right">
                        <span className="topbar-date">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="admin-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
