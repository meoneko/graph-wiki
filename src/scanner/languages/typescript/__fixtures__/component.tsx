import React, { useState } from 'react';

export function Dashboard() {
  const [count, setCount] = useState(0);
  refresh();
  return <section>{count}</section>;
}

export const useDashboard = () => {
  refresh();
  return useState(1);
};

export const Card = () => <article />;
