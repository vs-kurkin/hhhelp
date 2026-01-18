<template>
  <div class="max-w-2xl mx-auto pb-20">
    <!-- Auth Block -->
    <div v-if="!authStore.loading" class="px-4 pt-4 pb-2">
        <div v-if="!authStore.isConnected" 
             class="bg-[var(--tg-theme-secondary-bg-color)] p-3 rounded-xl flex justify-between items-center border border-[var(--tg-theme-hint-color)]/10">
            <span class="text-sm text-[var(--tg-theme-text-color)] font-medium">Connect HeadHunter</span>
            <button @click="authStore.login()" 
                    class="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                    style="background-color: var(--tg-theme-button-color); color: var(--tg-theme-button-text-color);">
                Connect
            </button>
        </div>
        <div v-else class="flex items-center gap-2 px-1 opacity-70">
             <div class="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
             <span class="text-xs text-[var(--tg-theme-text-color)] font-medium">Connected as {{ authStore.hhProfile?.email || 'User' }}</span>
        </div>
    </div>

    <!-- Filters Header -->
    <div class="px-4 py-2 sticky top-0 bg-[var(--tg-theme-bg-color)] z-[9999] border-b border-[var(--tg-theme-hint-color)]/10">
      <div class="flex gap-2">
          <div class="relative flex-grow">
             <input
              v-model="store.filters.search"
              class="w-full p-2 pl-3 pr-10 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] placeholder-[var(--tg-theme-hint-color)] focus:ring-2 focus:ring-[var(--tg-theme-button-color)] transition-all outline-none border-none"
              placeholder="Search..."
              @input="debounceSearch"
          />
          </div>
          
          <select
              v-model="store.filters.stack"
              class="p-2 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] focus:ring-2 focus:ring-[var(--tg-theme-button-color)] outline-none border-none cursor-pointer"
              @change="store.setFilters({ stack: store.filters.stack })"
          >
            <option value="All">All</option>
            <option value="Favorites">⭐ Favorites</option>
            <option value="Frontend">Front</option>
            <option value="Backend">Back</option>
            <option value="Fullstack">Full</option>
            <option value="DevOps">Ops</option>
          </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tg-theme-button-color)]"></div>
    </div>

    <!-- List -->
    <div v-else class="p-4 space-y-3">
      <div v-if="store.vacancies.length === 0" class="text-center text-[var(--tg-theme-hint-color)] py-10">
        No vacancies found.
      </div>

      <div v-for="vacancy in store.vacancies" :key="vacancy.hhId"
           class="bg-[var(--tg-theme-bg-color)] p-4 rounded-xl border border-[var(--tg-theme-hint-color)]/20 shadow-sm transition-all"
           :class="{ 
             'ring-1 ring-[var(--tg-theme-button-color)]/50': expandedVacancies.has(vacancy.hhId),
             'opacity-50 grayscale': store.hiddenIds.has(vacancy.hhId)
           }"
      >
        <!-- Main Card Content (Clickable) -->
        <div @click="toggleExpand(vacancy.hhId)" class="cursor-pointer">
            <div class="flex justify-between items-start">
                <div class="flex-grow pr-2">
                    <h3 class="font-semibold text-[var(--tg-theme-text-color)] leading-tight mb-1 break-words">{{ vacancy.name }}</h3>
                    <p class="text-sm text-[var(--tg-theme-hint-color)] mb-1">{{ vacancy.employer }}</p>
                </div>
                
                <button @click.stop="store.toggleFavorite(vacancy)" class="mr-2 p-2 rounded-full hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors z-10 relative group">
                    <!-- Filled Star (Favorite) -->
                    <svg v-if="vacancy.isFavorite" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-yellow-500">
                        <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                    </svg>
                    <!-- Outline Star (Not Favorite) -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-[var(--tg-theme-hint-color)] group-hover:text-yellow-400 transition-colors">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.563.045.797.77.388 1.145l-4.204 3.86a.562.562 0 00-.16.495l1.237 5.38a.563.563 0 01-.822.628l-4.763-2.88a.563.563 0 00-.586 0l-4.763 2.88a.563.563 0 01-.822-.627l1.237-5.38a.562.562 0 00-.16-.495L3.373 10.543c-.409-.375-.175-1.1.388-1.145l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                </button>

                <!-- Chevron Icon -->
                <div class="text-[var(--tg-theme-hint-color)] transition-transform duration-200 mt-0.5" 
                     :class="{ 'rotate-180': expandedVacancies.has(vacancy.hhId) }">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 items-center mt-2">
                <p v-if="vacancy.salary" class="text-[var(--tg-theme-text-color)] font-bold">
                  {{ formatSalary(vacancy.salary) }}
                </p>
                <p v-else class="text-[var(--tg-theme-hint-color)] text-sm">Salary not specified</p>
                
                <span v-if="vacancy.stack" class="text-xs font-medium px-2 py-0.5 rounded bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]">
                    {{ vacancy.stack }}
                </span>
            </div>
        </div>

        <!-- Expanded Details -->
        <div v-if="expandedVacancies.has(vacancy.hhId)" class="mt-4 pt-3 border-t border-[var(--tg-theme-hint-color)]/10 text-sm animate-fade-in">
            <!-- Metadata Tags -->
            <div class="flex flex-wrap gap-2 mb-3 text-xs">
                 <span v-if="vacancy.raw?.experience?.name" class="px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                    {{ vacancy.raw.experience.name }}
                 </span>
                 <span v-if="vacancy.raw?.schedule?.name" class="px-2 py-1 rounded-md bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                    {{ vacancy.raw.schedule.name }}
                 </span>
                 <span v-if="vacancy.raw?.employment?.name" class="px-2 py-1 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                    {{ vacancy.raw.employment.name }}
                 </span>
            </div>

            <!-- Snippet / Description -->
            <div class="space-y-3 text-[var(--tg-theme-text-color)] opacity-90 leading-relaxed">
                <div v-if="vacancy.raw?.snippet?.requirement">
                    <p class="font-medium text-[var(--tg-theme-hint-color)] text-xs uppercase mb-1">Requirements</p>
                    <p v-html="formatSnippet(vacancy.raw.snippet.requirement)"></p>
                </div>
                
                <div v-if="vacancy.raw?.snippet?.responsibility">
                    <p class="font-medium text-[var(--tg-theme-hint-color)] text-xs uppercase mb-1 mt-2">Responsibilities</p>
                    <p v-html="formatSnippet(vacancy.raw.snippet.responsibility)"></p>
                </div>
            </div>

            <div class="flex gap-3 mt-4 pt-2">
                 <button 
                   @click.stop="store.hiddenIds.has(vacancy.hhId) ? store.restoreVacancy(vacancy.hhId) : store.hideVacancy(vacancy.hhId)"
                   class="flex-1 py-3 rounded-xl font-medium transition-colors"
                   :class="store.hiddenIds.has(vacancy.hhId) 
                     ? 'bg-blue-50 text-blue-600 active:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400' 
                     : 'bg-red-50 text-red-600 active:bg-red-100 dark:bg-red-900/20 dark:text-red-400'"
                 >
                    {{ store.hiddenIds.has(vacancy.hhId) ? 'Вернуть' : 'Отклонить' }}
                </button>
                
                 <button 
                   @click.stop="handleApply(vacancy.hhId)"
                   class="flex-1 text-center py-3 rounded-xl font-medium transition-opacity hover:opacity-90 active:scale-[0.98]"
                   style="background-color: var(--tg-theme-button-color); color: var(--tg-theme-button-text-color);">
                   Откликнуться
                </button>
            </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="store.vacancies.length > 0" class="flex justify-between items-center px-4 mt-2 mb-6 text-sm text-[var(--tg-theme-hint-color)]">
      <button
          :disabled="store.meta.page === 1"
          class="px-4 py-2 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] disabled:opacity-50 text-[var(--tg-theme-text-color)]"
          @click="scrollToTop(); store.setPage(store.meta.page - 1)"
      >
        Previous
      </button>
      <span>{{ store.meta.page }} / {{ store.meta.pages }}</span>
      <button
          :disabled="store.meta.page === store.meta.pages"
          class="px-4 py-2 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] disabled:opacity-50 text-[var(--tg-theme-text-color)]"
          @click="scrollToTop(); store.setPage(store.meta.page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useVacancyStore, type Vacancy } from '#stores/vacancy'
import { useAuthStore } from '#stores/auth'

const store = useVacancyStore()
const authStore = useAuthStore()
const expandedVacancies = ref(new Set<string>())
let searchTimeout: number | undefined

const toggleExpand = (id: string) => {
    if (expandedVacancies.value.has(id)) {
        expandedVacancies.value.delete(id)
    } else {
        expandedVacancies.value.add(id)
    }
}

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.setFilters({ search: store.filters.search })
    scrollToTop()
  }, 500)
}

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatSalary = (salary: NonNullable<Vacancy['salary']>) => {
    const { from, to, currency } = salary
    if (from && to) return `${from.toLocaleString()} - ${to.toLocaleString()} ${currency}`
    if (from) return `From ${from.toLocaleString()} ${currency}`
    if (to) return `Up to ${to.toLocaleString()} ${currency}`
    return 'Salary Negotiable'
}

const formatSnippet = (text?: string) => {
    if (!text) return ''
    // Highlighted text from HH usually comes in <highlighttext> tags
    return text
        .replace(/<highlighttext>/g, '<span class="text-[var(--tg-theme-link-color)] font-medium">')
        .replace(/<\/highlighttext>/g, '</span>')
}

const handleApply = async (id: string) => {
    const success = await store.applyToVacancy(id)
    if (success) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            tg.close();
        }
    }
}

onMounted(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.ready();
        // Set header color to match app bg
        tg.setHeaderColor?.(tg.themeParams?.bg_color || '#ffffff');
    }
    store.fetchVacancies()
    authStore.checkStatus()
})
</script>

<style>
.animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
