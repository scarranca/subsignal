import type React from 'react';

export interface RoadmapProps {
    title: string;
    description: string;
    status: 'completed' | 'inProgress' | 'notStarted' | 'planned';
    date?: string;
}

interface RoadmapComponentProps {
    items: RoadmapProps[];
}

const RoadmapComponent: React.FC<RoadmapComponentProps> = ({ items }) => {
    const getStatusColor = (status: RoadmapProps['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'inProgress':
                return 'bg-blue-500';
            case 'notStarted':
                return 'bg-gray-500';
            case 'planned':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="max-w-2xl mx-auto text-left">
            <div className="flex flex-col gap-4">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-3 py-2">
                        <div
                            className={`h-2 w-2 shrink-0 rounded-full mt-2 ${getStatusColor(
                                item.status,
                            )}`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-4 mb-1">
                                <h3 className="font-medium text-lg">{item.title}</h3>
                                {item.date && (
                                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                                        {item.date}
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed text-left">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export { RoadmapComponent };
