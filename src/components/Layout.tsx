import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar, Container, Offcanvas, Nav, Button } from 'react-bootstrap';
import { Menu, Search, X, Film, Tv, Palette, Clapperboard } from 'lucide-react';

export default function Layout() {
  const [show, setShow] = useState(false);
  const location = useLocation();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    html.setAttribute('data-bs-theme', currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="body" className="border-bottom sticky-top" style={{ height: '56px' }}>
        <Container fluid className="px-3">
          <div className="d-flex align-items-center gap-3">
            <Button variant="link" className="p-0 text-body" onClick={handleShow}>
              <Menu size={24} />
            </Button>
            <Navbar.Brand className="m-0 p-0 fw-bold fs-5 font-display tracking-tight">
              Screen Arxiv
            </Navbar.Brand>
          </div>
          <div className="d-flex align-items-center">
            <Button variant="outline-secondary" className="rounded-circle p-1 d-flex align-items-center justify-content-center border-0 bg-primary bg-opacity-10 text-primary" style={{ width: '40px', height: '40px' }}>
              <Clapperboard size={20} />
            </Button>
          </div>
        </Container>
      </Navbar>

      <Offcanvas show={show} onHide={handleClose} placement="start" className="border-end-0 m-3 rounded-4 shadow-lg" style={{ width: '280px', height: 'calc(100vh - 2rem)' }}>
        <Offcanvas.Header className="pb-0 pt-4 px-4">
          <div>
            <div className="text-primary fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>Project</div>
            <Offcanvas.Title className="fw-bold fs-5 font-display">SCREEN ARXIV</Offcanvas.Title>
          </div>
          <Button variant="link" className="p-0 text-secondary ms-auto" onClick={handleClose}>
            <X size={24} />
          </Button>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column px-4">
          <Nav className="flex-column gap-2 mt-4">
            <Nav.Link as={Link} to="/movies" onClick={handleClose} className={`d-flex align-items-center gap-3 rounded-3 px-3 py-3 ${location.pathname === '/movies' ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10' : 'text-body hover-bg-light'}`}>
              <Film size={20} />
              <span className="fw-bold">Movie</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/tv" onClick={handleClose} className={`d-flex align-items-center gap-3 rounded-3 px-3 py-3 ${location.pathname === '/tv' ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10' : 'text-body hover-bg-light'}`}>
              <Tv size={20} />
              <span className="fw-bold">Series</span>
            </Nav.Link>
            <Nav.Link as={Link} to="/search" onClick={handleClose} className={`d-flex align-items-center gap-3 rounded-3 px-3 py-3 ${location.pathname === '/search' ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10' : 'text-body hover-bg-light'}`}>
              <Search size={20} />
              <span className="fw-bold">Search</span>
            </Nav.Link>
          </Nav>

          <div className="mt-auto pt-4 border-top">
            <div className="d-flex justify-content-center">
              <Button variant="light" className="rounded-circle p-0 d-flex align-items-center justify-content-center text-primary" style={{ width: '48px', height: '48px' }} onClick={toggleTheme}>
                <Palette size={20} />
              </Button>
            </div>
            <div className="text-center mt-4">
              <span className="text-secondary text-uppercase" style={{ fontSize: '10px', letterSpacing: '-0.05em' }}>v1.0.4-beta // arxiv_sys</span>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <main className="flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}
