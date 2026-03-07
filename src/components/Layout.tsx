import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Container, Offcanvas, Nav, Button } from 'react-bootstrap';
import { Menu, Search, X, Film, Tv, Palette, Clapperboard } from 'lucide-react';

export default function Layout() {
	const [show, setShow] = useState(false);
	const [theme, setTheme] = useState('light');
	const location = useLocation();

	useEffect(() => {
		setTheme(document.documentElement.getAttribute('data-bs-theme') || 'light');
	}, []);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);

	const toggleTheme = () => {
		const newTheme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-bs-theme', newTheme);
		setTheme(newTheme);
	};

	return (
		<div className="d-flex flex-column min-vh-100">
			<Navbar bg="body" className="border-bottom sticky-top" style={{ height: '56px' }}>
				<Container fluid className="px-3">
					<div className="d-flex align-items-center gap-3">
						<Button variant="link" className="p-0 text-body" onClick={handleShow}>
							<Menu size={20} />
						</Button>
						<Navbar.Brand className="m-0 p-0 fw-medium fs-6 font-mono tracking-tight">
							Screen Arxiv
						</Navbar.Brand>
					</div>
					<div className="d-flex align-items-center">
						<Button variant="outline-secondary" className="rounded p-1 d-flex align-items-center justify-content-center border-0 bg-primary bg-opacity-10 text-primary" style={{ width: '32px', height: '32px' }}>
							<Clapperboard size={16} />
						</Button>
					</div>
				</Container>
			</Navbar>

			<Offcanvas show={show} onHide={handleClose} placement="start" className="border-end-0 m-3 rounded-4 shadow-lg" style={{ width: '260px', height: 'calc(100vh - 2rem)' }}>
				<Offcanvas.Header className="pb-0 pt-4 px-4 align-items-start">
					<div>
						<div className="text-secondary fw-bold text-uppercase mb-1 font-mono" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>Archive</div>
						<Offcanvas.Title className="fw-medium font-mono fs-6 text-body">Screen Arxiv</Offcanvas.Title>
					</div>
					<Button variant="link" className="p-0 text-secondary ms-auto" onClick={handleClose}>
						<X size={20} />
					</Button>
				</Offcanvas.Header>
				<Offcanvas.Body className="d-flex flex-column px-3 pt-4 font-mono">
					<Nav className="flex-column gap-1">
						<Nav.Link as={Link} to="/movies" onClick={handleClose} className={`d-flex align-items-center gap-3 rounded px-3 py-2 ${location.pathname === '/movies' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<Film size={16} />
							<span>Movies</span>
						</Nav.Link>
						<Nav.Link as={Link} to="/tv" onClick={handleClose} className={`d-flex align-items-center gap-3 rounded px-3 py-2 ${location.pathname === '/tv' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<Tv size={16} />
							<span>Series</span>
						</Nav.Link>
						<Nav.Link as={Link} to="/search" onClick={handleClose} className={`d-flex align-items-center gap-3 rounded px-3 py-2 ${location.pathname === '/search' ? 'bg-primary bg-opacity-10 text-primary fw-medium' : 'text-body hover-bg-light'}`} style={{ fontSize: '14px' }}>
							<Search size={16} />
							<span>Search</span>
						</Nav.Link>
					</Nav>

					<div className="mt-auto pt-4 border-top mx-3 border-secondary border-opacity-10">
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
		</div>
	);
}
