# 가계부 애플리케이션 PRD (Product Requirements Document)

## 1. 프로젝트 개요
사용자가 자신의 수입과 지출을 기록, 분류, 분석할 수 있는 웹 기반의 '스마트 가계부' 애플리케이션입니다.

## 2. 핵심 기술 스택
- **Frontend**: React (18+), TypeScript, Tailwind CSS, Vite, Zustand
- **Backend**: Node.js (20+), Express.js, TypeScript
- **Database**: SQLite, Prisma ORM

## 3. 데이터 모델
### Transaction
- `id`: 고유 식별자 (UUID 또는 자동 증가)
- `amount`: 금액 (정수)
- `type`: 수입/지출 (`INCOME` / `EXPENSE`)
- `date`: 날짜 및 시간
- `memo`: 선택적 메모
- `categoryId`: Category에 대한 외래 키

### Category
- `id`: 고유 식별자
- `name`: 카테고리명
- `type`: 수입/지출 (`INCOME` / `EXPENSE`)

## 4. 핵심 기능 요구사항
1. **내역 기록**: 수입 및 지출 내역을 금액, 카테고리, 날짜, 메모와 함께 기록합니다.
2. **내역 조회**: 기록된 내역을 리스트 형태로 조회합니다.
3. **카테고리 관리**: 수입/지출 카테고리를 추가하고 관리합니다.
4. **통계 및 분석**: 기간별 수입/지출 통계를 제공합니다.

## 5. 비기능 요구사항
- 주어진 요구사항 범위를 벗어나는 기능(소셜 로그인 등) 제외.
- 백엔드 API에 기본적인 통합 테스트 포함.
