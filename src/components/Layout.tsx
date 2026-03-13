import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Container, Offcanvas, Nav, Button, Dropdown } from 'react-bootstrap';
import { Menu, Search, X, Film, Tv, Palette, Clapperboard, BarChart3, HardDriveDownload, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
	{ path: '/', label: 'Analytics', icon: BarChart3 },
	{ path: '/movies', label: 'Movies', icon: Film },
	{ path: '/tv', label: 'Series', icon: Tv },
	{ path: '/search', label: 'Search', icon: Search },
];



export default function Layout() {
	const [show, setShow] = useState(false);
	const [theme, setTheme] = useState(() => localStorage.getItem('screen-arxiv-theme') || 'light');
	const location = useLocation();

	useEffect(() => {
		document.documentElement.setAttribute('data-bs-theme', theme);
		localStorage.setItem('screen-arxiv-theme', theme);
	}, [theme]);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);

	const toggleTheme = () => {
		setTheme(prev => prev === 'dark' ? 'light' : 'dark');
	};

	return (
		<div className="d-flex flex-column min-vh-100">
			<Navbar bg="body" className="border-bottom sticky-top" style={{ height: '45px' }}>
				<Container fluid className="px-3">
					<div className="d-flex align-items-center gap-2">
						{/* Hamburger — desktop only */}
						<Button variant="link" className="p-0 text-body d-none d-md-flex" onClick={handleShow}>
							<Menu size={18} strokeWidth={1.75} />
						</Button>
						<Navbar.Brand className="m-0 p-0 fw-medium font-mono tracking-tight d-flex align-items-center gap-2" style={{ fontSize: '14px' }}>
							<img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Logo" style={{ width: '16px', height: '16px' }} />
							Screen Arxiv
						</Navbar.Brand>
					</div>
					<div className="d-flex align-items-center gap-1">
						{/* Dropdown Menu — mobile top bar */}
						<Dropdown align="end" className="d-flex d-md-none">
							<Dropdown.Toggle
								variant="link"
								className="p-0 text-body d-flex align-items-center justify-content-center top-bar-icon border-0"
								style={{ width: '28px', height: '28px' }}
							>
								<MoreHorizontal size={16} strokeWidth={1.75} />
							</Dropdown.Toggle>

							<Dropdown.Menu className="shadow-sm border-0 custom-dropdown-menu" style={{ minWidth: '160px', borderRadius: '8px', margin: '8px 0 0 0' }}>
								<Dropdown.Item onClick={toggleTheme} className="d-flex align-items-center gap-2 py-2 px-3">
									<Palette size={14} className={theme === 'dark' ? 'text-secondary' : 'text-body'} />
									<span className="font-mono text-body" style={{ fontSize: '11px' }}>Toggle Theme</span>
								</Dropdown.Item>
								<Dropdown.Item as={Link} to="/save-data" className="d-flex align-items-center gap-2 py-2 px-3">
									<HardDriveDownload size={14} className={location.pathname === '/save-data' ? 'text-primary' : 'text-body'} />
									<span className="font-mono text-body" style={{ fontSize: '11px' }}>Save Data</span>
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown>
						{/* Desktop clapperboard icon */}
						<Button variant="outline-secondary" className="rounded p-1 d-none d-md-flex align-items-center justify-content-center border-0 bg-primary bg-opacity-10 text-primary" style={{ width: '28px', height: '28px' }}>
							<Clapperboard size={14} strokeWidth={1.75} />
						</Button>
					</div>
				</Container>
			</Navbar>

			{/* Offcanvas — desktop only */}
			<Offcanvas show={show} onHide={handleClose} placement="start" className="border-end-0 m-3 rounded-4 shadow-lg custom-offcanvas" style={{ width: '260px', height: 'auto', maxHeight: 'calc(100dvh - 2rem)' }}>
				<Offcanvas.Header className="pb-0 pt-3 px-3 align-items-start">
					<div>
						<div className="text-secondary fw-bold text-uppercase mb-1 font-mono" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Archive</div>
						<Offcanvas.Title className="fw-medium font-mono fs-6 text-body">Screen Arxiv</Offcanvas.Title>
					</div>
					<Button variant="link" className="p-0 text-secondary ms-auto" onClick={handleClose}>
						<X size={20} />
					</Button>
				</Offcanvas.Header>
				<Offcanvas.Body className="d-flex flex-column px-2 pt-3 font-mono">
					<Nav className="flex-column gap-0">
						<Nav.Link as={Link} to="/" onClick={handleClose} className={`d-flex align-items-center gap-2 rounded px-2 py-1 mb-1 ${location.pathname === '/' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<BarChart3 size={16} />
							<span>Analytics</span>
						</Nav.Link>
						<Nav.Link as={Link} to="/movies" onClick={handleClose} className={`d-flex align-items-center gap-2 rounded px-2 py-1 mb-1 ${location.pathname === '/movies' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<Film size={16} />
							<span>Movies</span>
						</Nav.Link>
						<Nav.Link as={Link} to="/tv" onClick={handleClose} className={`d-flex align-items-center gap-2 rounded px-2 py-1 mb-1 ${location.pathname === '/tv' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<Tv size={16} />
							<span>Series</span>
						</Nav.Link>
						<Nav.Link as={Link} to="/search" onClick={handleClose} className={`d-flex align-items-center gap-2 rounded px-2 py-1 mb-1 ${location.pathname === '/search' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<Search size={16} />
							<span>Search</span>
						</Nav.Link>
						<Nav.Link as={Link} to="/save-data" onClick={handleClose} className={`d-flex align-items-center gap-2 rounded px-2 py-1 mb-1 ${location.pathname === '/save-data' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<HardDriveDownload size={16} />
							<span>Save Data</span>
						</Nav.Link>
					</Nav>

					<div className="mt-auto pt-3 border-top mx-2 border-secondary border-opacity-10">
						<Button
							variant={theme === 'dark' ? 'dark' : 'light'}
							className={`w-100 d-flex align-items-center gap-3 rounded px-3 py-2 text-body ${theme === 'dark' ? 'bg-secondary bg-opacity-10 border border-secondary border-opacity-25' : 'border-0'} mb-3 hover-bg-light`}
							onClick={toggleTheme}
							style={{ fontSize: '14px' }}
						>
							<Palette size={16} className={theme === 'dark' ? "text-secondary" : "text-primary"} />
							<span>Toggle Theme</span>
						</Button>
						<div className="text-center font-mono">
							<span className="text-secondary text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>v1.1.0-beta</span>
						</div>
					</div>
				</Offcanvas.Body>
			</Offcanvas>

			<main className={`flex-grow-1 app-content ${show ? 'blur-active' : ''}`}>
				<Outlet />
			</main>

			{/* Bottom bar — mobile only */}
			<nav className="bottom-nav d-flex d-md-none">
				{NAV_ITEMS.map(({ path, label, icon: Icon }) => {
					const isActive = location.pathname === path;
					return (
						<Link
							key={path}
							to={path}
							className={`bottom-nav-item ${isActive ? 'active' : ''}`}
						>
							<Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
							<span className="bottom-nav-label">{label}</span>
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
