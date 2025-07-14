import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
})

// Infer types for state and dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
