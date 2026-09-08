# Freshly Client

The Freshly client is a React single-page application for the storefront and
operations dashboard. It communicates with the backend through the API gateway.

## Stack

- React 19 and Vite
- React Router
- Redux Toolkit and React Query
- Tailwind CSS, Material UI, and Radix UI
- Axios

## Prerequisites

- Node.js 20 or later
- npm
- A running Freshly backend API gateway (default: `http://localhost:4000`)

## Getting started

Install dependencies:

```bash
npm install
```

Create a `.env` file in this directory:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Start the development server:

```bash
npm run dev
```

Vite prints the local URL after starting, typically `http://localhost:5173`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Creates a production build in `dist/`. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | Runs ESLint over the project. |

## Project structure

```text
src/
  apis/         API clients and Axios configuration
  components/   Reusable storefront, dashboard, and UI components
  hooks/        React Query hooks for backend resources
  pages/        Route-level page components
  redux/        Authentication and cart state
  styles/       Component styles
```

## Main routes

- Storefront: `/`, `/shop`, `/products/:productId`, `/cart`, `/orders`
- Account: `/login`, `/signup`, `/profile`, `/forgot-password`
- Operations dashboard: `/dashboard`, `/dashboard/products`,
  `/dashboard/categories`, `/dashboard/inventory`, and `/dashboard/promotions`

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Base URL of the backend API gateway. |

Vite exposes only variables prefixed with `VITE_` to browser code. Do not put
secrets in this file.
