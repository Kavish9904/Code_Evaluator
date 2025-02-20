interface User {
    name: string
    email: string
    password: string
  }
  
  export const authService = {
    signup: (user: User) => {
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      if (users.find((u: User) => u.email === user.email)) {
        throw new Error("User already exists")
      }
      users.push(user)
      localStorage.setItem("users", JSON.stringify(users))
      localStorage.setItem("currentUser", JSON.stringify(user))
    },
  
    login: (email: string, password: string) => {
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const user = users.find((u: User) => u.email === email && u.password === password)
      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user))
        return user
      }
      throw new Error("Invalid credentials")
    },
  
    logout: () => {
      localStorage.removeItem("currentUser")
    },
  
    getCurrentUser: () => {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : null
    },
  }
  
  