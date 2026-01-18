import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { makeLogger } from '#shims/logger'

const logger = makeLogger('view-vacancy-store')

export interface Vacancy {
    hhId: string;
    name: string;
    employer: string;
    salary?: {
        from?: number;
        to?: number;
        currency?: string;
    };
    alternateUrl: string;
    stack: string;
    raw?: {
        snippet?: {
            requirement?: string;
            responsibility?: string;
        };
        experience?: { name: string };
        schedule?: { name: string };
        employment?: { name: string };
        address?: { city?: string; street?: string; building?: string; raw?: string };
    };
    isFavorite?: boolean;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export const useVacancyStore = defineStore('vacancy', () => {
    const vacancies = ref<Vacancy[]>([])
    const meta = ref<Meta>({
        total: 0, page: 1, limit: 12, pages: 1,
    })
    const loading = ref(false)
    const filters = ref({
        stack: 'All',
        search: '',
    })

    // Hidden vacancies are now handled by server filtering, but we keep a local set for session-based UI
    const hiddenIds = ref(new Set<string>())

    const API_URL = '/api/vacancies'

    const getHeaders = () => {
        // @ts-expect-error - Telegram WebApp types
        const initData = globalThis.Telegram?.WebApp?.initData || ''
        const headers: Record<string, string> = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'x-telegram-init-data': initData,
        }
        
        // Debug fallback for browser development
        if (!initData) {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers['x-debug-user-id'] = '777' 
        }
        return headers
    }

    const fetchVacancies = async () => {
        loading.value = true

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any = {
                page: meta.value.page,
                limit: meta.value.limit,
                search: filters.value.search,
            }

            if (filters.value.stack === 'Favorites') {
                params.favorites = 'true'
            } else {
                params.stack = filters.value.stack
            }

            const response = await axios.get(API_URL, {
                params,
                headers: getHeaders(),
            })

            // Server already excludes hidden vacancies. 
            // We just populate the list.
            vacancies.value = response.data.data
            meta.value = response.data.meta
        } catch (error) {
            logger.error('Failed to fetch vacancies', { error })
        } finally {
            loading.value = false
        }
    }

    const hideVacancy = async (id: string) => {
        // Optimistic UI
        hiddenIds.value.add(id)
        
        try {
             await axios.post(`${API_URL}/${id}/hide`, {}, {
                 headers: getHeaders()
             })
        } catch (error) {
            logger.error('Failed to hide vacancy', { error })
            // Revert if failed? 
            hiddenIds.value.delete(id)
        }
    }

    const restoreVacancy = async (id: string) => {
        // Optimistic UI
        hiddenIds.value.delete(id)
        
        try {
             await axios.delete(`${API_URL}/${id}/hide`, {
                 headers: getHeaders()
             })
        } catch (error) {
            logger.error('Failed to restore vacancy', { error })
            hiddenIds.value.add(id)
        }
    }

    const toggleFavorite = async (vacancy: Vacancy) => {
        const url = `/api/favorites/${ vacancy.hhId }`

        // Optimistic update
        const oldValue = vacancy.isFavorite
        vacancy.isFavorite = !oldValue

        try {
            if (oldValue) {
                await axios.delete(url, {
                    headers: getHeaders(),
                })
            } else {
                await axios.post(url, {}, {
                    headers: getHeaders(),
                })
            }
        } catch (error) {
            // Revert on error
            vacancy.isFavorite = oldValue
            logger.error('Failed to toggle favorite', { error })
        }
    }

    const applyToVacancy = async (id: string) => {
        try {
            await axios.post(`${ API_URL }/${ id }/apply`, {}, {
                headers: getHeaders(),
            })

            return true
        } catch (error) {
            logger.error('Failed to apply', { error })

            return false
        }
    }

    const setPage = (page: number) => {
        if (page > 0 && page <= meta.value.pages) {
            meta.value.page = page
            fetchVacancies()
        }
    }

    const setFilters = (newFilters: Partial<typeof filters.value>) => {
        filters.value = {
            ...filters.value, ...newFilters,
        }
        meta.value.page = 1 // Reset to first page on filter change
        fetchVacancies()
    }

    return {
        vacancies,
        hiddenIds,
        meta,
        loading,
        filters,
        fetchVacancies,
        setPage,
        setFilters,
        hideVacancy,
        restoreVacancy,
        applyToVacancy,
        toggleFavorite,
    }
})