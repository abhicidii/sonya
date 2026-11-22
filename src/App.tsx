import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/shell/AppLayout";
const InsightsPage = lazy(() => import("@/pages/insights/InsightsPage"));
const LlmPage = lazy(() => import("@/pages/llm/LlmPage"));
const TrafficPage = lazy(() => import("@/pages/traffic/TrafficPage"));
const PromptsPage = lazy(() => import("@/pages/prompts/PromptsPage"));
const ResearchPage = lazy(() => import("@/pages/prompts/ResearchPage"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const OpportunitiesPage = lazy(() => import("@/pages/opportunities/OpportunitiesPage"));
const ContentPage = lazy(() => import("@/pages/content/ContentPage"));
const ContentEditor = lazy(() => import("@/pages/content/ContentEditor"));
const SiteHealthPage = lazy(() => import("@/pages/site/SiteHealthPage"));
const PageDetail = lazy(() => import("@/pages/site/PageDetail"));
const IssuesPage = lazy(() => import("@/pages/site/IssuesPage"));
const AgentHome = lazy(() => import("@/pages/agent/AgentHome"));
const AgentChat = lazy(() => import("@/pages/agent/AgentChat"));
const SkillsPage = lazy(() => import("@/pages/agent/SkillsPage"));
const KnowledgePage = lazy(() => import("@/pages/knowledge/KnowledgePage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const SignIn = lazy(() => import("@/pages/auth/SignIn"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const Onboarding = lazy(() => import("@/pages/onboarding/Onboarding"));
const Welcome = lazy(() => import("@/pages/onboarding/Welcome"));
const KitPage = lazy(() => import("@/pages/kit/KitPage"));

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Auth + onboarding (no shell) */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/welcome" element={<Welcome />} />

      {/* App */}
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/insights/visibility" replace />} />
        <Route path="/insights" element={<Navigate to="/insights/visibility" replace />} />
        <Route path="/insights/:tab" element={<InsightsPage />} />
        <Route path="/llm" element={<LlmPage />} />
        <Route path="/traffic" element={<TrafficPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="/prompts/research" element={<ResearchPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/content/:id" element={<ContentEditor />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/site-health" element={<SiteHealthPage />} />
        <Route path="/site-health/page" element={<PageDetail />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="/agent" element={<AgentHome />} />
        <Route path="/agent/skills" element={<SkillsPage />} />
        <Route path="/agent/c/:id" element={<AgentChat />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
        <Route path="/settings/:section" element={<SettingsPage />} />
        <Route path="/kit" element={<KitPage />} />
        <Route path="*" element={<Navigate to="/insights/visibility" replace />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

/** Shown while a route chunk loads — keeps the frame colour so there's no flash. */
function RouteFallback() {
  return <div className="h-dvh bg-frame" />;
}
