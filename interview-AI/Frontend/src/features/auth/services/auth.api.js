import axios from "axios"

const API_BASE_URL = `http://${window.location.hostname}:3000`

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
})

function getErrorMessage(err) {
    return err.response?.data?.message || err.message || "Request failed"
}

export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })

        return response.data

    } catch (err) {
        throw new Error(getErrorMessage(err))

    }

}

export async function login({ email, password }) {

    try {

        const response = await api.post("/api/auth/login", {
            email, password
        })

        return response.data

    } catch (err) {
        throw new Error(getErrorMessage(err))
    }

}

export async function logout() {
    try {

        const response = await api.get("/api/auth/logout")

        return response.data

    } catch (err) {
        throw new Error(getErrorMessage(err))
    }
}

export async function getMe() {

    try {

        const response = await api.get("/api/auth/get-me")

        return response.data

    } catch (err) {
        throw new Error(getErrorMessage(err))
    }

}
