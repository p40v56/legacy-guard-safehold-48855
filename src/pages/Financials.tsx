import DashboardLayout from '@/components/layout/DashboardLayout';
import { Landmark } from 'lucide-react';
import FinancialsTab from '@/components/financials/FinancialsTab';

const Financials = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center">
              <Landmark className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-medium text-card-foreground">Financial Assets</h1>
              <p className="text-muted-foreground">Your financial legacy — banks, insurance, investments and property</p>
            </div>
          </div>
        </div>

        <FinancialsTab />
      </div>
    </DashboardLayout>
  );
};

export default Financials;
