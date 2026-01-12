import { makeLogger } from '@vk-public/logger'
import axios from 'axios'

import { config } from '#config'

const logger = makeLogger('hh-auth-service')

 
export interface HhTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export class HhAuthService {
    private readonly authUrl = 'https://hh.ru/oauth/authorize'
    private readonly tokenUrl = 'https://hh.ru/oauth/token'
    private readonly apiUrl = 'https://api.hh.ru'

    getAuthUrl(state: string): string {
        const parameters = new URLSearchParams({
            response_type: 'code',
            client_id: config.HH_CLIENT_ID,
            redirect_uri: config.HH_REDIRECT_URI,
            state,
        })

        return `${this.authUrl}?${parameters.toString()}`
    }

    async exchangeCode(code: string): Promise<HhTokens> {
        try {
            const parameters = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: config.HH_CLIENT_ID,
                client_secret: config.HH_CLIENT_SECRET,
                redirect_uri: config.HH_REDIRECT_URI,
                code,
            })

            const response = await axios.post<HhTokens>(this.tokenUrl, parameters, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

            return response.data
        } catch (error) {
            logger.error('Failed to exchange code', { error })
            throw error
        }
    }

    async refreshToken(refreshToken: string): Promise<HhTokens> {
        try {
             const parameters = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: config.HH_CLIENT_ID,
                client_secret: config.HH_CLIENT_SECRET,
            })
             
             const response = await axios.post<HhTokens>(this.tokenUrl, parameters, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
             
             return response.data
        } catch (error) {
            logger.error('Failed to refresh token', { error })
            throw error
        }
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getUserInfo(accessToken: string): Promise<any> {
        try {
             const response = await axios.get(`${this.apiUrl}/me`, {
                 headers: {
                     Authorization: `Bearer ${accessToken}`,
                     'User-Agent': 'NetAgent/1.0 (vladimir@b-vladi.ru)'
                 }
             })

             return response.data
        } catch (error) {
             logger.error('Failed to get user info', { error })
             throw error
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getResumes(accessToken: string): Promise<any[]> {
        try {
            const response = await axios.get(`${this.apiUrl}/resumes/mine`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'User-Agent': 'NetAgent/1.0 (vladimir@b-vladi.ru)'
                }
            })

            return response.data.items
        } catch (error) {
            logger.error('Failed to get resumes', { error })
            throw error
        }
    }

    /**
     * Executes a request with automatic token refresh
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, max-statements
    async makeRequest<T>(user: any, requestFunction: (token: string) => Promise<T>, saveUserFunction: (user: any) => Promise<void>): Promise<T> {
        if (!user.hhAuth?.accessToken) {
            throw new Error('User not authorized in HH')
        }

        try {
            return await requestFunction(user.hhAuth.accessToken)
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                 logger.info('Token expired, refreshing...')

                 try {
                     const tokens = await this.refreshToken(user.hhAuth.refreshToken)
                     
                     user.hhAuth.accessToken = tokens.access_token
                     user.hhAuth.refreshToken = tokens.refresh_token
                     user.hhAuth.expiresAt = Date.now() + (tokens.expires_in * 1000)
                     
                     await saveUserFunction(user)
                     
                     return await requestFunction(tokens.access_token)
                 } catch (refreshError) {
                     logger.error('Failed to refresh token during request', { refreshError })
                     throw refreshError
                 }
            }

            throw error
        }
    }
}
