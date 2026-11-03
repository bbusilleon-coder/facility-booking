const paths: Record<string, string> = {
  '/admin': 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  '/admin/facilities': 'M4 21V5l8-3 8 3v16 M9 21v-5h6v5 M8 7h1 M15 7h1 M8 11h1 M15 11h1',
  '/admin/members': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4',
  '/admin/statistics': 'M4 20h17 M7 16v-5 M12 16V4 M17 16V8',
  '/admin/reviews': 'm12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z',
  '/admin/waitlist': 'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  '/admin/notices': 'm4 10 15-6v16L4 14z M4 10v4 M7 15l2 6',
  '/admin/logs': 'M8 3H5v18h14V3h-3 M8 2h8v4H8z M8 11h8 M8 16h5',
  '/admin/settings': 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
};
export default function AdminIcon({ name }: { name: string }) {
  const alias: Record<string, string> = { '전체 시설물': '/admin/facilities', '활성 시설물': '/admin/facilities', '승인 대기': '/admin/waitlist', '전체 예약': '/admin/statistics', '/admin/users': '/admin/members' };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[alias[name] || name] || 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 11h16 M8 15h2 M14 15h2'} /></svg>;
}
