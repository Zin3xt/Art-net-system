import { create } from 'zustand'

export type PageId =
  | 'dashboard'
  | 'network'
  | 'universes'
  | 'fixtures'
  | 'patch'
  | 'programmer'
  | 'groups'
  | 'scenes'
  | 'cues'
  | 'effects'
  | 'stage'
  | 'diagnostics'
  | 'settings'

interface AppState {
  currentPage: PageId
  setCurrentPage: (page: PageId) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (currentPage) => set({ currentPage })
}))
