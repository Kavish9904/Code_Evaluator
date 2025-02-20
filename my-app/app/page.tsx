"use client"

import Link from "next/link"
import { Button } from "../components/ui/button"
import { GraduationCapIcon, CodeIcon, TrophyIcon, UsersIcon } from "lucide-react"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between">
        <Link className="flex items-center justify-center" href="/">
          <GraduationCapIcon className="h-6 w-6" />
          <span className="ml-2 text-lg font-bold">PromptMaster</span>
        </Link>
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <nav
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } md:flex absolute md:relative top-14 left-0 right-0 md:top-0 flex-col md:flex-row items-center md:ml-auto bg-white md:bg-transparent shadow-md md:shadow-none z-20`}
        >
          <Link
            className="w-full md:w-auto text-center py-2 px-4 text-sm font-medium hover:bg-gray-100 md:hover:bg-transparent md:hover:underline underline-offset-4"
            href="#"
          >
            Features
          </Link>
          <Link
            className="w-full md:w-auto text-center py-2 px-4 text-sm font-medium hover:bg-gray-100 md:hover:bg-transparent md:hover:underline underline-offset-4"
            href="#"
          >
            Pricing
          </Link>
          <Link
            className="w-full md:w-auto text-center py-2 px-4 text-sm font-medium hover:bg-gray-100 md:hover:bg-transparent md:hover:underline underline-offset-4"
            href="#"
          >
            About
          </Link>
          <Link
            className="w-full md:w-auto text-center py-2 px-4 text-sm font-medium hover:bg-gray-100 md:hover:bg-transparent md:hover:underline underline-offset-4"
            href="/login"
          >
            Login
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%]">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter">
                  Master the Art of Prompt Engineering
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 dark:text-gray-400">
                  Enhance your AI skills, compete in challenges, and become a prompt engineering expert.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12">
              Features
            </h2>
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <CodeIcon className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
                <h3 className="text-lg sm:text-xl font-bold text-center">Interactive Challenges</h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center">
                  Engage in real-world prompt engineering scenarios and sharpen your skills.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <TrophyIcon className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
                <h3 className="text-lg sm:text-xl font-bold text-center">Competitions</h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center">
                  Participate in regular competitions and showcase your expertise.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <UsersIcon className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
                <h3 className="text-lg sm:text-xl font-bold text-center">Community</h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center">
                  Connect with fellow prompt engineers and share knowledge.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 PromptMaster. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

