import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Courses from '@/pages/Courses'
import CourseDetailPage from '@/pages/CourseDetail'
import LessonPage from '@/pages/Lesson'
import PracticeLayout from '@/pages/practice/PracticeLayout'
import VocabPractice from '@/pages/practice/Vocab'
import GrammarPractice from '@/pages/practice/Grammar'
import SpeakingPractice from '@/pages/practice/Speaking'
import ListeningPractice from '@/pages/practice/Listening'
import ProgressPage from '@/pages/Progress'
import CommunityPage from '@/pages/Community'
import PostDetailPage from '@/pages/PostDetail'
import AchievementsPage from '@/pages/Achievements'
import NotFound from '@/pages/NotFound'
import { useAuthStore } from '@/stores/authStore'

export default function App() {
  useEffect(() => {
    useAuthStore.getState().hydrate()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/lessons/:lessonId" element={<LessonPage />} />
            <Route path="/practice" element={<PracticeLayout />}>
              <Route index element={<VocabPractice />} />
              <Route path="vocab" element={<VocabPractice />} />
              <Route path="grammar" element={<GrammarPractice />} />
              <Route path="speaking" element={<SpeakingPractice />} />
              <Route path="listening" element={<ListeningPractice />} />
            </Route>
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:postId" element={<PostDetailPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}
