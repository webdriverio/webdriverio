export default function navigateTo (connection, params) {
    const { Page } = connection
    return Page.navigate(params)
}
