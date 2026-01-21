"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-bold text-xl text-gray-900">시설예약</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === "/" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                )}
              >
                시설물 목록
              </Link>
              <Link
                href="/reservation"
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname.startsWith("/reservation") ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                )}
              >
                내 예약조회
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin ? (
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                사용자 페이지
              </Link>
            ) : (
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
              >
                관리자
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
