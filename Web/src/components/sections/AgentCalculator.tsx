'use client';

import { useState } from 'react';

const formatRupees = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`;

export function AgentCalculator() {
  const [salary, setSalary] = useState(38000);
  const [hours, setHours] = useState(8);
  const [plan, setPlan] = useState(12000);
  const staffHours = hours * 22;
  const agentHours = 24 * 30;

  return (
    <div className="calculator">
      <div className="calculator-heading">
        <div>
          <p className="eyebrow">An editable illustration</p>
          <h3>Compare monthly coverage costs.</h3>
        </div>
        <span className="illustrative-tag">Illustrative only</span>
      </div>
      <p className="calculator-note">Change the assumptions to reflect your own costs. This is not a promise of savings or a quote.</p>
      <div className="calculator-controls">
        <label>
          <span>Monthly staff salary <b>{formatRupees(salary)}</b></span>
          <input aria-label="Monthly staff salary in rupees" type="range" min="15000" max="100000" step="1000" value={salary} onChange={(event) => setSalary(Number(event.target.value))} />
        </label>
        <label>
          <span>Staffed hours per day <b>{hours} hrs</b></span>
          <input aria-label="Staffed hours per day" type="range" min="4" max="12" step="1" value={hours} onChange={(event) => setHours(Number(event.target.value))} />
        </label>
        <label>
          <span>Illustrative agent plan <b>{formatRupees(plan)}</b></span>
          <input aria-label="Illustrative agent plan in rupees" type="range" min="5000" max="50000" step="1000" value={plan} onChange={(event) => setPlan(Number(event.target.value))} />
        </label>
      </div>
      <div className="calculator-results" aria-live="polite">
        <div><span>Staff cost per working hour</span><strong>{formatRupees(salary / staffHours)}</strong></div>
        <div><span>Illustrative agent cost per coverage hour</span><strong>{formatRupees(plan / agentHours)}</strong></div>
        <p>The agent handles first-line enquiries; your team handles the rest.</p>
      </div>
    </div>
  );
}
