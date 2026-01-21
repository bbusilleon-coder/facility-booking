# 시설물 예약 시스템

Next.js + Supabase 기반 시설물 예약 관리 시스템

## 🚀 배포 방법

### 1. Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. SQL Editor에서 `database/all-features.sql` 실행
3. Project Settings > API에서 URL과 anon key 복사

### 2. 로컬 실행

```bash
# 패키지 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 Supabase 정보 입력

# 개발 서버 실행
npm run dev
```

http://localhost:3000 접속

### 3. Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 저장소 연결
3. Environment Variables 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `EMAIL_USER` (선택)
   - `EMAIL_PASS` (선택)
4. Deploy 클릭

## 📋 기능 목록

### 사용자 기능
- ✅ 시설 목록 및 상세 보기
- ✅ 캘린더 예약
- ✅ 정기 예약 (주간/격주/월간)
- ✅ 예약 조회 (연락처로)
- ✅ 예약 확인서 PDF 출력
- ✅ QR 체크인
- ✅ 시설 즐겨찾기
- ✅ 예약 대기열 신청
- ✅ 이용 후기 작성
- ✅ 회원가입/로그인
- ✅ 캘린더 내보내기 (ICS)

### 관리자 기능
- ✅ 예약 승인/거절
- ✅ 예약 검색 (이름, 연락처, 날짜)
- ✅ 예약 연장/복사
- ✅ 시설물 CRUD
- ✅ 공지사항 관리
- ✅ 휴일 관리
- ✅ 다중 관리자 계정
- ✅ 대기열 관리
- ✅ 리뷰 관리
- ✅ 활동 로그
- ✅ 통계 대시보드
- ✅ Excel 내보내기

### 시스템 기능
- ✅ 이메일 알림 (승인/거절/새예약)
- ✅ 테마 색상 선택 (10가지)
- ✅ 라이트/다크 모드
- ✅ 모바일 반응형
- ✅ 부서별 예약 권한

## 🔑 기본 관리자 계정

- URL: `/admin/login`
- Username: `admin`
- Password: `1234`

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── admin/          # 관리자 페이지
│   ├── api/            # API 라우트
│   ├── auth/           # 사용자 로그인
│   ├── checkin/        # QR 체크인
│   ├── facilities/     # 시설 상세
│   └── reservation/    # 예약 조회
├── components/         # 재사용 컴포넌트
├── contexts/           # React Context
└── lib/               # 유틸리티
```

## 📞 문의

계룡대학습관(계룡)
- 주소: 32801 충남 계룡시 신도안3길 72
- TEL: 042-551-1543
- E-mail: pik8241@konyang.ac.kr
