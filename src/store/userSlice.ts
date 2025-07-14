import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    user: any | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    user: null,
    isLoading: false,
    error: null,
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // get user
        getUser: (state) => {
            return state.user;
        },

        // set user
        initUser: (state, action: PayloadAction<any>) => {
            state.user = action.payload;
        },

        // clear user
        removeUser: (state) => {
            state.user = null;
        },

        // login and logout
        login: (state, action: PayloadAction<any>) => {
            state.user = action.payload;
        },
        logout: (state) => {
            state.user = null;
        },

        // set is loading
        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        // set error
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
})

export const { getUser, initUser, removeUser, login, logout, setIsLoading, setError, clearError } = userSlice.actions;
export default userSlice.reducer;
