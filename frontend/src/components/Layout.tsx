import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './Layout.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Header />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
