'use client'

import { Suspense, lazy } from 'react'
import { SplineErrorBoundary } from './spline-error-boundary'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <SplineErrorBoundary
      fallback={
        <div className={`w-full h-full flex items-center justify-center ${className ?? ''}`}>
          <span className="text-sm text-neutral-500">3D scene unavailable</span>
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="loader"></span>
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
        />
      </Suspense>
    </SplineErrorBoundary>
  )
}
