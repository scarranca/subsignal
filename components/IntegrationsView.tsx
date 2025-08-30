'use client';

import { IntegrationCard } from '@/components/ui/integration-card';
import { toast } from 'sonner';

export function IntegrationsView() {
    return (
        <div className="flex-1 px-4 md:px-8 py-6 bg-white min-h-screen">
            <div className="max-w-4xl space-y-12">
                {/* Integrations */}
                <div>
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage your Integrations</p>
                    </div>

                    <div className="space-y-6">
                        <IntegrationCard
                            title="Zapier"
                            description="Connect Subsignal to Zapier"
                            buttonText="Request"
                            onButtonClick={() =>
                                toast.success('Rolling out Zapier access. Stay tuned!')
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
