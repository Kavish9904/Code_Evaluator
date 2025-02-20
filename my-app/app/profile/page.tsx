"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card"
import { GraduationCapIcon, User, Mail, Briefcase } from "lucide-react"
import { authService } from "../../services/auth"

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")

  useEffect(() => {
    const user = authService.getCurrentUser()
    if (!user) {
      router.push("/login")
    } else {
      setName(user.name)
      setEmail(user.email)
      setBio(user.bio || "")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send a request to your API to update the user's profile
    console.log("Profile update attempt with:", { name, email, bio })

    // Update the user in localStorage
    const updatedUser = { ...authService.getCurrentUser(), name, email, bio }
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))

    // Show success message
    alert("Profile updated successfully!")
  }

  const handleLogout = () => {
    authService.logout()
    router.push("/")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white dark:bg-gray-800 border-b">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCapIcon className="h-6 w-6" />
          <span className="ml-2 text-lg font-bold">PromptMaster</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/dashboard">
            Dashboard
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/profile">
            Profile
          </Link>
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </nav>
      </header>
      <main className="flex-1 py-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base">
                    <User className="w-4 h-4 inline-block mr-2" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">
                    <Mail className="w-4 h-4 inline-block mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-base">
                    <Briefcase className="w-4 h-4 inline-block mr-2" />
                    Bio
                  </Label>
                  <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="text-lg" />
                </div>
                <Button type="submit" className="w-full">
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 PromptMaster. All rights reserved.</p>
      </footer>
    </div>
  )
}

