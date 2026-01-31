'use client'

import { useEffect } from 'react'
import { Chat } from '@/components/Chat'
import { Timeline } from '@/components/Timeline'
import { useStore } from '@/lib/store'

export default function Home() {
  const { initTimeline, isLoading, timeline } = useStore()
  
  useEffect(() => {
    initTimeline()
  }, [initTimeline])
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xl">📍</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Onceline</h1>
              <p className="text-xs text-gray-500">Your life, one line at a time</p>
            </div>
          </div>
          
          {timeline && (
            <div className="text-sm text-gray-500">
              {timeline.name}
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-gray-500">Loading your timeline...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            {/* Chat Panel */}
            <div className="h-full min-h-[500px]">
              <Chat />
            </div>
            
            {/* Timeline Panel */}
            <div className="h-full min-h-[500px]">
              <Timeline />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
