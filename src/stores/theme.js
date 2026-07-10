import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')
  const language = ref(localStorage.getItem('language') || 'id')
  
  function setTheme(newTheme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }
  
  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }
  
  function setLanguage(lang) {
    language.value = lang
    localStorage.setItem('language', lang)
  }
  
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
    
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }
  
  // Apply theme on init
  applyTheme()
  
  return {
    theme,
    language,
    setTheme,
    toggleTheme,
    setLanguage,
    applyTheme
  }
})
