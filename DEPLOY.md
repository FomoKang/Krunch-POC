# 배포 가이드 (Vercel)

## 1. GitHub에 푸시

```bash
git add .
git commit -m "Ready for deploy"
git push origin main
```

## 2. Vercel로 배포

### 방법 A: Vercel 웹 (추천)

1. [vercel.com](https://vercel.com) 접속 → 로그인 (GitHub 연동)
2. **Add New** → **Project**
3. **Import** `FomoKang/krunch-mockup` 저장소 선택
4. **Framework Preset**: Next.js (자동 감지)
5. **Deploy** 클릭

배포가 끝나면 `https://프로젝트명.vercel.app` 주소로 접속 가능합니다.

### 방법 B: Vercel CLI

```bash
npm i -g vercel
vercel
```

처음 실행 시 로그인 후, 프로젝트 폴더에서 배포할지 물어보면 **Y** → 배포 완료 후 URL이 출력됩니다.

---

- **Pink 모드**: `/`, `/auction`, `/community` 등
- **Black 모드**: `/black`, `/black/auction`, `/black/ranking` 등
