// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: [
        '@nuxtjs/tailwindcss',
        '@nuxtjs/color-mode',
        '@nuxtjs/supabase',
        '@vueuse/nuxt',
        '@vee-validate/nuxt',
        'nuxt-proxy',
    ],
    colorMode: {
        preference: 'cupcake', // default theme
        dataValue: 'theme', // activate data-theme in <html> tag
    },
    proxy: {
        options: {
            target: 'http://localhost:55321',
            changeOrigin: true,
            pathFilter: ['/rest/**', '/auth/**', '/storage/**'],
        },
    },
})
