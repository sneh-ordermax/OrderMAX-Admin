import { NavMenu } from '@shopify/app-bridge-react'
import { Link, Outlet } from 'react-router-dom'

/**
 * Top-level chrome for the embedded app.
 *
 * `NavMenu` renders the left-hand navigation in the Shopify Admin sidebar
 * (outside the iframe). The first link must point to "/" with `rel="home"`.
 * Page content renders through the router <Outlet />.
 */
export function AppFrame() {
  return (
    <>
      <NavMenu>
        <Link to="/" rel="home">
          Dashboard
        </Link>
        <Link to="/orders">Orders</Link>
        <Link to="/settings">Settings</Link>
      </NavMenu>
      <Outlet />
    </>
  )
}
