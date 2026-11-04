# HYUZ Auto Snake Live · v0.1 DEMO

독립적인 자동 스네이크 게임, 12개 효과, 관리자 패널과 Mock 기프트 시뮬레이터입니다. 기존 Unity 게임은 변경하지 않습니다. 유료 서버 없이 PC 한 대에서 실행합니다.

**현재 범위는 Phase 1–3 개발 버전입니다. YouTube OAuth·Gift Receiver는 아직 구현하지 않았고 실제 기프트 검증 대기 상태입니다. OBS 실기기·24시간 안정성 검증도 미완료입니다.**

## Windows PowerShell 실행

Node.js 22.18 이상(권장 Node 24 LTS)을 설치합니다. 이 프로젝트 폴더를 Windows로 복사하거나 아래 소스 ZIP을 풀어 사용하세요. `/workspace`는 클라우드 경로이므로 Windows에는 존재하지 않습니다.

```powershell
cd C:\Projects\hyuz-auto-snake-live
npm install
npm run dev
```

- 게임: `http://localhost:5173/`
- OBS 게임 화면: `http://localhost:5173/overlay`
- 관리자: `http://localhost:5173/admin`
- 백엔드 상태: `http://localhost:3001/api/status`

한 터미널에서 프런트엔드·백엔드가 함께 실행됩니다. 종료는 Ctrl+C입니다. 포트는 현재 5173/3001 고정입니다. `localhost`와 `127.0.0.1`은 브라우저 저장소가 다르므로 한 주소를 일관되게 사용하세요. 외부 CDN이나 인터넷 없이 설치 후 게임이 실행됩니다.

배포 빌드 실행:

```powershell
npm run build
npm run start
```

배포 실행에서는 Vite 없이 백엔드가 빌드 파일도 제공합니다. 게임은 `http://localhost:3001/overlay`, 관리자는 `http://localhost:3001/admin`입니다. 개발 서버와 동시에 실행하면 3001 포트가 충돌하므로 먼저 종료하세요. 두 실행 모드는 원점이 달라 브라우저 게임 저장소가 따로 생성됩니다.

## 사용

1. 게임 화면 한 개를 열어 자동 플레이를 확인합니다. BFS와 도달 가능 영역 평가로 사과와 안전 경로를 선택합니다. 진행 불가능·목표 점수 달성·GAME OVER 효과에서 2.5초 후 다음 라운드로 넘어갑니다.
2. 별도 관리자 탭에서 `TEST APPLE RAIN`, `TEST TURBO` 등 12개 효과를 실행합니다. 효과 지속 시간·강도·이름·우선순위는 `packages/shared/gifts.ts`에서 조정합니다.
3. `TEST GIFT COMBO`는 동일 ID의 3→3→5 갱신으로 총 5회분만 접수되는지 검사합니다. `TEST 100 RANDOM GIFTS`는 100개를 큐에 넣습니다. 게임 오버와 지속 효과 때문에 모두 실행되기까지 시간이 걸립니다.
4. 모든 Mock 알림에는 **DEMO**가 붙습니다. 관리자 화면의 집계는 가상 기프트 단위 수이며 실제 후원이나 수익이 아닙니다. Jewels 예시 구간도 실제 가격표가 아닙니다.
5. 하단 `Local screen settings`를 열고 SOUND OFF 버튼을 눌러 음향을 활성화합니다. 사과·라운드·기프트에 자체 생성한 짧은 톤을 사용합니다. 브라우저 자동 재생 정책상 재시작·새로고침 후 음향을 다시 허용해야 할 수 있습니다. 관리자에서는 음향을 끌 수 있습니다.
6. 로컬 MP4를 선택해 상단에서 반복 재생할 수 있습니다. `RECORDED VIDEO` 표시, 음소거·반복·높이·숨김을 제공합니다. 영상 선택은 새로고침 시 유지되지 않습니다. 임의 위치 배치·BGM·테마 편집은 미구현입니다.

화면은 뷰포트에 맞춰 전체 UI를 축소하며 세로 1080×1920에서 잘리지 않도록 구성했습니다. 60FPS는 렌더링 목표이며 하드웨어 성능 보장은 아닙니다. 게임 이동은 기본 8칸/초로 렌더링과 별도 타이머에서 진행합니다. 난이도는 현재 이동 속도 프리셋(Normal 8, Fast 12)입니다.

## OBS 설정

OBS 기본·출력 캔버스를 1080×1920으로 설정하고 브라우저 소스를 추가하세요. 개발 모드는 위 5173 `/overlay`, 빌드 모드는 3001 `/overlay`를 사용하며 폭 1080, 높이 1920, FPS 60을 설정합니다. 운영에는 Vite 개발 모드보다 빌드 모드를 권장합니다.

- `소스가 보이지 않을 때 종료`와 `장면이 활성화되면 브라우저 새로고침`을 끄면 장면 전환 시 실행을 유지하는 데 도움이 됩니다.
- OBS가 브라우저를 종료하면 게임도 정지합니다. 다시 로드할 때 같은 브라우저 저장소에 남은 스냅샷을 복원합니다. 닫힌 동안의 이동은 재생하지 않습니다.
- 관리자 브라우저와 OBS 브라우저는 저장소가 다릅니다. 실제 운영 시 게임 화면은 OBS 한 개만 사용하세요. 여러 게임 화면은 서로 독립된 라운드를 실행하고 같은 기프트를 각각 받습니다. 현재 버전은 화면 간 공통 게임 상태 동기화를 제공하지 않습니다.
- 백엔드·인터넷 연결이 끊겨도 이미 열린 게임 화면은 계속 움직입니다. 백엔드 재접속 시 지수 백오프와 마지막 커서로 최대 1,000개 전달 이력을 복구합니다.
- OBS 오디오 제어를 켜고 브라우저 소스의 상호작용 기능으로 음향을 활성화해 확인하세요. 실제 OBS 음향·송출은 이 클라우드에서 검증하지 못했습니다.
- 게임 오버는 라운드만 바꿉니다. OBS 시작·종료·자동 재송출을 제어하지 않습니다. OBS 상태는 UNKNOWN으로 표시합니다.

## 데이터와 보안

서버는 `data/gifts.json`에 중복 처리 이력, 미전달 큐, 최근 전달 이력, 이름 매핑을 임시 파일+rename으로 저장합니다. `data/`는 Git에서 제외됩니다. 브라우저는 localStorage에 현재 라운드·점수·효과·대기 기프트·커서를 저장합니다. 저장 실패 시 복구 비활성 경고를 표시합니다. 강제 프로세스 종료나 저장 장치 고장에 대한 무손실 보장은 없습니다.

서버와 Vite는 127.0.0.1에만 바인딩합니다. 관리자 변경 API는 정확한 Host·Origin·JSON Content-Type을 확인하고, WebSocket은 수신 전용입니다. 원격 공개·포트 포워딩을 하지 마세요. 외부 이름은 React 텍스트로 렌더링합니다. 인증정보를 쓰거나 수집하는 기능은 아직 없습니다. `.env`, `auth/`, 토큰 파일은 Git에서 제외합니다.

큐 제한: 서버 256개, 클라이언트 1,000개, 알림 30개, 동시 지속 효과 최대 4개, 사과 40개, 폭탄 24개. 콤보 증분은 접수당 최대 100입니다. 포화 시 서버는 오류를 반환하고 새 이벤트를 처리 이력에 기록하지 않습니다. 서버 처리 속도는 초당 5개, 클라이언트 적용도 초당 최대 5회입니다. 우선순위는 먼저 전달된 이벤트를 추월하지 않습니다. 10,000개의 고유 이벤트 이력에 도달하면 임의로 중복 방지 기록을 지우지 않고 추가 접수를 중단합니다. DEMO 세션을 종료한 후 백업·초기화해야 하므로 현재 상태를 24시간 실방송용 무제한 큐로 간주하지 마세요.

새 브라우저는 연결 이전의 전달 완료 기프트를 재생하지 않습니다. 기존 브라우저는 epoch와 커서로 놓친 이벤트를 복구합니다. 재생 범위를 넘으면 화면에 경고합니다. 서버 저장소를 초기화하면 새 epoch로 구분합니다.

## 검증

```powershell
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

브라우저 검증은 먼저 `npm run dev`를 실행한 별도 터미널에서 수행합니다. Linux에서는 시스템 `/usr/bin/chromium`을 사용하고 Windows에서는 Playwright 설치 브라우저를 사용합니다. 필요하면 `$env:CHROMIUM_PATH`로 실행 파일을 지정합니다.

실제 30분 브라우저 검사(별도 실행 서버 필요):

```powershell
npm run test:soak
# 1시간 Mock 부하
$env:SOAK_MS="3600000"
$env:SOAK_GIFTS="1"
npm run test:soak
# 6시간: SOAK_MS=21600000 / 24시간: SOAK_MS=86400000
```

결과는 `test-results/soak.json`에 기록합니다. 시간 가속 엔진 테스트는 실제 30분·24시간 브라우저 검사와 다릅니다. 현재 실행 결과와 미완료 항목은 [테스트 보고서](docs/test-report.md)를 확인하세요.

## Phase 4: 다음 단계에 필요한 사용자 설정

현재 UI의 YouTube 상태는 의도적으로 미구현으로 표시합니다. Client ID나 토큰을 입력해도 연결되지 않습니다. 실제 수신기·OAuth 콜백을 개발하고 공식 응답 스키마를 확인한 다음 아래 설정을 사용해야 합니다.

1. Google Cloud 프로젝트에서 YouTube Data API v3를 활성화합니다.
2. OAuth 동의 화면을 구성하고 테스트 모드라면 채널 소유 계정을 테스트 사용자로 등록합니다.
3. 로컬 서버 콜백을 사용할 OAuth 클라이언트를 생성합니다. 정확한 클라이언트 유형·리디렉션 URI는 수신기 구현 단계에서 확정합니다. 임의 URI를 등록할 필요는 없습니다.
4. 브라우저에서 공식 OAuth 동의 흐름을 통해 본인 채널을 인증합니다. 비밀번호·Client Secret·Refresh Token을 채팅으로 보내지 마세요.
5. `youtube.readonly` 권한의 엔드포인트별 허용 범위를 확인하고 방송·liveChatId·공식 streamList를 연결합니다. Jewels·콤보 의미는 실제 공식 응답으로 검증하며 추측으로 곱하지 않습니다.
6. 실제 기프트 테스트는 기능 자격이 있는 테스트 방송에서 사용자 승인 후에만 진행합니다. 그 전까지 Mock으로 개발합니다.

공식 문서: [streamList](https://developers.google.com/youtube/data/live/reference/rest/v3/liveChatMessages/streamList), [Streaming guide](https://developers.google.com/youtube/data/live/streaming-live-chat), [Gifts eligibility](https://support.google.com/youtube/answer/15535963).

## GitHub 및 문제 해결

프로젝트는 독립 Git 저장소로 준비됩니다. 원격 업로드는 수행하지 않았습니다. 변경 검토 후 본인의 새 저장소에 연결할 수 있습니다.

```powershell
git init -b main
git status
git add .
git commit -m "Implement HYUZ auto snake demo phases 1-3"
git remote add origin https://github.com/YOUR_ACCOUNT/hyuz-auto-snake-live.git
git push -u origin main
```

- 포트 사용 중: 기존 `npm run dev` 또는 `npm run start` 터미널을 Ctrl+C로 종료하세요.
- 화면이 멈춤: 관리자 RESUME, AUTOPLAY ON을 확인하세요. 비활성 탭은 브라우저 정책으로 속도가 느려질 수 있습니다. OS 절전·최소화·OBS 소스 종료 상태에서는 60FPS를 보장할 수 없습니다.
- 관리자 조작이 안 됨: 게임 화면이 열려 있고 DEMO SERVER ONLINE인지 확인하세요. 명령은 현재 연결된 화면에만 전달하며 이후 연결 화면에 재실행하지 않습니다.
- 기프트가 늦게 적용됨: 활성 효과·대기 큐를 확인하세요. GAME OVER 다음 라운드에도 큐가 이어집니다. 알림은 최근 30개로 제한합니다.
- 저장소 손상: 서버가 시작 시 실패하면 `data/gifts.json`을 보존하고 백업에서 복원하세요. 파일을 삭제하면 중복 방지 이력도 사라집니다.
- 패키지 설치 실패: Node 버전과 네트워크 프록시를 확인하세요. TLS 검증을 끄지 마세요.
