import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark' | 'system';

interface UiState {
  sidebarOpen: boolean;
  searchOpen: boolean;
  mobileMenuOpen: boolean;
  theme: Theme;
}

const initialState: UiState = {
  sidebarOpen: false,
  searchOpen: false,
  mobileMenuOpen: false,
  theme: 'system',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    closeAll: (state) => {
      state.sidebarOpen = false;
      state.searchOpen = false;
      state.mobileMenuOpen = false;
    },
  },
});

export const { toggleSidebar, toggleSearch, toggleMobileMenu, setTheme, closeAll } =
  uiSlice.actions;
export default uiSlice.reducer;
