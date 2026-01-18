import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { makeLogger } from '#shims/logger'

const logger = makeLogger('auth-store')

export const useAuthStore = defineStore('auth', () => {
    const isConnected = ref(false)
    const hhProfile = ref<{ email: string } | null>(null)
    const loading = ref(false)

    const checkStatus = async () => {
        loading.value = true

        try {
            // @ts-expect-error - Telegram WebApp types
            const initData = globalThis.Telegram?.WebApp?.initData || ''
            
            // If running locally without TG, initData might be empty, so handle that
            if (!initData) {
                // Mock for development if needed
                return
            }

            const response = await axios.get('/api/user/me', {
                 headers: { 
                     // eslint-disable-next-line @typescript-eslint/naming-convention
                     'x-telegram-init-data': initData 
                 }
            })

            isConnected.value = response.data.isConnected
            hhProfile.value = response.data.hhProfile
        } catch (error) {
            logger.error('Failed to check auth status', { error })
        } finally {
            loading.value = false
        }
    }

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const login = () => {
        // @ts-expect-error - Telegram WebApp types
        const initData = globalThis.Telegram?.WebApp?.initData || ''
        const parameters = new URLSearchParams(initData)
        const userJson = parameters.get('user')
        
        const authUrl = `${window.location.origin}/api/auth/hh/login?userId=${userJson ? JSON.parse(userJson).id : ''}`

        if (userJson) {
            // @ts-expect-error - Telegram WebApp types
            const tg = globalThis.Telegram?.WebApp

            if (tg?.openLink) {
                tg.openLink(authUrl)
            } else {
                 window.open(authUrl, '_blank')
            }
        } else if (import.meta.env.DEV) {
            // Development fallback
            // eslint-disable-next-line no-alert
            const devUserId = prompt('DEV MODE: Enter Telegram User ID (e.g. 12345):', '12345')
            if (devUserId) {
                 const devAuthUrl = `${window.location.origin}/api/auth/hh/login?userId=${devUserId}`
                 window.open(devAuthUrl, '_blank')
            }
        } else {
            logger.warn('No user data found in initData')
            // eslint-disable-next-line no-alert
            alert('Please open this app from Telegram!')
        }
    }

    return {
        isConnected,
        hhProfile,
        loading,
        checkStatus,
        login
    }
})
