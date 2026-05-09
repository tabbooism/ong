import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { InvestigationState } from '../types';

export function TargetDistribution({ state }: { state: InvestigationState }) {
  const data = Object.entries(state.targets).map(([name, values]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: values.length
  })).filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#141414', '#8b5cf6', '#ec4899'];

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center border border-dashed border-ink/20 text-[10px] uppercase font-mono opacity-50">
        No target data to distribute.
      </div>
    );
  }

  return (
    <div className="bg-white/50 border border-ink p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-50">Target Distribution</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#141414', 
                color: '#E4E3E0', 
                border: 'none',
                fontSize: '10px',
                fontFamily: 'monospace'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="square"
              formatter={(value) => <span className="text-[8px] font-mono uppercase text-ink">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
