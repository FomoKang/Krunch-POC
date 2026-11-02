# Krunch POC — 셀럽 의상 경매 & 정품인증 플랫폼

> 셀럽 실착 의상 경매 및 NFC 기반 정품 인증 라이프사이클을 검증하기 위한 풀스택 프로토타입(POC) 프로젝트입니다.

🔗 **Live Demo**: [krunch-mockup.vercel.app](https://krunch-mockup.vercel.app)

---

## 1. 프로젝트 개요 (Overview)

### 목적

K-POP 굿즈 시장에서 가장 큰 신뢰 문제인 **"실착 의상의 진위 여부"**를 기술로 풀어내기 위한 검증용 프로토타입입니다. 셀럽이 실제 착용한 의상(Artifact)을 1점 한정 경매로 거래하고, 수거 → 감정 → NFC 태깅 → 이력 공개로 이어지는 **정품 인증 라이프사이클 전체**를 하나의 서비스 안에서 검증하는 것을 목표로 했습니다. 단순한 목업이 아니라, 실제 운영을 가정한 관리자(Admin) 도구와 데이터 무결성 정책까지 포함한 풀스택 구현입니다.

### 담당 역할

1인 풀스택으로 기획부터 배포까지 전 과정을 수행했습니다.

- **프로덕트 기획**: 페르소나(팬/컬렉터) 정의, 경매·드로우·2차 마켓 시나리오 설계, Pink(일반몰)/Black(프리미엄) 2중 브랜드 라인 기획
- **시스템 아키텍처 설계**: Next.js App Router 기반 화면 구조, Supabase(PostgreSQL) 데이터 모델 및 RLS 권한 체계, Vercel 배포 파이프라인 설계
- **풀스택 구현**: 프론트엔드 UI/UX, API 라우트, Supabase 클라이언트/서버 데이터 레이어, 관리자 백오피스 구현
- **배포 파이프라인 구축**: GitHub - Vercel 연동 자동 배포 환경 구성 및 운영

### 핵심 요구사항

- 셀럽 실착 의상(Artifact)의 등록 → 경매 → 낙찰 → 정품 인증 → 이력 조회 전 과정 처리
- 하이브리드 경매(라이브 입찰 + 구매 즉시결제) 지원과 정산(Settlement) 견적 플로우
- 관리자 전용 백오피스에서 의상·경매·인증·미디어·이벤트·공개 범위를 통합 관리
- 역할 기반 접근 제어(RBAC)와 RLS를 통한 데이터 무결성 보장
- 모바일 퍼스트 UX: 모바일 뷰포트 변화(키보드, 주소창)에 흔들리지 않는 하단 내비게이션

---

## 2. 기술 스택 (Tech Stack)

| 영역 | 기술 |
| --- | --- |
| Framework | **Next.js (App Router)**, React 19 |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** v4, tw-animate-css |
| UI Components | **Radix UI** (shadcn/ui 구성) |
| Backend / DB | **Supabase** (PostgreSQL, Storage, Auth, RLS) |
| Deployment | **Vercel** (GitHub 연동 자동 배포) |

기타: `zod`(유효성 검증), `react-hook-form`, `@vercel/og`(OG 이미지 동적 생성), `@vercel/analytics`

---

## 3. 핵심 아키텍처 및 구현 (Key Implementations)

### 3-1. 하이브리드 경매 시스템 — Pink / Black 테마, 동적 액션 바

- **하이브리드 경매**: 동일한 경매 도메인 위에서 일반 몰(Pink)과 프리미엄 몰(Black)을 라우트(`/`, `/auction`, `/community` vs `/black`, `/black/auction`, `/black/ranking`)와 테마로 분리 운영. 레이아웃별 메타데이터(OG 이미지 포함)까지 브랜드별로 분기했습니다.
- **경매 상태 머신**: `draft → scheduled → live → settled` 등 경매 상태를 코드 레벨(`auction-storefront.ts`)과 DB 레벨(`storefront_hybrid_visibility.sql`)에서 이중으로 정규화해, 프론트의 노출 로직과 DB의 공개 정책이 어긋나지 않도록 설계했습니다.
- **동적 액션 바**: 하단 내비게이션/액션 바가 현재 테마(Pink/Black)와 활성 탭에 따라 색상·인디케이터를 동적으로 렌더링하고, `left` 트랜지션으로 탭 이동 시 인디케이터가 부드럽게 이동합니다.
- **정산(Settlement) 플로우**: 낙찰 후 중개수수료 정책, 배송·통관 정보(`shipping_and_customs` 테이블), Buy-Now 가드레일까지 낙찰 이후 단계를 데이터 모델로 처리합니다.

### 3-2. 모바일 뷰포트 최적화 (Visual Viewport 대응)

- 모바일 웹에서 주소창 수축·키보드 등장으로 인한 `visual viewport` 변화 시 하단 고정 내비게이션이 밀리거나 겹치는 문제를 `resize` 이벤트 기반 포지셔닝 재계산으로 수정하고, `[contain:layout]` 등 CSS containment로 리플로우 범위를 제한했습니다.
- `useIsMobile` 훅으로 브레이크포인트(768px)를 전역 일관되게 적용하고, 전 화면을 모바일 퍼스트(하단 탭 내비게이션, 풀폭 카드) 레이아웃으로 설계했습니다.

### 3-3. 데이터 모델링 및 자동화 배포 파이프라인

- **데이터 모델링**: Supabase Postgres 마이그레이션 14건으로 도메인을 단계적으로 모델링했습니다.
  - `profiles`, `favorite_items`(사용자 도메인)
  - 의상 아티팩트 + 미디어 자산 버킷(`media-assets` Storage)
  - 배송·통관(`shipping_and_customs`), 정산 견적·Buy-Now(`settlement_quotes`)
  - 운영 감사 및 무결성 강화(`harden_status_and_integrity`, `operational_audit_and_readiness`)
- **보안/권한**: 역할 기반 RLS(`add_role_based_rls`)로 관리자·일반 사용자 권한을 DB 레벨에서 강제하고, 초기 슈퍼 관리자 시드 마이그레이션으로 운영 부트스트래핑을 자동화했습니다. 인증 이력(해시 포함, `hashFile`)은 공개 레지스트리 API(`/api/public/registry`)로 최소 컬럼만 노출해 정보 공개 범위를 통제했습니다.
- **관리자 백오피스**: 의상·경매·인증·미디어 업로드·이벤트·공개 범위(disclosure)·역할 관리까지 단일 어드민 셸에서 처리하도록 구현해, 비개발자도 운영 가능한 구조를 검증했습니다.
- **자동화 배포**: GitHub `main` 브랜치 푸시 → Vercel 자동 빌드/배포 파이프라인으로, 모든 기능 변경이 즉시 라이브 데모 환경에 반영됩니다.

---

## 4. 로컬 실행 방법 (Quick Start)

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

- 일반 몰(Pink): `/`
- 프리미엄 몰(Black): `/black`
- 관리자: `/admin`

Supabase 연동이 필요한 기능(로그인, 관리자, 경매 데이터)은 프로젝트 루트에 `.env.local`을 아래 예시처럼 구성해야 합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=media-assets
```

---

## 5. 주요 화면 구조

```
app/
├── page.tsx                 # Pink 홈
├── auction/ ranking/ draw/  # 경매 · 랭킹 · 드로우
├── market/ community/       # 2차 마켓 · 커뮤니티
├── black/                   # Black 프리미엄 몰 (독립 레이아웃/테마)
├── admin/                   # 백오피스 (의상·경매·인증·미디어·역할 관리)
└── api/public/registry/     # 정품 인증 공개 레지스트리 API
```
