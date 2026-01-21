# 시설물 예약관리 시스템 - 프로젝트 구조

## 📁 디렉토리 트리

```
facility-booking/
├── .env.local                    # 환경변수 (Supabase 키)
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   └── images/                   # 정적 이미지
│
└── src/
    ├── app/
    │   ├── layout.tsx            # 루트 레이아웃
    │   ├── page.tsx              # 메인 페이지 (시설물 목록)
    │   ├── globals.css           # 전역 스타일
    │   │
    │   ├── facilities/
    │   │   └── [id]/
    │   │       └── page.tsx      # 시설물 상세 + 예약 캘린더
    │   │
    │   ├── reservation/
    │   │   ├── page.tsx          # 내 예약 조회 (일반 사용자)
    │   │   └── [id]/
    │   │       └── page.tsx      # 예약 상세/수정
    │   │
    │   ├── admin/
    │   │   ├── layout.tsx        # 관리자 레이아웃 (사이드바)
    │   │   ├── page.tsx          # 관리자 대시보드
    │   │   │
    │   │   ├── facilities/
    │   │   │   ├── page.tsx      # 시설물 목록 관리
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx  # 시설물 등록
    │   │   │   └── [id]/
    │   │   │       └── page.tsx  # 시설물 수정
    │   │   │
    │   │   └── reservations/
    │   │       ├── page.tsx      # 예약 목록 (승인/거절)
    │   │       └── [id]/
    │   │           └── page.tsx  # 예약 상세/수정
    │   │
    │   └── api/
    │       ├── facilities/
    │       │   ├── route.ts              # GET: 목록, POST: 생성
    │       │   └── [id]/
    │       │       └── route.ts          # GET/PUT/DELETE: 개별
    │       │
    │       ├── reservations/
    │       │   ├── route.ts              # GET: 목록, POST: 생성
    │       │   ├── public/
    │       │   │   └── route.ts          # 공개 예약 조회 (캘린더용)
    │       │   └── [id]/
    │       │       ├── route.ts          # GET/PUT/DELETE
    │       │       └── status/
    │       │           └── route.ts      # PATCH: 상태변경 (승인/거절)
    │       │
    │       └── upload/
    │           └── route.ts              # 이미지 업로드
    │
    ├── components/
    │   ├── ui/                           # 공통 UI 컴포넌트
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Badge.tsx
    │   │   └── Card.tsx
    │   │
    │   ├── layout/
    │   │   ├── Header.tsx                # 상단 헤더
    │   │   ├── AdminSidebar.tsx          # 관리자 사이드바
    │   │   └── Footer.tsx
    │   │
    │   ├── facility/
    │   │   ├── FacilityCard.tsx          # 시설물 카드
    │   │   ├── FacilityForm.tsx          # 시설물 등록/수정 폼
    │   │   ├── FacilityFeatures.tsx      # 시설 특성 체크박스
    │   │   └── FacilityImageUpload.tsx   # 이미지 업로드
    │   │
    │   ├── reservation/
    │   │   ├── ReservationForm.tsx       # 예약 신청 폼
    │   │   ├── ReservationCalendar.tsx   # 예약 캘린더
    │   │   ├── ReservationTable.tsx      # 예약 목록 테이블
    │   │   └── ReservationStatusBadge.tsx
    │   │
    │   └── admin/
    │       └── ReservationApprovalCard.tsx  # 승인/거절 카드
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts                 # 클라이언트용 Supabase
    │   │   └── server.ts                 # 서버용 Supabase
    │   │
    │   ├── utils/
    │   │   ├── date.ts                   # 날짜 유틸
    │   │   └── format.ts                 # 포맷팅 유틸
    │   │
    │   └── validations/
    │       ├── facility.ts               # 시설물 유효성검사
    │       └── reservation.ts            # 예약 유효성검사
    │
    └── types/
        ├── facility.ts                   # 시설물 타입
        ├── reservation.ts                # 예약 타입
        └── database.ts                   # Supabase 테이블 타입
```

## 🗄️ Supabase 테이블 구조

### facilities (시설물)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 시설물 ID |
| name | text | 시설물명 |
| location | text | 위치 |
| description | text | 설명 |
| image_url | text | 대표 이미지 URL |
| images | jsonb | 추가 이미지 배열 |
| min_people | int | 최소 인원 |
| max_people | int | 최대 인원 |
| features | jsonb | 시설 특성 (wifi, audio, lectern 등) |
| is_active | boolean | 활성화 여부 |
| created_at | timestamptz | 생성일시 |
| updated_at | timestamptz | 수정일시 |

### reservations (예약)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 예약 ID |
| facility_id | uuid (FK) | 시설물 ID |
| start_at | timestamptz | 시작 일시 |
| end_at | timestamptz | 종료 일시 |
| status | text | 상태 (pending/approved/rejected/cancelled) |
| purpose | text | 사용 목적 |
| attendees | int | 참석 인원 |
| applicant_name | text | 신청자 이름 |
| applicant_phone | text | 연락처 |
| applicant_email | text | 이메일 |
| applicant_dept | text | 소속/부서 |
| notes | text | 비고 |
| admin_memo | text | 관리자 메모 |
| created_at | timestamptz | 신청일시 |
| updated_at | timestamptz | 수정일시 |
| approved_at | timestamptz | 승인일시 |
| approved_by | text | 승인자 |

## 📊 예약 상태 흐름
```
pending (대기중) 
  → approved (승인됨)
  → rejected (거절됨)
  → cancelled (취소됨)
```
