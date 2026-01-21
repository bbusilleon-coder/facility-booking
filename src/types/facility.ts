// 시설물 특성 타입
export interface FacilityFeatures {
  wifi?: boolean;          // 무선인터넷
  audio?: boolean;         // 음향시스템
  lectern?: boolean;       // 전자교탁
  projector?: boolean;     // 프로젝터
  whiteboard?: boolean;    // 화이트보드
  aircon?: boolean;        // 냉난방
  parking?: boolean;       // 주차가능
  accessible?: boolean;    // 장애인 편의시설
}

// 시설물 특성 라벨
export const FEATURE_LABELS: Record<keyof FacilityFeatures, string> = {
  wifi: "무선인터넷",
  audio: "음향시스템",
  lectern: "전자교탁",
  projector: "프로젝터",
  whiteboard: "화이트보드",
  aircon: "냉난방",
  parking: "주차가능",
  accessible: "장애인 편의시설",
};

// 시설물 타입
export interface Facility {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
  min_people: number;
  max_people: number;
  features: FacilityFeatures | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 시설물 생성/수정 폼 데이터
export interface FacilityFormData {
  name: string;
  location: string;
  description: string;
  image_url: string;
  images: string[];
  min_people: number;
  max_people: number;
  features: FacilityFeatures;
  is_active: boolean;
}

// 시설물 생성 요청
export type FacilityCreateInput = Omit<Facility, "id" | "created_at" | "updated_at">;

// 시설물 수정 요청
export type FacilityUpdateInput = Partial<FacilityCreateInput>;
