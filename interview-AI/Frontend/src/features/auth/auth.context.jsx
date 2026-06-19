import { createContext,useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext()


export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")




    return (
        <AuthContext.Provider value={{user,setUser,loading,setLoading,error,setError}} >
            {children}
        </AuthContext.Provider>
    )


}
