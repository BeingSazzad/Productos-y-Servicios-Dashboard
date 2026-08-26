import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { ToastContainer } from '@/components/ui/Toast'

/** Router outlet only — providers live in main.tsx. */
export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}
