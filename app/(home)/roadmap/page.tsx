import { RoadmapComponent, type RoadmapProps } from '@/components/home/roadmap';
import Footer from '@/components/home/footer';

const roadmapItems: RoadmapProps[] = [
    {
        title: 'enterprise integrations',
        description: 'native integrations with CRM, slack, and deal intelligence platforms.',
        status: 'planned',
        date: '2025',
    },
    {
        title: 'api platform',
        description: 'programmatic access to monitoring data and briefing generation.',
        status: 'planned',
        date: '2025',
    },
    {
        title: 'advanced team features',
        description: 'role-based access control, shared briefings, and collaborative annotations.',
        status: 'planned',
        date: 'Q4 2025',
    },
    {
        title: 'team collaboration plans',
        description: 'multi-tenant architecture with team management and shared workspaces.',
        status: 'planned',
        date: 'Q4 2025',
    },
    {
        title: 'zapier integration',
        description: 'automate company ingestion and alert distribution through zapier workflows.',
        status: 'inProgress',
        date: 'Q4 2025',
    },
    {
        title: 'email-based company ingestion',
        description: 'add companies to monitoring via email submissions and requests.',
        status: 'completed',
        date: 'Q4 2025',
    },
    {
        title: 'email integration',
        description: 'deliver insights and alerts directly via email notifications.',
        status: 'completed',
        date: 'Q3 2025',
    },
    {
        title: 'briefing archives',
        description: 'historical archive system for tracking briefing evolution over time.',
        status: 'completed',
        date: 'Q3 2025',
    },
    {
        title: 'executive briefings',
        description: 'generate high-level company briefings and market summaries.',
        status: 'completed',
        date: 'Q3 2025',
    },
    {
        title: 'company narrative generation',
        description: 'transform page-level changes into coherent company-level stories.',
        status: 'completed',
        date: 'Q2 2025',
    },
    {
        title: 'enhanced diff algorithm',
        description: 'improved change detection to reduce false positives and noise.',
        status: 'completed',
        date: 'Q2 2025',
    },
    {
        title: 'multimodal content processing',
        description: 'process both text and image content for comprehensive monitoring.',
        status: 'completed',
        date: 'Q2 2025',
    },
    {
        title: 'resilient web scraping',
        description: 'bot-resistant scraping engine that handles ads and dynamic content.',
        status: 'completed',
        date: 'Q1 2025',
    },
    {
        title: 'signal detection system',
        description: 'identify and capture meaningful signals from monitored companies.',
        status: 'completed',
        date: 'Q1 2025',
    },
    {
        title: 'company monitoring foundation',
        description: 'essential features for tracking companies and detecting changes.',
        status: 'completed',
        date: 'Q1 2025',
    },
];

export default function Roadmap() {
    return (
        <>
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-start px-12 text-center">
                <div className="mb-8 flex flex-col items-center justify-center gap-6 text-center">
                    <h1 className="font-dm-sans font-medium text-4xl leading-tight tracking-[-2px] md:text-6xl">
                        <span className="relative">
                            <span className="relative z-10 text-black">Roadmap</span>
                            <span className="-translate-y-1/2 -rotate-1 -z-10 absolute inset-0 top-1/2 transform rounded-md bg-yellow-200 py-6 md:py-8" />
                        </span>
                    </h1>
                    <p className="md:text-lg max-w-2xl text-muted-foreground">
                        See what&apos;s coming next and help shape our development priorities.
                    </p>
                </div>
                <div className="w-full text-left">
                    <RoadmapComponent items={roadmapItems} />
                </div>
            </div>
            <Footer />
        </>
    );
}
