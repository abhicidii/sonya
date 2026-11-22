import type { ComponentType } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DownloadSimple, GraduationCap } from "@phosphor-icons/react";
import { Button, Tabs } from "@/components/ui";
import { FilterBar, useFilters, type Filters } from "@/components/shell/FilterBar";
import { PageHeader } from "@/components/shell/PageHeader";
import { useShell } from "@/components/shell/ShellContext";
import VisibilityTab from "./VisibilityTab";
import MentionsTab from "./MentionsTab";
import SentimentTab from "./SentimentTab";
import SourcesTab from "./SourcesTab";
import TopicsTab from "./TopicsTab";
import FanoutTab from "./FanoutTab";
import LocationTab from "./LocationTab";

const TABS: { value: string; label: string; C: ComponentType<{ filters: Filters }> }[] = [
  { value: "visibility", label: "Visibility", C: VisibilityTab },
  { value: "mentions", label: "Mentions & Citations", C: MentionsTab },
  { value: "sentiment", label: "Sentiment", C: SentimentTab },
  { value: "sources", label: "Sources", C: SourcesTab },
  { value: "topics", label: "Topics", C: TopicsTab },
  { value: "fanout", label: "Query Fanout", C: FanoutTab },
  { value: "location", label: "Location", C: LocationTab },
];

/** AEO Insights — page header, tab strip, shared filter bar, then the tab body. */
export default function InsightsPage() {
  const { tab = "visibility" } = useParams();
  const nav = useNavigate();
  const [filters, setFilters] = useFilters();
  const { openLearn } = useShell();
  const current = TABS.find((t) => t.value === tab);
  if (!current) return <Navigate to="/insights/visibility" replace />;
  const C = current.C;

  return (
    <>
      <PageHeader
        title="AEO Insights"
        actions={
          <>
            <Button variant="outlined" tone="secondary" iconLeft={<GraduationCap weight="duotone" className="size-4" />} onClick={() => openLearn("videos")}>
              Learn
            </Button>
            <Button iconLeft={<DownloadSimple weight="bold" className="size-4" />}>Export</Button>
          </>
        }
      />
      <div className="sticky top-0 z-20 bg-surface/95 px-5 backdrop-blur-sm">
        <Tabs value={tab} onChange={(v) => nav(`/insights/${v}`)} options={TABS.map(({ value, label }) => ({ value, label }))} />
      </div>
      <div className="border-b border-line px-5 py-3">
        <FilterBar value={filters} onChange={setFilters} />
      </div>
      <C key={tab} filters={filters} />
    </>
  );
}
