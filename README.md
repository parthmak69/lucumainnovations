# Lucuma Tech - Modern Technology Startup Website

Lucuma Tech is a premium-looking startup website built for a technology services provider. The application incorporates a hybrid design language combining **Soft UI Neumorphism**, **Glassmorphism**, and interactive **CSS 3D perspective transformations**. 

It is structured exactly like a MERN stack application (separating assets, components, layouts, hooks, pages, and mock data models) to support clean server-side integrations later.

---

## Technical Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4.x (using `@theme` custom design system tokens)
- **Animations**: Framer Motion v12.x (scroll reveal triggers, micro-interactions, spring physics)
- **Iconography**: React Icons (Lucide/Feather icons integration)
- **Routing**: React Router v7.x (with automated scroll resetting and page wrappers)

---

## Features Built

1. **Animated Preloader Screen**: Floating branded loader logo and smooth progress indicator on initial visit.
2. **Sticky Responsive Navbar**: Shrinks height on scroll, highlighting the active path with capsule slides. Slides into a neumorphic vertical drawer on mobile viewports.
3. **Landing Page (Hero)**: Premium typography layout featuring an interactive **3D Isometric CSS Cube** that tilts dynamically based on mouse movements.
4. **Services Portal**: Filter dashboard containing detailed breakdowns of the 12 technical services.
5. **Interactive Project Estimator**: Cost calculator tool where clients toggle services, scope tiers, and development speeds to compute estimate ranges and download/copy text proposals.
6. **Our Story (About)**: Founders' narrative highlighting fresh student-developer energy, mission statements, and a skills expertise grid.
7. **Contact Briefing Form**: Neumorphic input fields with client-side regex validations, hover elevation indicators, and a success pop-up.

---

## How to Install & Run

Due to Snap container AppArmor isolation constraints on the agent's runtime environment, package installation and bundler compilation should be run in your host terminal where your local Node/NPM variables are loaded.

1. **Navigate to the project root**:
   ```bash
   cd /home/parth/lucumatech
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Verify production compilation**:
   ```bash
   npm run build
   ```
