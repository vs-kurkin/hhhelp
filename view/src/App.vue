<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <main>
      <VacancyList />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import VacancyList from './components/VacancyList.vue'

onMounted(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
        // Function to apply theme
        const applyTheme = () => {
            if (tg.colorScheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        // Initial apply
        applyTheme();

        // Listen for updates
        tg.onEvent('themeChanged', applyTheme);
        
        // Expand
        tg.expand();
    }
})
</script>